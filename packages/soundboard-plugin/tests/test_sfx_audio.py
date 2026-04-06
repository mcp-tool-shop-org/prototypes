"""Tests for SFX WAV generation — pure-Python sine wave synthesis."""

from __future__ import annotations

import os
import wave
from pathlib import Path

import pytest

from voice_soundboard_plugin.audio.sfx import (
    SFX_CATALOG,
    generate_sfx_wav,
    get_sfx_path,
    is_sfx_enabled,
)


class TestSfxEnabled:
    def test_disabled_by_default(self):
        # Ensure env var not set
        os.environ.pop("VOICE_SOUNDBOARD_ENABLE_SFX", None)
        assert not is_sfx_enabled()

    def test_enabled_with_env(self, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_ENABLE_SFX", "1")
        assert is_sfx_enabled()

    def test_enabled_with_true(self, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_ENABLE_SFX", "true")
        assert is_sfx_enabled()


class TestGenerateSfxWav:
    def test_all_catalog_entries_generate(self, tmp_path):
        """Every catalog entry generates a valid WAV file."""
        for tag_name, sfx_def in SFX_CATALOG.items():
            output = tmp_path / f"test_{tag_name}.wav"
            generate_sfx_wav(sfx_def, output)
            assert output.exists(), f"WAV not created for '{tag_name}'"

            # Validate it's a proper WAV
            with wave.open(str(output), "rb") as wf:
                assert wf.getnchannels() == 1
                assert wf.getsampwidth() == 2
                assert wf.getframerate() == 24000
                assert wf.getnframes() > 0

    def test_wav_duration(self, tmp_path):
        """WAV duration matches the SfxDef duration_ms."""
        sfx_def = SFX_CATALOG["ding"]  # 150ms
        output = tmp_path / "ding.wav"
        generate_sfx_wav(sfx_def, output)

        with wave.open(str(output), "rb") as wf:
            actual_ms = (wf.getnframes() / wf.getframerate()) * 1000
            assert abs(actual_ms - sfx_def.duration_ms) < 2  # allow tiny rounding


class TestGetSfxPath:
    def test_known_tag_returns_path(self):
        path = get_sfx_path("ding")
        assert path is not None
        assert path.exists()
        assert path.suffix == ".wav"

    def test_unknown_tag_returns_none(self):
        assert get_sfx_path("nonexistent_sound") is None

    def test_caching(self):
        """Second call returns same path without re-generating."""
        path1 = get_sfx_path("chime")
        path2 = get_sfx_path("chime")
        assert path1 == path2
