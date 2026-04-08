"""Training kit packaging — .kit.zip bundles."""

from __future__ import annotations

import json
import logging
import zipfile
from datetime import UTC, datetime
from pathlib import Path

from tinytrainer.schema.config import TrainConfig
from tinytrainer.schema.kit import KitManifest, Recipe, TokenizerRef

logger = logging.getLogger(__name__)


def package_kit(
    model_dir: Path,
    output_path: Path,
    tokenizer_ref: TokenizerRef,
    export_paths: dict[str, Path] | None = None,
    recipe: Recipe | None = None,
    eval_scores: dict[str, float] | None = None,
    pack_name: str | None = None,
    pack_version: str | None = None,
) -> Path:
    """Create a .kit.zip training kit bundle.

    Contents:
      manifest.json, config.json, label_map.json, recipe.json,
      tokenizer_ref.json, train_result.json, model.onnx, model.mlpackage/
    """
    output_path = Path(output_path)
    model_dir = Path(model_dir)

    # Load config and label map from model_dir
    with open(model_dir / "config.json") as f:
        config_data = json.load(f)
    config = TrainConfig.model_validate(config_data)

    with open(model_dir / "label_map.json") as f:
        label_map = json.load(f)

    # Build manifest
    manifest = KitManifest(
        task_type="classification",
        label_space=sorted(label_map.keys(), key=lambda k: label_map[k]),
        num_labels=len(label_map),
        backbone=config.backbone,
        head_type=config.head_type,
        training_config=config_data,
        pack_name=pack_name,
        pack_version=pack_version,
        trained_at=datetime.now(UTC),
        eval_scores=eval_scores or {},
        device_targets=list(export_paths.keys()) if export_paths else [],
    )

    # Default recipe
    if recipe is None:
        recipe = Recipe(
            updatable_layers=["classifier.weight", "classifier.bias"],
            max_epochs=10,
            min_examples_to_retrain=5,
        )

    # Write zip
    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("manifest.json", manifest.model_dump_json(indent=2))
        zf.writestr("config.json", json.dumps(config_data, indent=2))
        zf.writestr("label_map.json", json.dumps(label_map, indent=2))
        zf.writestr("recipe.json", recipe.model_dump_json(indent=2))
        zf.writestr("tokenizer_ref.json", tokenizer_ref.model_dump_json(indent=2))

        # Include train_result if available
        result_path = model_dir / "train_result.json"
        if result_path.exists():
            zf.write(result_path, "train_result.json")

        # Include exported models
        if export_paths:
            for fmt, path in export_paths.items():
                path = Path(path)
                if path.is_file():
                    zf.write(path, f"model.{fmt}")
                elif path.is_dir():
                    # Core ML .mlpackage is a directory
                    for file in path.rglob("*"):
                        if file.is_file():
                            arcname = f"model.mlpackage/{file.relative_to(path)}"
                            zf.write(file, arcname)

    logger.info("Packaged training kit to %s", output_path)
    return output_path


def read_kit_manifest(kit_path: Path) -> KitManifest:
    """Read the manifest from a .kit.zip file."""
    with zipfile.ZipFile(kit_path, "r") as zf:
        manifest_data = json.loads(zf.read("manifest.json"))
    return KitManifest.model_validate(manifest_data)
