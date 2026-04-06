"""Speech pipeline types — shared dataclasses for plans, chunks, and warnings."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class SpeechChunk:
    """A single unit of speech to synthesize."""

    text: str
    voice: str  # resolved, validated
    speed: float
    emotion: str | None = None
    style: str | None = None
    context: str = ""  # "speak", "narrate", "workflow:build_success"


@dataclass
class SpeechWarning:
    """Non-fatal issue detected during pipeline processing."""

    code: str  # "text_truncated", "speed_clamped", etc.
    message: str
    original: Any = None
    resolved: Any = None


@dataclass
class SpeechPlan:
    """The output of process_text() — everything needed to synthesize speech."""

    chunks: list[SpeechChunk]
    warnings: list[SpeechWarning] = field(default_factory=list)
    trace_id: str = ""  # uuid4 hex[:12]
    source_text: str = ""  # original input (for debug)
    mode: str = "speak"  # "speak", "narrate", "notification"


class VoiceRejectedError(ValueError):
    """Raised when a voice is not in the approved roster."""

    def __init__(self, voice: str, approved: list[str], default: str):
        self.voice = voice
        self.approved = approved
        self.default = default
        super().__init__(f"Voice '{voice}' is not in the approved roster.")
