"""Tests for speech.dialogue.casting — speaker→voice resolution."""

from __future__ import annotations

import pytest

from voice_soundboard_plugin.speech.dialogue import (
    AUTO_CAST_PATTERNS,
    CastingError,
    DIALOGUE_DEFAULT_VOICE,
    calculate_speed_from_directions,
    resolve_cast,
    validate_cast_dict,
)
from voice_soundboard_plugin.speech.dialogue.types import DialogueLine
from voice_soundboard_plugin.speech.roster import APPROVED_VOICES


def _make_line(speaker: str, index: int = 0) -> DialogueLine:
    """Helper to create a minimal DialogueLine."""
    return DialogueLine(
        line_index=index,
        speaker=speaker,
        text="Test text.",
        original_speaker=speaker,
    )


def test_explicit_cast_voice_id():
    """Explicit cast with voice ID → resolved."""
    lines = [_make_line("Alice")]
    cast = resolve_cast(lines, cast={"Alice": "bf_alice"})
    assert cast["Alice"] == "bf_alice"


def test_explicit_cast_preset_name():
    """Explicit cast with preset name → resolved to preset voice."""
    lines = [_make_line("Host")]
    cast = resolve_cast(lines, cast={"Host": "announcer"})
    assert cast["Host"] == "am_eric"


def test_explicit_cast_invalid_voice():
    """Explicit cast with invalid voice → CastingError."""
    lines = [_make_line("Alice")]
    with pytest.raises(CastingError) as exc_info:
        resolve_cast(lines, cast={"Alice": "am_michael"})
    assert exc_info.value.speaker == "Alice"
    assert exc_info.value.attempted_voice == "am_michael"


def test_auto_cast_keyword_alice():
    """Auto-cast: speaker name 'Alice' → bf_alice."""
    lines = [_make_line("Alice")]
    cast = resolve_cast(lines)
    assert cast["Alice"] == "bf_alice"


def test_auto_cast_keyword_substring():
    """Auto-cast: 'Professor George' contains 'george' → bm_george."""
    lines = [_make_line("Professor George")]
    cast = resolve_cast(lines)
    assert cast["Professor George"] == "bm_george"


def test_auto_cast_disabled():
    """auto_cast=False → all unknown speakers get default voice."""
    lines = [_make_line("Alice"), _make_line("Bob")]
    cast = resolve_cast(lines, auto_cast=False)
    assert cast["Alice"] == DIALOGUE_DEFAULT_VOICE
    assert cast["Bob"] == DIALOGUE_DEFAULT_VOICE


def test_all_approved_voices_in_patterns():
    """All 12 approved voices appear as values in AUTO_CAST_PATTERNS."""
    pattern_voices = set(AUTO_CAST_PATTERNS.values())
    for voice in APPROVED_VOICES:
        assert voice in pattern_voices, f"{voice} missing from AUTO_CAST_PATTERNS"


def test_case_insensitive_cast_keys():
    """Cast dict keys are case-insensitive."""
    lines = [_make_line("Alice")]
    cast = resolve_cast(lines, cast={"ALICE": "am_fenrir"})
    assert cast["Alice"] == "am_fenrir"


def test_default_voice_for_unknown_speaker():
    """Unknown speaker with no match → default voice."""
    lines = [_make_line("Mysterious Stranger")]
    cast = resolve_cast(lines)
    assert cast["Mysterious Stranger"] == DIALOGUE_DEFAULT_VOICE


def test_preset_name_match():
    """Speaker named 'Narrator' → matched via preset."""
    lines = [_make_line("Narrator")]
    cast = resolve_cast(lines)
    # 'narrator' is in AUTO_CAST_PATTERNS, so it goes to bm_george
    assert cast["Narrator"] == "bm_george"


def test_validate_cast_dict_valid():
    """Valid cast dict → no errors."""
    errors = validate_cast_dict({"Alice": "bf_alice", "Bob": "bm_george"})
    assert errors == []


def test_validate_cast_dict_invalid():
    """Invalid voice in cast dict → error messages."""
    errors = validate_cast_dict({"Alice": "am_michael"})
    assert len(errors) == 1
    assert "am_michael" in errors[0]


# --- Speed from directions ---

def test_speed_from_whisper():
    """(whisper) → 0.9x speed."""
    speed, warnings = calculate_speed_from_directions(["whisper"])
    assert speed == 0.9
    assert warnings == []


def test_speed_from_excited():
    """(excited) → 1.1x speed."""
    speed, warnings = calculate_speed_from_directions(["excited"])
    assert speed == 1.1
    assert warnings == []


def test_speed_from_multiple_directions():
    """Multiple directions → averaged multiplier."""
    speed, warnings = calculate_speed_from_directions(["whisper", "slow"])
    # whisper=0.9, slow=0.85 → avg=0.875
    assert speed == 0.875
    assert warnings == []


def test_speed_no_directions():
    """No directions → base speed unchanged."""
    speed, warnings = calculate_speed_from_directions([])
    assert speed == 1.0
    assert warnings == []


def test_speed_with_base():
    """Direction speed multiplied with custom base speed."""
    speed, warnings = calculate_speed_from_directions(["fast"], base_speed=1.5)
    # fast=1.15 → 1.5 * 1.15 = 1.725
    assert speed == 1.725
    assert warnings == []


def test_speed_clamped_high():
    """Extreme speed → clamped to 2.0."""
    speed, warnings = calculate_speed_from_directions(["fast"], base_speed=2.0)
    # fast=1.15 → 2.0 * 1.15 = 2.3 → clamped to 2.0
    assert speed == 2.0
    assert len(warnings) == 1
