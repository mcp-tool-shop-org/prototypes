"""JSONL exporter — canonical interchange format."""

from __future__ import annotations

import json
from pathlib import Path

from edgepacks.export.base import render_input
from edgepacks.schema.example import Example
from edgepacks.schema.pack import PackSpec


class JsonlExporter:
    """Export examples as one JSON object per line."""

    format_name = "jsonl"

    def export(
        self,
        pack: PackSpec,
        examples: list[Example],
        output_dir: Path,
        split_name: str = "train",
    ) -> Path:
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f"{split_name}.jsonl"

        with open(output_path, "w", encoding="utf-8") as f:
            for ex in examples:
                row = {
                    "instruction": render_input(ex, pack),
                    "input": ex.input,
                    "output": ex.output,
                    "metadata": {
                        "source": ex.source,
                        "pack": pack.name,
                        "quality_score": ex.quality_score,
                    },
                }
                f.write(json.dumps(row, ensure_ascii=False) + "\n")

        return output_path
