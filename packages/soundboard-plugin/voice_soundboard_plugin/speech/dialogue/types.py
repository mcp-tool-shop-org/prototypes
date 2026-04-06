"""Dialogue AST types — structured representation of parsed scripts."""

from __future__ import annotations

from dataclasses import dataclass, field

# Limits
MAX_DIALOGUE_LINES = 100
MAX_LINE_CHARS = 1000
MAX_PAUSES = 50
MAX_PAUSE_MS = 3000
MIN_PAUSE_MS = 50


@dataclass
class DialogueLine:
    """A single speaker utterance."""

    line_index: int  # 0-based position in output
    speaker: str  # normalized speaker name
    text: str  # what they say
    original_speaker: str  # raw from script
    directions: list[str] = field(default_factory=list)
    original_text: str = ""


@dataclass
class DialoguePause:
    """A pause directive between lines."""

    line_index: int  # position in sequence
    duration_ms: int


@dataclass
class DialogueScript:
    """Parsed dialogue script."""

    lines: list[DialogueLine]
    pauses: list[DialoguePause]
    warnings: list[str]


class DialogueParseError(ValueError):
    """Fatal parse error with line number context."""

    def __init__(self, message: str, line_number: int | None = None):
        self.message = message
        self.line_number = line_number
        if line_number is not None:
            super().__init__(f"Line {line_number}: {message}")
        else:
            super().__init__(message)
