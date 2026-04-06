"""Tests for emotion mapping — resolve emotion names to voice/speed/preset."""

from __future__ import annotations

import pytest

from voice_soundboard_plugin.speech.emotion.mapping import EMOTION_MAP, resolve_emotion
from voice_soundboard_plugin.speech.emotion.types import (
    EMOTION_NAMES,
    EMOTION_SPEED_MAX,
    EMOTION_SPEED_MIN,
)
from voice_soundboard_plugin.speech.roster import APPROVED_VOICES, PRESETS


class TestEmotionMap:
    def test_all_emotions_in_map(self):
        """Every named emotion has a mapping entry."""
        for name in EMOTION_NAMES:
            assert name in EMOTION_MAP, f"Missing mapping for '{name}'"

    def test_all_map_presets_exist(self):
        """Every preset referenced in the map exists in PRESETS."""
        for name, mapping in EMOTION_MAP.items():
            assert mapping.preset in PRESETS, (
                f"Emotion '{name}' references non-existent preset '{mapping.preset}'"
            )

    def test_all_fallback_voices_approved(self):
        """Every voice_fallback is an approved voice."""
        for name, mapping in EMOTION_MAP.items():
            assert mapping.voice_fallback in APPROVED_VOICES, (
                f"Emotion '{name}' fallback '{mapping.voice_fallback}' not approved"
            )

    def test_speed_multipliers_in_range(self):
        """All speed multipliers are within the clamping range."""
        for name, mapping in EMOTION_MAP.items():
            assert EMOTION_SPEED_MIN <= mapping.speed_multiplier <= EMOTION_SPEED_MAX, (
                f"Emotion '{name}' speed {mapping.speed_multiplier} out of range"
            )

    def test_neutral_is_identity(self):
        """Neutral has speed_multiplier 1.0."""
        assert EMOTION_MAP["neutral"].speed_multiplier == 1.0


class TestResolveEmotion:
    def test_known_emotion_returns_voice(self):
        voice, speed, warnings = resolve_emotion("joy")
        assert voice in APPROVED_VOICES
        assert len(warnings) == 0

    def test_known_emotion_speed(self):
        voice, speed, warnings = resolve_emotion("urgent")
        assert speed == 1.12

    def test_unknown_emotion_downgrades(self):
        voice, speed, warnings = resolve_emotion("rage")
        assert len(warnings) == 1
        assert warnings[0].code == "emotion_unsupported"
        assert warnings[0].resolved == "neutral"

    def test_base_voice_override(self):
        """Explicit base_voice overrides preset voice."""
        voice, speed, warnings = resolve_emotion("joy", base_voice="am_fenrir")
        assert voice == "am_fenrir"

    def test_base_speed_multiplied(self):
        voice, speed, warnings = resolve_emotion("calm", base_speed=1.0)
        assert speed == 0.95  # calm has multiplier 0.95

    def test_speed_clamped_low(self):
        """Very low base_speed * multiplier gets clamped to EMOTION_SPEED_MIN."""
        voice, speed, warnings = resolve_emotion("whisper", base_speed=0.85)
        # 0.85 * 0.92 = 0.782, should clamp to 0.85
        assert speed == EMOTION_SPEED_MIN

    def test_speed_clamped_high(self):
        """Very high base_speed * multiplier gets clamped to EMOTION_SPEED_MAX."""
        voice, speed, warnings = resolve_emotion("urgent", base_speed=1.15)
        # 1.15 * 1.08 = 1.242, should clamp to 1.15
        assert speed == EMOTION_SPEED_MAX
