"""Emotion module — emotion span parsing, voice/speed mapping, and plan building."""

from voice_soundboard_plugin.speech.emotion.mapping import (
    EMOTION_MAP,
    resolve_emotion,
)
from voice_soundboard_plugin.speech.emotion.parser import (
    has_emotion_spans,
    parse_emotion_spans,
)
from voice_soundboard_plugin.speech.emotion.plan_builder import build_emotion_plan
from voice_soundboard_plugin.speech.emotion.types import (
    EMOTION_NAMES,
    EmotionMapping,
    EmotionSpan,
)

__all__ = [
    "EMOTION_MAP",
    "EMOTION_NAMES",
    "EmotionMapping",
    "EmotionSpan",
    "build_emotion_plan",
    "has_emotion_spans",
    "parse_emotion_spans",
    "resolve_emotion",
]
