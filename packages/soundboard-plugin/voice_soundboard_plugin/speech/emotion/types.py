"""Emotion span types — structured representation of parsed emotion markup."""

from __future__ import annotations

from dataclasses import dataclass

# Limits
MAX_EMOTION_SPANS = 100
MAX_EMOTION_NESTING = 4
EMOTION_SPEED_MIN = 0.85
EMOTION_SPEED_MAX = 1.15

# The 8 public emotions (v1)
EMOTION_NAMES = frozenset({
    "neutral",
    "serious",
    "friendly",
    "professional",
    "calm",
    "joy",
    "urgent",
    "whisper",
})


@dataclass
class EmotionSpan:
    """A text segment with emotion metadata."""

    text: str
    emotion: str  # always one of EMOTION_NAMES (downgraded if unknown)
    intensity: float = 1.0  # 0.0-1.0, from {serious:0.8} syntax


@dataclass
class EmotionMapping:
    """Maps an emotion name to synthesis parameters."""

    preset: str  # key into PRESETS (primary routing)
    voice_fallback: str  # approved voice ID (secondary)
    speed_multiplier: float  # applied to base speed
