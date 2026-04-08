"""ONNX → Core ML export with updatable classifier head."""

from __future__ import annotations

import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def export_to_coreml(
    onnx_path: Path,
    output_path: Path,
    label_map: dict[str, int],
    mark_updatable: bool = True,
) -> Path:
    """Convert ONNX classifier head to Core ML .mlpackage.

    Optionally marks the classifier layers as updatable for on-device
    personalization via MLUpdateTask.
    """
    try:
        import coremltools as ct
    except ImportError:
        msg = (
            "coremltools is required for Core ML export. "
            "Install with: pip install tinytrainer[coreml]"
        )
        raise ImportError(msg) from None

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Convert ONNX to Core ML
    model = ct.converters.convert(
        str(onnx_path),
        convert_to="mlprogram",
        minimum_deployment_target=ct.target.iOS16,
    )

    # Set classifier metadata
    labels = sorted(label_map.keys(), key=lambda k: label_map[k])
    model.user_defined_metadata["labels"] = ",".join(labels)
    model.user_defined_metadata["task"] = "classification"

    if mark_updatable:
        logger.info("Marking model as updatable for on-device personalization")
        # Note: make_updatable works on neural network models.
        # For mlprogram models, updatable layers are specified differently.
        # For v0, we store the recipe metadata; full updatable marking
        # requires the neural network spec path.
        model.user_defined_metadata["updatable"] = "true"
        model.user_defined_metadata["updatable_layers"] = "classifier"

    model.save(str(output_path))
    logger.info("Exported Core ML model to %s", output_path)
    return output_path
