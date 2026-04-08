"""HuggingFace datasets exporter — messages format compatible with datasets.load_dataset."""

from __future__ import annotations

import json
from pathlib import Path

from edgepacks.export.base import render_input, render_output, render_system
from edgepacks.schema.example import Example
from edgepacks.schema.pack import PackSpec


class HuggingFaceExporter:
    """Export in HuggingFace datasets messages format."""

    format_name = "huggingface"

    def export(
        self,
        pack: PackSpec,
        examples: list[Example],
        output_dir: Path,
        split_name: str = "train",
    ) -> Path:
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f"{split_name}.jsonl"

        system_msg = render_system(pack)

        with open(output_path, "w", encoding="utf-8") as f:
            for ex in examples:
                row = {
                    "messages": [
                        {"role": "system", "content": system_msg},
                        {"role": "user", "content": render_input(ex, pack)},
                        {"role": "assistant", "content": render_output(ex, pack)},
                    ]
                }
                f.write(json.dumps(row, ensure_ascii=False) + "\n")

        # Write dataset_info.json
        info_path = output_dir / "dataset_info.json"
        if not info_path.exists():
            info = {
                "description": pack.description,
                "license": pack.license,
                "features": {
                    "messages": {
                        "dtype": "list",
                        "value": {
                            "dtype": "dict",
                            "keys": ["role", "content"],
                        },
                    }
                },
                "splits": {},
            }
            with open(info_path, "w", encoding="utf-8") as f:
                json.dump(info, f, indent=2)

        return output_path
