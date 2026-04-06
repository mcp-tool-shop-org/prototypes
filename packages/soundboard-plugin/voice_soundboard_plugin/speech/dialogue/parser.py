"""Dialogue script parser — converts raw text to DialogueScript AST.

Script syntax:
    Speaker: text
    [pause 350ms] or [pause 1.5s]
    # comments (ignored)
    blank lines (ignored)

Stage directions (inline, case-insensitive):
    Alice: (whisper) I have a secret.
    Bob: (excited) That's amazing!
    Supported: whisper, aside, calm, excited, urgent, slow, fast.
    Multiple directions allowed: (whisper)(slow) text.
    Unknown directions → warning, not fatal.

Speaker normalization: trim, collapse internal whitespace, preserve case.

Limits:
    MAX_DIALOGUE_LINES (100), MAX_LINE_CHARS (1000),
    MAX_PAUSES (50), pause duration clamped to [50, 3000] ms.

Errors: DialogueParseError with line number. Never crashes.
"""

from __future__ import annotations

import re

from voice_soundboard_plugin.speech.dialogue.types import (
    DialogueLine,
    DialoguePause,
    DialogueScript,
    DialogueParseError,
    MAX_DIALOGUE_LINES,
    MAX_LINE_CHARS,
    MAX_PAUSES,
    MAX_PAUSE_MS,
    MIN_PAUSE_MS,
)

# Speaker: text
_LINE_PATTERN = re.compile(r"^([^:]+):\s*(.+)$")

# [pause 350ms] or [pause 1.5s]
_PAUSE_PATTERN = re.compile(
    r"^\[(?:pause|break)\s+(\d+(?:\.\d+)?)\s*(ms|s)\]$", re.IGNORECASE
)

# Stage direction speed multipliers
DIRECTION_SPEED_MAP: dict[str, float] = {
    "whisper": 0.9,
    "aside": 0.95,
    "calm": 0.9,
    "excited": 1.1,
    "urgent": 1.15,
    "slow": 0.85,
    "fast": 1.15,
}

_KNOWN_DIRECTIONS = frozenset(DIRECTION_SPEED_MAP.keys())

# Matches (direction) at the start of text, possibly chained: (whisper)(slow) text
_DIRECTION_PATTERN = re.compile(r"\(([^)]+)\)", re.IGNORECASE)


def parse_dialogue(script: str) -> DialogueScript:
    """Parse a dialogue script into a DialogueScript AST.

    Returns:
        DialogueScript with lines, pauses, and warnings.

    Raises:
        DialogueParseError: On fatal parse errors (with line number).
    """
    if not script or not script.strip():
        raise DialogueParseError("Empty dialogue script (no valid lines)")

    lines: list[DialogueLine] = []
    pauses: list[DialoguePause] = []
    warnings: list[str] = []
    line_index = 0

    for raw_num, raw_line in enumerate(script.split("\n"), start=1):
        stripped = raw_line.strip()

        # Skip blank lines and comments
        if not stripped or stripped.startswith("#"):
            continue

        # Pause directive
        pause_match = _PAUSE_PATTERN.match(stripped)
        if pause_match:
            duration_ms = _parse_pause_ms(pause_match.group(1), pause_match.group(2))

            if duration_ms < MIN_PAUSE_MS:
                warnings.append(
                    f"Line {raw_num}: Pause {duration_ms}ms below minimum, "
                    f"clamped to {MIN_PAUSE_MS}ms"
                )
                duration_ms = MIN_PAUSE_MS
            elif duration_ms > MAX_PAUSE_MS:
                warnings.append(
                    f"Line {raw_num}: Pause {duration_ms}ms above maximum, "
                    f"clamped to {MAX_PAUSE_MS}ms"
                )
                duration_ms = MAX_PAUSE_MS

            if len(pauses) >= MAX_PAUSES:
                raise DialogueParseError(
                    f"Too many pauses (max {MAX_PAUSES})", line_number=raw_num
                )

            pauses.append(DialoguePause(line_index=line_index, duration_ms=duration_ms))
            continue

        # Dialogue line
        line_match = _LINE_PATTERN.match(stripped)
        if not line_match:
            raise DialogueParseError(
                f"Invalid syntax: expected 'Speaker: text' or "
                f"'[pause Xms]', got: {stripped[:60]}",
                line_number=raw_num,
            )

        speaker_raw = line_match.group(1)
        text = line_match.group(2)

        # Truncate long text
        if len(text) > MAX_LINE_CHARS:
            original_len = len(text)
            text = text[:MAX_LINE_CHARS]
            warnings.append(
                f"Line {raw_num}: Text truncated from {original_len} "
                f"to {MAX_LINE_CHARS} chars"
            )

        if len(lines) >= MAX_DIALOGUE_LINES:
            raise DialogueParseError(
                f"Too many dialogue lines (max {MAX_DIALOGUE_LINES})",
                line_number=raw_num,
            )

        # Extract stage directions
        clean_text, directions, dir_warnings = _extract_stage_directions(text)
        for dw in dir_warnings:
            warnings.append(f"Line {raw_num}: {dw}")

        lines.append(
            DialogueLine(
                line_index=line_index,
                speaker=_normalize_speaker(speaker_raw),
                text=clean_text,
                original_speaker=speaker_raw.strip(),
                directions=directions,
                original_text=text if directions else "",
            )
        )
        line_index += 1

    if not lines:
        raise DialogueParseError("Empty dialogue script (no valid lines)")

    return DialogueScript(lines=lines, pauses=pauses, warnings=warnings)


def _extract_stage_directions(text: str) -> tuple[str, list[str], list[str]]:
    """Extract stage directions from line text.

    Returns:
        (clean_text, directions, warnings)
        - clean_text: text with direction tags removed
        - directions: list of recognized direction names (lowercase)
        - warnings: list of warning strings for unknown directions
    """
    directions: list[str] = []
    warnings: list[str] = []

    # Find all (tag) occurrences
    matches = list(_DIRECTION_PATTERN.finditer(text))
    if not matches:
        return text, directions, warnings

    for m in matches:
        tag = m.group(1).strip().lower()
        if tag in _KNOWN_DIRECTIONS:
            directions.append(tag)
        else:
            warnings.append(f"Unknown stage direction '({m.group(1)})' ignored")

    # Remove all (tag) from text, clean up whitespace
    clean = _DIRECTION_PATTERN.sub("", text).strip()
    # Collapse any double spaces left behind
    clean = re.sub(r"\s{2,}", " ", clean)

    return clean, directions, warnings


def _normalize_speaker(speaker: str) -> str:
    """Trim and collapse internal whitespace."""
    return re.sub(r"\s+", " ", speaker.strip())


def _parse_pause_ms(value_str: str, unit: str) -> int:
    """Convert pause value + unit to milliseconds."""
    value = float(value_str)
    if unit.lower() == "s":
        return int(value * 1000)
    return int(value)
