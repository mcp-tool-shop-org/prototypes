"""Tests for WAV header validation."""

from __future__ import annotations

import struct
import wave
from pathlib import Path

import pytest

from voice_soundboard_plugin.security.wav_validator import validate_wav


class TestValidateWav:
    """WAV header validation."""

    def test_valid_wav(self, tmp_path):
        """Minimal valid WAV passes."""
        wav_path = tmp_path / "valid.wav"
        n_frames = 100
        with wave.open(str(wav_path), "w") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(24000)
            wf.writeframes(struct.pack(f"<{n_frames}h", *([0] * n_frames)))
        valid, reason = validate_wav(wav_path)
        assert valid
        assert reason == "ok"

    def test_missing_file(self, tmp_path):
        valid, reason = validate_wav(tmp_path / "nonexistent.wav")
        assert not valid
        assert "not found" in reason.lower()

    def test_too_small(self, tmp_path):
        small = tmp_path / "tiny.wav"
        small.write_bytes(b"\x00" * 10)
        valid, reason = validate_wav(small)
        assert not valid
        assert "too small" in reason.lower()

    def test_wrong_riff_magic(self, tmp_path):
        bad = tmp_path / "bad_riff.wav"
        bad.write_bytes(b"NOTA" + b"\x00" * 40)
        valid, reason = validate_wav(bad)
        assert not valid
        assert "RIFF" in reason

    def test_wrong_wave_magic(self, tmp_path):
        bad = tmp_path / "bad_wave.wav"
        # RIFF header correct, but WAVE magic wrong
        bad.write_bytes(b"RIFF" + b"\x00\x00\x00\x00" + b"NOPE" + b"\x00" * 32)
        valid, reason = validate_wav(bad)
        assert not valid
        assert "WAVE" in reason

    def test_empty_file(self, tmp_path):
        empty = tmp_path / "empty.wav"
        empty.write_bytes(b"")
        valid, reason = validate_wav(empty)
        assert not valid
        assert "too small" in reason.lower()
