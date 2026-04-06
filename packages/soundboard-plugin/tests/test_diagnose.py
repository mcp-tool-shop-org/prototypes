"""Tests for voice.playback_diagnose handler."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

# We test the handler function directly, mocking globals
from voice_soundboard_plugin.bridge import stdio_bridge


class TestPlaybackDiagnose:
    def test_returns_expected_keys(self):
        """Diagnose response has all required keys."""
        mock_player = MagicMock()
        mock_player.enabled = True
        mock_player._backend = "winsound"
        mock_player.mode.value = "replace"
        mock_player._max_play_seconds = 30
        mock_player.is_busy = False
        mock_player.play = MagicMock()

        with patch.object(stdio_bridge, "_PLAYER", mock_player):
            result = stdio_bridge._handle_playback_diagnose({"play_test_beep": False})

        expected_keys = {
            "playback_enabled", "backend", "playback_mode",
            "max_play_seconds", "is_busy", "env", "devices", "test_beep",
        }
        assert expected_keys.issubset(result.keys())

    def test_skips_beep_when_disabled(self):
        """No play call when play_test_beep=False."""
        mock_player = MagicMock()
        mock_player.enabled = True
        mock_player._backend = "winsound"
        mock_player.mode.value = "replace"
        mock_player._max_play_seconds = 30
        mock_player.is_busy = False

        with patch.object(stdio_bridge, "_PLAYER", mock_player):
            result = stdio_bridge._handle_playback_diagnose({"play_test_beep": False})

        assert result["test_beep"] == "skipped"
        mock_player.play.assert_not_called()

    def test_env_dict_complete(self):
        """Env dict has all expected playback env var keys."""
        mock_player = MagicMock()
        mock_player.enabled = True
        mock_player._backend = "winsound"
        mock_player.mode.value = "replace"
        mock_player._max_play_seconds = 30
        mock_player.is_busy = False

        with patch.object(stdio_bridge, "_PLAYER", mock_player):
            result = stdio_bridge._handle_playback_diagnose({"play_test_beep": False})

        env = result["env"]
        expected_env_keys = {
            "VOICE_SOUNDBOARD_DISABLE_PLAYBACK",
            "VOICE_SOUNDBOARD_PLAYBACK_MODE",
            "VOICE_SOUNDBOARD_BLOCKING_PLAYBACK",
            "VOICE_SOUNDBOARD_MAX_PLAY_SECONDS",
            "VOICE_SOUNDBOARD_OUTPUT_DEVICE",
            "VOICE_SOUNDBOARD_OUTPUT_DEVICE_INDEX",
            "VOICE_SOUNDBOARD_LOG_DEVICES",
            "VOICE_SOUNDBOARD_PLAYBACK_BACKEND",
        }
        assert expected_env_keys == set(env.keys())

    def test_no_player_returns_defaults(self):
        """When player is None, returns safe defaults."""
        with patch.object(stdio_bridge, "_PLAYER", None):
            result = stdio_bridge._handle_playback_diagnose({"play_test_beep": False})

        assert result["playback_enabled"] is False
        assert result["backend"] is None
        assert result["test_beep"] == "skipped"
