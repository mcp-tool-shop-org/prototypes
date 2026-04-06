"""Dialogue module — multi-speaker script parsing and synthesis."""

from voice_soundboard_plugin.speech.dialogue.casting import (
    AUTO_CAST_PATTERNS,
    CastingError,
    DIALOGUE_DEFAULT_VOICE,
    calculate_speed_from_directions,
    resolve_cast,
    validate_cast_dict,
)
from voice_soundboard_plugin.speech.dialogue.parser import (
    DIRECTION_SPEED_MAP,
    parse_dialogue,
)
from voice_soundboard_plugin.speech.dialogue.types import (
    DialogueLine,
    DialoguePause,
    DialogueParseError,
    DialogueScript,
)

__all__ = [
    "parse_dialogue",
    "DialogueLine",
    "DialoguePause",
    "DialogueParseError",
    "DialogueScript",
    "resolve_cast",
    "validate_cast_dict",
    "calculate_speed_from_directions",
    "CastingError",
    "DIALOGUE_DEFAULT_VOICE",
    "AUTO_CAST_PATTERNS",
    "DIRECTION_SPEED_MAP",
]
