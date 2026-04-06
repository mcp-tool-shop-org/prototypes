"""Speech pipeline limits — pure validation functions."""

from __future__ import annotations

from voice_soundboard_plugin.speech.types import SpeechWarning

MAX_TEXT_LENGTH = 10_000  # characters
MAX_CHUNKS = 50
SPEED_MIN = 0.5
SPEED_MAX = 2.0


def clamp_speed(speed: float) -> tuple[float, SpeechWarning | None]:
    """Clamp speed to [SPEED_MIN, SPEED_MAX]. Returns (clamped, warning_or_None)."""
    if speed < SPEED_MIN:
        return SPEED_MIN, SpeechWarning(
            code="speed_clamped",
            message=f"Speed {speed} below minimum, clamped to {SPEED_MIN}",
            original=speed,
            resolved=SPEED_MIN,
        )
    if speed > SPEED_MAX:
        return SPEED_MAX, SpeechWarning(
            code="speed_clamped",
            message=f"Speed {speed} above maximum, clamped to {SPEED_MAX}",
            original=speed,
            resolved=SPEED_MAX,
        )
    return speed, None


def truncate_text(text: str) -> tuple[str, SpeechWarning | None]:
    """Truncate text to MAX_TEXT_LENGTH. Returns (text, warning_or_None)."""
    if len(text) <= MAX_TEXT_LENGTH:
        return text, None
    truncated = text[:MAX_TEXT_LENGTH]
    return truncated, SpeechWarning(
        code="text_truncated",
        message=f"Text truncated from {len(text)} to {MAX_TEXT_LENGTH} characters",
        original=len(text),
        resolved=MAX_TEXT_LENGTH,
    )
