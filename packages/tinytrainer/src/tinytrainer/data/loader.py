"""Load (text, label) pairs from edgepacks or JSONL."""

from __future__ import annotations

import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def load_from_pack(
    pack_name: str,
    split: str = "train",
    label_field: str | None = None,
) -> tuple[list[str], list[str]]:
    """Load texts and labels from an edgepacks pack.

    Returns (texts, labels) where each is a list of strings.
    """
    from edgepacks.export.base import get_split_examples, render_input
    from edgepacks.packs import discover_packs

    packs = discover_packs()
    if pack_name not in packs:
        msg = f"Pack '{pack_name}' not found. Available: {list(packs.keys())}"
        raise ValueError(msg)

    pack_obj = packs[pack_name]
    spec = pack_obj.spec()
    examples = get_split_examples(spec, split)

    texts: list[str] = []
    labels: list[str] = []

    for ex in examples:
        text = render_input(ex, spec)
        texts.append(text)

        # Extract label from output
        label = _extract_label(ex.output, spec.label_space, label_field)
        if label is not None:
            labels.append(label)
        else:
            logger.warning("Could not extract label from example output: %s", ex.output)
            texts.pop()  # Remove the text we just added

    logger.info("Loaded %d examples from pack '%s' (split=%s)", len(texts), pack_name, split)
    return texts, labels


def _extract_label(
    output: dict,
    label_space: list[str] | None,
    label_field: str | None = None,
) -> str | None:
    """Extract the label string from an example's output dict."""
    # If explicit field specified, use it
    if label_field and label_field in output:
        return str(output[label_field])

    # Try common field names
    for key in ("label", "category", "tool", "class", "type"):
        if key in output:
            val = output[key]
            if isinstance(val, str):
                if label_space is None or val in label_space:
                    return val

    # Fallback: first string value that's in label_space
    if label_space:
        for val in output.values():
            if isinstance(val, str) and val in label_space:
                return val

    # Last resort: first string value
    for val in output.values():
        if isinstance(val, str):
            return val

    return None


def load_from_jsonl(
    path: Path,
    text_field: str = "text",
    label_field: str = "label",
) -> tuple[list[str], list[str]]:
    """Load texts and labels from a JSONL file.

    Each line must be a JSON object with at least `text_field` and `label_field`.
    """
    texts: list[str] = []
    labels: list[str] = []

    with open(path, encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
            except json.JSONDecodeError:
                logger.warning("Skipping invalid JSON on line %d", line_num)
                continue

            if text_field not in data:
                logger.warning("Missing '%s' on line %d", text_field, line_num)
                continue
            if label_field not in data:
                logger.warning("Missing '%s' on line %d", label_field, line_num)
                continue

            texts.append(str(data[text_field]))
            labels.append(str(data[label_field]))

    logger.info("Loaded %d examples from %s", len(texts), path)
    return texts, labels
