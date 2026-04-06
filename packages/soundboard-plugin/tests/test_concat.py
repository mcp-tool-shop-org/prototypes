"""Tests for speech.concat — WAV concatenation."""

from __future__ import annotations

import struct
import wave
from pathlib import Path

import pytest

from voice_soundboard_plugin.speech.concat import (
    DEFAULT_SILENCE_MS,
    concatenate_wavs,
    should_concat,
)


def _make_wav(path: Path, n_frames: int = 2400, sample_rate: int = 24000,
              n_channels: int = 1, sampwidth: int = 2) -> str:
    """Create a tiny valid WAV file."""
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(n_channels)
        wf.setsampwidth(sampwidth)
        wf.setframerate(sample_rate)
        wf.writeframes(struct.pack(f"<{n_frames}h", *([0] * n_frames)))
    return str(path)


def test_single_file_passthrough(tmp_path):
    """Single file → returned as-is, no concat."""
    wav = _make_wav(tmp_path / "a.wav")
    result, warnings = concatenate_wavs([wav])
    assert result == wav
    assert len(warnings) == 0


def test_empty_list():
    """Empty list → None."""
    result, warnings = concatenate_wavs([])
    assert result is None


def test_multi_file_concat(tmp_path):
    """Multiple files → merged into one WAV."""
    wav1 = _make_wav(tmp_path / "a.wav", n_frames=2400)
    wav2 = _make_wav(tmp_path / "b.wav", n_frames=2400)
    result, warnings = concatenate_wavs([wav1, wav2], output_dir=tmp_path / "out")
    assert result is not None
    assert Path(result).exists()
    # Merged file should be larger than either input
    with wave.open(result, "rb") as wf:
        merged_frames = wf.getnframes()
    assert merged_frames > 2400  # at least one chunk + silence


def test_silence_between_chunks(tmp_path):
    """Silence is inserted between chunks."""
    wav1 = _make_wav(tmp_path / "a.wav", n_frames=2400)
    wav2 = _make_wav(tmp_path / "b.wav", n_frames=2400)

    # With silence
    result_with, _ = concatenate_wavs([wav1, wav2], silence_ms=200, output_dir=tmp_path / "with")
    # Without silence
    result_without, _ = concatenate_wavs([wav1, wav2], silence_ms=0, output_dir=tmp_path / "without")

    with wave.open(result_with, "rb") as wf:
        frames_with = wf.getnframes()
    with wave.open(result_without, "rb") as wf:
        frames_without = wf.getnframes()

    assert frames_with > frames_without


def test_format_mismatch_skipped(tmp_path):
    """Chunk with different sample rate → skipped + warning."""
    wav1 = _make_wav(tmp_path / "a.wav", sample_rate=24000)
    wav2 = _make_wav(tmp_path / "b.wav", sample_rate=44100)
    result, warnings = concatenate_wavs([wav1, wav2], output_dir=tmp_path / "out")
    assert result is not None
    codes = [w.code for w in warnings]
    assert "concat_format_mismatch" in codes


def test_should_concat_env(monkeypatch):
    """should_concat() respects VOICE_SOUNDBOARD_CONCAT env var."""
    monkeypatch.delenv("VOICE_SOUNDBOARD_CONCAT", raising=False)
    assert should_concat() is False

    monkeypatch.setenv("VOICE_SOUNDBOARD_CONCAT", "1")
    assert should_concat() is True

    monkeypatch.setenv("VOICE_SOUNDBOARD_CONCAT", "false")
    assert should_concat() is False

    monkeypatch.setenv("VOICE_SOUNDBOARD_CONCAT", "true")
    assert should_concat() is True
