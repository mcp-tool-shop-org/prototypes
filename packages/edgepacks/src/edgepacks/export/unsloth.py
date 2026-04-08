"""Unsloth exporter — ShareGPT-style conversations for Unsloth fine-tuning."""

from __future__ import annotations

import json
from pathlib import Path

from edgepacks.export.base import render_input, render_output, render_system
from edgepacks.schema.example import Example
from edgepacks.schema.pack import PackSpec


class UnslothExporter:
    """Export in Unsloth/ShareGPT conversation format."""

    format_name = "unsloth"

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
                    "conversations": [
                        {"from": "system", "value": system_msg},
                        {"from": "human", "value": render_input(ex, pack)},
                        {"from": "gpt", "value": render_output(ex, pack)},
                    ]
                }
                f.write(json.dumps(row, ensure_ascii=False) + "\n")

        return output_path
