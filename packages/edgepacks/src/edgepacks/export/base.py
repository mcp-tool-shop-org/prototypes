"""Export protocol and shared rendering helpers."""

from __future__ import annotations

import json
from enum import StrEnum
from pathlib import Path
from typing import Any, Protocol

from edgepacks.schema.example import Example
from edgepacks.schema.pack import PackSpec


class ExportFormat(StrEnum):
    JSONL = "jsonl"
    HUGGINGFACE = "huggingface"
    UNSLOTH = "unsloth"
    TORCHTUNE = "torchtune"


class Exporter(Protocol):
    """Protocol for format-specific exporters."""

    format_name: str

    def export(
        self,
        pack: PackSpec,
        examples: list[Example],
        output_dir: Path,
        split_name: str = "train",
    ) -> Path: ...


def render_input(example: Example, pack: PackSpec) -> str:
    """Render an example's structured input into natural language text.

    Uses the pack's instruction_template if it has {field} placeholders,
    otherwise falls back to JSON dump.
    """
    template = pack.instruction_template
    try:
        return template.format(**example.input)
    except (KeyError, IndexError):
        # Fallback: dump input as readable text
        parts = []
        for k, v in example.input.items():
            if isinstance(v, str):
                parts.append(f"{k}: {v}")
            else:
                parts.append(f"{k}: {json.dumps(v)}")
        return "\n".join(parts)


def render_output(example: Example, _pack: PackSpec) -> str:
    """Render an example's structured output into text for training."""
    return json.dumps(example.output, ensure_ascii=False)


def render_system(pack: PackSpec) -> str:
    """Extract the system instruction from the pack's instruction template.

    Returns the template portion before any {field} placeholders.
    """
    template = pack.instruction_template
    # Find first placeholder
    brace_idx = template.find("{")
    if brace_idx > 0:
        system = template[:brace_idx].rstrip()
        # Remove trailing "User request:" or similar
        for suffix in ["User request:", "Error:", "Text:", "Input:"]:
            if system.endswith(suffix):
                system = system[: -len(suffix)].rstrip()
                break
        return system
    return template


def get_split_examples(
    pack: PackSpec, split_name: str = "all"
) -> list[Example]:
    """Get examples for a specific split.

    If split info is available in generation_config, use it.
    Otherwise return all examples.
    """
    split_info = pack.generation_config.get("_split_result")
    if not split_info or split_name == "all":
        return list(pack.examples)

    train_count = split_info["train_count"]
    val_count = split_info["val_count"]

    if split_name == "train":
        return list(pack.examples[:train_count])
    elif split_name == "val":
        return list(pack.examples[train_count : train_count + val_count])
    elif split_name == "test":
        return list(pack.examples[train_count + val_count :])
    return list(pack.examples)


def get_exporter(fmt: ExportFormat) -> Exporter:
    """Get the appropriate exporter for a format."""
    from edgepacks.export.huggingface import HuggingFaceExporter
    from edgepacks.export.jsonl import JsonlExporter
    from edgepacks.export.torchtune import TorchtuneExporter
    from edgepacks.export.unsloth import UnslothExporter

    exporters: dict[ExportFormat, Any] = {
        ExportFormat.JSONL: JsonlExporter(),
        ExportFormat.HUGGINGFACE: HuggingFaceExporter(),
        ExportFormat.UNSLOTH: UnslothExporter(),
        ExportFormat.TORCHTUNE: TorchtuneExporter(),
    }
    return exporters[fmt]
