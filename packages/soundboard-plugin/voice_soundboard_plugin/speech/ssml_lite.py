"""SSML-lite parser — strict allowlist, safe fallback.

Parses a restricted subset of SSML tags into an internal node tree.
On parse error, falls back to plain text with a warning.
Uses stdlib xml.etree.ElementTree (no defusedxml needed — input from Claude, not web).
"""

from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import Any

from voice_soundboard_plugin.speech.types import SpeechWarning

# Hard limits
MAX_SSML_INPUT_CHARS = 15_000
MAX_SSML_NODES = 200
MAX_BREAK_DURATION_MS = 2000
MAX_NESTING_DEPTH = 10

# Strength → milliseconds mapping
STRENGTH_MS = {
    "none": 0,
    "x-weak": 50,
    "weak": 100,
    "medium": 250,
    "strong": 500,
    "x-strong": 1000,
}


# ---------------------------------------------------------------------------
# Node types
# ---------------------------------------------------------------------------

@dataclass
class SSMLNode:
    """Base for SSML parse tree nodes."""


@dataclass
class TextNode(SSMLNode):
    """Plain text content."""
    text: str = ""


@dataclass
class BreakNode(SSMLNode):
    """Silence/pause."""
    time_ms: int | None = None
    strength: str | None = None


@dataclass
class ProsodySpan(SSMLNode):
    """Prosody modification."""
    children: list[SSMLNode] = field(default_factory=list)
    rate: str | None = None


@dataclass
class EmphasisSpan(SSMLNode):
    """Emphasis wrapper."""
    children: list[SSMLNode] = field(default_factory=list)
    level: str = "moderate"


@dataclass
class SubstitutionNode(SSMLNode):
    """<sub alias="...">original</sub> — speak alias instead."""
    original: str = ""
    alias: str = ""


@dataclass
class SayAsNode(SSMLNode):
    """<say-as interpret-as="...">text</say-as> — interpretation hint."""
    text: str = ""
    interpret_as: str = ""
    format: str | None = None


# ---------------------------------------------------------------------------
# Parser
# ---------------------------------------------------------------------------

def parse_ssml(text: str) -> tuple[list[SSMLNode], list[SpeechWarning]]:
    """Parse SSML text into a list of SSMLNode objects.

    Safe fallback: on parse error, returns [TextNode(plain_text)]
    with an ssml_parse_failed warning. Never raises.
    """
    warnings: list[SpeechWarning] = []

    # Enforce max input chars
    if len(text) > MAX_SSML_INPUT_CHARS:
        original_len = len(text)
        text = text[:MAX_SSML_INPUT_CHARS]
        warnings.append(SpeechWarning(
            code="ssml_truncated",
            message=f"SSML input truncated from {original_len} to {MAX_SSML_INPUT_CHARS} chars",
            original=original_len,
            resolved=MAX_SSML_INPUT_CHARS,
        ))

    # Auto-wrap if not wrapped in <speak>
    stripped = text.strip()
    if not stripped.startswith("<speak"):
        text = f"<speak>{text}</speak>"

    try:
        root = ET.fromstring(text)

        if root.tag != "speak":
            raise ValueError(f"Root must be <speak>, got <{root.tag}>")

        node_count = [0]
        nodes, parse_warnings = _parse_children(root, depth=0, node_count=node_count)
        warnings.extend(parse_warnings)

        return nodes, warnings

    except Exception as exc:
        plain = _strip_all_tags(text)
        warnings.append(SpeechWarning(
            code="ssml_parse_failed",
            message=f"SSML parse error: {exc}. Falling back to plain text.",
            original=str(exc),
            resolved="plain_text",
        ))
        return [TextNode(text=plain)], warnings


def _parse_children(
    element: ET.Element,
    depth: int,
    node_count: list[int],
) -> tuple[list[SSMLNode], list[SpeechWarning]]:
    """Recursively parse child elements."""
    if depth > MAX_NESTING_DEPTH:
        raise ValueError(f"SSML nesting too deep (max {MAX_NESTING_DEPTH})")

    nodes: list[SSMLNode] = []
    warnings: list[SpeechWarning] = []

    # Element's own text (before first child)
    if element.text:
        nodes.append(TextNode(text=element.text))
        node_count[0] += 1
        _check_node_limit(node_count)

    for child in element:
        node_count[0] += 1
        _check_node_limit(node_count)

        tag = child.tag

        if tag == "break":
            nodes.append(_parse_break(child))

        elif tag == "prosody":
            children, w = _parse_children(child, depth + 1, node_count)
            warnings.extend(w)
            nodes.append(ProsodySpan(children=children, rate=child.get("rate")))

        elif tag == "emphasis":
            children, w = _parse_children(child, depth + 1, node_count)
            warnings.extend(w)
            nodes.append(EmphasisSpan(
                children=children,
                level=child.get("level", "moderate"),
            ))

        elif tag == "sub":
            nodes.append(SubstitutionNode(
                original=child.text or "",
                alias=child.get("alias", ""),
            ))

        elif tag == "say-as":
            nodes.append(SayAsNode(
                text=child.text or "",
                interpret_as=child.get("interpret-as", ""),
                format=child.get("format"),
            ))

        else:
            warnings.append(SpeechWarning(
                code="ssml_tag_ignored",
                message=f"Unsupported SSML tag '<{tag}>' ignored",
                original=tag,
                resolved=None,
            ))

        # Tail text (text after this child, before next sibling)
        if child.tail:
            nodes.append(TextNode(text=child.tail))
            node_count[0] += 1
            _check_node_limit(node_count)

    return nodes, warnings


def _parse_break(element: ET.Element) -> BreakNode:
    """Parse a <break> element."""
    time_str = element.get("time")
    strength = element.get("strength")

    time_ms: int | None = None
    if time_str:
        time_ms = _parse_duration(time_str)
        if time_ms is not None and time_ms > MAX_BREAK_DURATION_MS:
            time_ms = MAX_BREAK_DURATION_MS
    elif strength and strength in STRENGTH_MS:
        time_ms = STRENGTH_MS[strength]

    return BreakNode(time_ms=time_ms, strength=strength)


def _parse_duration(duration_str: str) -> int | None:
    """Parse '500ms', '1s', '1.5s' → milliseconds."""
    s = duration_str.strip().lower()
    try:
        if s.endswith("ms"):
            return int(float(s[:-2]))
        if s.endswith("s"):
            return int(float(s[:-1]) * 1000)
        return int(float(s))
    except ValueError:
        return None


def _check_node_limit(node_count: list[int]) -> None:
    if node_count[0] > MAX_SSML_NODES:
        raise ValueError(f"Too many SSML nodes (max {MAX_SSML_NODES})")


def _strip_all_tags(text: str) -> str:
    """Remove all XML tags, leaving only content."""
    return re.sub(r"<[^>]+>", "", text).strip()


# ---------------------------------------------------------------------------
# Node → plain text
# ---------------------------------------------------------------------------

def nodes_to_plain_text(nodes: list[SSMLNode]) -> str:
    """Convert SSML nodes to plain text (breaks → space, sub → alias)."""
    parts: list[str] = []
    for node in nodes:
        parts.extend(_node_to_text(node))
    return "".join(parts)


def _node_to_text(node: SSMLNode) -> list[str]:
    """Recursively extract text from a node."""
    if isinstance(node, TextNode):
        return [node.text]
    if isinstance(node, BreakNode):
        return [" "]
    if isinstance(node, (ProsodySpan, EmphasisSpan)):
        parts: list[str] = []
        for child in node.children:
            parts.extend(_node_to_text(child))
        return parts
    if isinstance(node, SubstitutionNode):
        return [node.alias]
    if isinstance(node, SayAsNode):
        return [node.text]
    return []
