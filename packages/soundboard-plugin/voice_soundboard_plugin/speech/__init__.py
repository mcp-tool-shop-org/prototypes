"""Speech pipeline — unified speech processing for the soundboard plugin."""

from voice_soundboard_plugin.speech.pipeline import process_text
from voice_soundboard_plugin.speech.types import (
    SpeechChunk,
    SpeechPlan,
    SpeechWarning,
    VoiceRejectedError,
)

__all__ = [
    "SpeechChunk",
    "SpeechPlan",
    "SpeechWarning",
    "VoiceRejectedError",
    "process_text",
]
