"""Emotion span parser — converts {emotion}text{/emotion} markup to EmotionSpan list.

Syntax:
    {joy}Hello!{/joy}
    {serious:0.8}We need to talk.{/serious}  (optional intensity)
    {joy}Outer {whisper}inner{/whisper} more{/joy}  (nesting up to MAX_EMOTION_NESTING)

Nesting is flattened: each span carries the innermost emotion.
Malformed tags → fallback to plain text + warning.
Unknown emotions → downgraded to neutral + warning.
"""

from __future__ import annotations

import re

from voice_soundboard_plugin.speech.emotion.types import (
    EMOTION_NAMES,
    MAX_EMOTION_NESTING,
    MAX_EMOTION_SPANS,
    EmotionSpan,
)
from voice_soundboard_plugin.speech.types import SpeechWarning

# {emotion} or {emotion:0.8}
_OPEN_TAG = re.compile(r"\{(\w+)(?::(\d*\.?\d+))?\}")

# {/emotion}
_CLOSE_TAG = re.compile(r"\{/(\w+)\}")

# Combined pattern for scanning
_ANY_TAG = re.compile(r"\{/?(\w+)(?::(\d*\.?\d+))?\}")

# Quick detection pattern
_HAS_SPANS = re.compile(r"\{\w+(?::[0-9.]+)?\}.*\{/\w+\}", re.DOTALL)


def has_emotion_spans(text: str) -> bool:
    """Quick check: does text contain any {emotion}...{/emotion} patterns?"""
    return bool(_HAS_SPANS.search(text))


def parse_emotion_spans(text: str) -> tuple[list[EmotionSpan], list[SpeechWarning]]:
    """Parse emotion markup into flat list of EmotionSpan objects.

    Returns:
        (spans, warnings). On parse error, falls back to plain text with warning.
    """
    if not text or not text.strip():
        return [EmotionSpan(text=text or "", emotion="neutral")], []

    try:
        spans, warnings = _parse_stack(text)
        if not spans:
            return [EmotionSpan(text=text, emotion="neutral")], warnings
        return spans, warnings
    except _ParseError as exc:
        return [EmotionSpan(text=_strip_tags(text), emotion="neutral")], [
            SpeechWarning(
                code="emotion_parse_failed",
                message=f"Emotion markup parse error: {exc}",
                original=text[:100],
                resolved="plain text fallback",
            )
        ]


class _ParseError(Exception):
    """Internal parse error — triggers fallback."""


def _parse_stack(text: str) -> tuple[list[EmotionSpan], list[SpeechWarning]]:
    """Stack-based parser. Returns flat spans with innermost emotion."""
    spans: list[EmotionSpan] = []
    warnings: list[SpeechWarning] = []
    stack: list[tuple[str, float]] = []  # (emotion, intensity)
    pos = 0

    while pos < len(text):
        # Try to match an opening tag
        open_match = _OPEN_TAG.match(text, pos)
        if open_match and text[pos] == "{" and "/" not in text[pos : open_match.end()].split("}")[0]:
            # Check it's not a closing tag
            if not text[pos:].startswith("{/"):
                tag_name = open_match.group(1).lower()
                intensity_str = open_match.group(2)
                intensity = _parse_intensity(intensity_str)

                # Enforce nesting depth
                if len(stack) >= MAX_EMOTION_NESTING:
                    raise _ParseError(
                        f"Nesting depth {len(stack) + 1} exceeds maximum {MAX_EMOTION_NESTING}"
                    )

                stack.append((tag_name, intensity))
                pos = open_match.end()
                continue

        # Try to match a closing tag
        close_match = _CLOSE_TAG.match(text, pos)
        if close_match and text[pos:].startswith("{/"):
            tag_name = close_match.group(1).lower()

            if not stack:
                raise _ParseError(f"Closing tag {{/{tag_name}}} without matching open tag")

            top_emotion, _ = stack[-1]
            if top_emotion != tag_name:
                raise _ParseError(
                    f"Mismatched tags: expected {{/{top_emotion}}}, got {{/{tag_name}}}"
                )

            stack.pop()
            pos = close_match.end()
            continue

        # Regular text — collect until next tag
        next_tag = _find_next_tag(text, pos)
        chunk_end = next_tag if next_tag is not None else len(text)
        chunk_text = text[pos:chunk_end]

        if chunk_text:
            # Determine emotion from stack (innermost) or neutral
            if stack:
                emotion, intensity = stack[-1]
            else:
                emotion, intensity = "neutral", 1.0

            # Validate emotion name
            if emotion not in EMOTION_NAMES:
                warnings.append(SpeechWarning(
                    code="emotion_unsupported",
                    message=f"Emotion '{emotion}' unsupported, downgraded to neutral",
                    original=emotion,
                    resolved="neutral",
                ))
                emotion = "neutral"

            spans.append(EmotionSpan(text=chunk_text, emotion=emotion, intensity=intensity))

            # Enforce span limit
            if len(spans) >= MAX_EMOTION_SPANS:
                warnings.append(SpeechWarning(
                    code="emotion_span_limit",
                    message=f"Emotion span count exceeded {MAX_EMOTION_SPANS}, remaining text truncated",
                    original=len(text),
                    resolved=MAX_EMOTION_SPANS,
                ))
                # Collect remaining text as one final neutral span
                remaining = _strip_tags(text[chunk_end:])
                if remaining.strip():
                    spans.append(EmotionSpan(text=remaining, emotion="neutral"))
                break

        pos = chunk_end

    # Unclosed tags
    if stack:
        raise _ParseError(
            f"Unclosed emotion tag(s): {', '.join('{' + e + '}' for e, _ in stack)}"
        )

    return spans, warnings


def _find_next_tag(text: str, pos: int) -> int | None:
    """Find position of next { that looks like a tag."""
    while pos < len(text):
        idx = text.find("{", pos)
        if idx == -1:
            return None
        # Check it's a real tag (open or close)
        if _OPEN_TAG.match(text, idx) or _CLOSE_TAG.match(text, idx):
            return idx
        pos = idx + 1
    return None


def _parse_intensity(value: str | None) -> float:
    """Parse intensity value, clamped to [0.0, 1.0]."""
    if value is None:
        return 1.0
    try:
        v = float(value)
        return max(0.0, min(1.0, v))
    except (ValueError, TypeError):
        return 1.0


def _strip_tags(text: str) -> str:
    """Remove all {tag} and {/tag} markers from text."""
    result = _OPEN_TAG.sub("", text)
    result = _CLOSE_TAG.sub("", result)
    return re.sub(r"\s{2,}", " ", result).strip()
