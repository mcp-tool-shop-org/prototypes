"""Emotion mapping — resolve emotion names to voice/speed/preset parameters.

EMOTION_MAP is the source of truth for voice routing. The voice field
in the mapping takes priority; the preset field is metadata for future use.
Speed multipliers clamped to [EMOTION_SPEED_MIN, EMOTION_SPEED_MAX].
Unknown emotions → downgrade to neutral + warning.
"""

from __future__ import annotations

from voice_soundboard_plugin.speech.emotion.types import (
    EMOTION_NAMES,
    EMOTION_SPEED_MAX,
    EMOTION_SPEED_MIN,
    EmotionMapping,
)
from voice_soundboard_plugin.speech.types import SpeechWarning

EMOTION_MAP: dict[str, EmotionMapping] = {
    "neutral":      EmotionMapping(preset="default",      voice_fallback="bm_george",  speed_multiplier=1.00),
    "serious":      EmotionMapping(preset="narrator",     voice_fallback="bm_george",  speed_multiplier=1.00),
    "friendly":     EmotionMapping(preset="friendly",     voice_fallback="am_liam",    speed_multiplier=1.00),
    "professional": EmotionMapping(preset="professional", voice_fallback="af_jessica", speed_multiplier=1.00),
    "calm":         EmotionMapping(preset="narrator",     voice_fallback="bm_george",  speed_multiplier=0.95),
    "joy":          EmotionMapping(preset="friendly",     voice_fallback="am_liam",    speed_multiplier=1.06),
    "urgent":       EmotionMapping(preset="announcer",    voice_fallback="am_eric",    speed_multiplier=1.12),
    "whisper":      EmotionMapping(preset="storyteller",  voice_fallback="am_onyx",    speed_multiplier=0.92),
}


def resolve_emotion(
    emotion_name: str,
    base_voice: str | None = None,
    base_speed: float = 1.0,
) -> tuple[str, float, list[SpeechWarning]]:
    """Resolve emotion name to (voice_id, speed, warnings).

    Args:
        emotion_name: One of EMOTION_NAMES, or unknown (downgraded).
        base_voice: If provided, overrides the preset voice.
        base_speed: Base speed multiplied by mapping's speed_multiplier.

    Returns:
        (voice_id, clamped_speed, warnings)
    """
    warnings: list[SpeechWarning] = []

    # Downgrade unknown emotions
    if emotion_name not in EMOTION_NAMES:
        warnings.append(SpeechWarning(
            code="emotion_unsupported",
            message=(
                f"Emotion '{emotion_name}' is not supported, "
                f"downgraded to 'neutral'. Supported: {', '.join(sorted(EMOTION_NAMES))}"
            ),
            original=emotion_name,
            resolved="neutral",
        ))
        emotion_name = "neutral"

    mapping = EMOTION_MAP[emotion_name]

    # Resolve voice: explicit override → EMOTION_MAP voice (source of truth)
    if base_voice:
        voice_id = base_voice
    else:
        voice_id = mapping.voice_fallback

    # Compute speed: base * multiplier, clamped
    speed = base_speed * mapping.speed_multiplier
    if speed < EMOTION_SPEED_MIN:
        speed = EMOTION_SPEED_MIN
    elif speed > EMOTION_SPEED_MAX:
        speed = EMOTION_SPEED_MAX
    speed = round(speed, 3)

    return voice_id, speed, warnings
