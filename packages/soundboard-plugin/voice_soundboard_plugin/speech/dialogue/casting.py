"""Casting — resolve dialogue speakers to approved voice IDs.

Resolution priority:
    1. Explicit cast dict (case-insensitive keys)
    2. Auto-cast keyword matching (substring, case-insensitive)
    3. Preset name matching (narrator, announcer, etc.)
    4. Default: DIALOGUE_DEFAULT_VOICE

Invalid cast → CastingError (not silent fallback).
"""

from __future__ import annotations

from voice_soundboard_plugin.speech.dialogue.types import DialogueLine
from voice_soundboard_plugin.speech.roster import (
    APPROVED_VOICES,
    PRESETS,
    validate_voice,
)

DIALOGUE_DEFAULT_VOICE = "bm_george"

# Keyword → approved voice ID (substring match, case-insensitive)
AUTO_CAST_PATTERNS: dict[str, str] = {
    # Names matching voice IDs
    "alice": "bf_alice",
    "emma": "bf_emma",
    "isabella": "bf_isabella",
    "jessica": "af_jessica",
    "sky": "af_sky",
    "aoede": "af_aoede",
    "george": "bm_george",
    "lewis": "bm_lewis",
    "eric": "am_eric",
    "fenrir": "am_fenrir",
    "liam": "am_liam",
    "onyx": "am_onyx",
    # Role keywords
    "narrator": "bm_george",
    "announcer": "am_eric",
}


class CastingError(ValueError):
    """Raised when a speaker cannot be resolved to an approved voice."""

    def __init__(self, speaker: str, attempted_voice: str | None = None):
        self.speaker = speaker
        self.attempted_voice = attempted_voice
        if attempted_voice:
            msg = (
                f"Speaker '{speaker}': voice '{attempted_voice}' "
                f"is not in the approved roster"
            )
        else:
            msg = f"Speaker '{speaker}': could not resolve to an approved voice"
        super().__init__(msg)


def resolve_cast(
    lines: list[DialogueLine],
    cast: dict[str, str] | None = None,
    auto_cast: bool = True,
) -> dict[str, str]:
    """Resolve all speakers in the script to voice IDs.

    Args:
        lines: Parsed dialogue lines.
        cast: Explicit speaker→voice mapping (optional).
        auto_cast: Enable keyword-based auto-casting (default True).

    Returns:
        Dict mapping each normalized speaker name to an approved voice ID.

    Raises:
        CastingError: If an explicit cast voice is not approved.
    """
    # Normalize explicit cast keys (case-insensitive)
    normalized_cast: dict[str, str] = {}
    if cast:
        for speaker_key, voice_val in cast.items():
            normalized_cast[speaker_key.strip().lower()] = voice_val

    # Collect unique speakers
    speakers = {line.speaker for line in lines}
    result: dict[str, str] = {}

    for speaker in speakers:
        speaker_lower = speaker.lower()

        # 1. Explicit cast dict
        if speaker_lower in normalized_cast:
            voice_id = normalized_cast[speaker_lower]
            resolved = validate_voice(voice_id)
            if resolved is None:
                raise CastingError(speaker, attempted_voice=voice_id)
            result[speaker] = resolved
            continue

        # 2. Auto-cast keyword matching
        if auto_cast:
            matched = _auto_cast_match(speaker_lower)
            if matched:
                result[speaker] = matched
                continue

        # 3. Preset name matching
        preset_voice = _preset_match(speaker_lower)
        if preset_voice:
            result[speaker] = preset_voice
            continue

        # 4. Default
        result[speaker] = DIALOGUE_DEFAULT_VOICE

    return result


def validate_cast_dict(cast: dict[str, str]) -> list[str]:
    """Pre-validate a cast dict. Returns list of error messages (empty if valid)."""
    errors: list[str] = []
    for speaker, voice in cast.items():
        resolved = validate_voice(voice)
        if resolved is None:
            errors.append(
                f"Speaker '{speaker}': voice '{voice}' is not approved. "
                f"Approved: {', '.join(APPROVED_VOICES)}"
            )
    return errors


def calculate_speed_from_directions(
    directions: list[str],
    base_speed: float = 1.0,
) -> tuple[float, list[str]]:
    """Calculate speed modifier from stage directions.

    Multiple directions → average their multipliers, then apply to base_speed.
    Result clamped to [0.5, 2.0].

    Returns:
        (final_speed, warnings)
    """
    from voice_soundboard_plugin.speech.dialogue.parser import DIRECTION_SPEED_MAP
    from voice_soundboard_plugin.speech.limits import SPEED_MAX, SPEED_MIN

    if not directions:
        return base_speed, []

    multipliers = []
    for d in directions:
        if d in DIRECTION_SPEED_MAP:
            multipliers.append(DIRECTION_SPEED_MAP[d])

    if not multipliers:
        return base_speed, []

    avg_multiplier = sum(multipliers) / len(multipliers)
    speed = base_speed * avg_multiplier

    warnings: list[str] = []
    if speed < SPEED_MIN:
        warnings.append(
            f"Direction speed {speed:.2f} below minimum, clamped to {SPEED_MIN}"
        )
        speed = SPEED_MIN
    elif speed > SPEED_MAX:
        warnings.append(
            f"Direction speed {speed:.2f} above maximum, clamped to {SPEED_MAX}"
        )
        speed = SPEED_MAX

    return round(speed, 3), warnings


def _auto_cast_match(speaker_lower: str) -> str | None:
    """Try substring keyword match against AUTO_CAST_PATTERNS."""
    for keyword, voice_id in AUTO_CAST_PATTERNS.items():
        if keyword in speaker_lower:
            return voice_id
    return None


def _preset_match(speaker_lower: str) -> str | None:
    """Try matching speaker name against preset names."""
    if speaker_lower in PRESETS:
        return PRESETS[speaker_lower]["voice"]
    return None
