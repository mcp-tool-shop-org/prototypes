"""Tests for filesystem sandbox — output root, path containment, UUID filenames."""

from __future__ import annotations

import re
import struct
import time
import wave
from pathlib import Path

import pytest

from voice_soundboard_plugin.security.fs_sandbox import (
    get_output_root,
    is_inside_output_root,
    make_concat_filename,
    safe_path,
)


class TestGetOutputRoot:
    """Output root directory resolution."""

    def test_default_ends_with_voice_soundboard(self, monkeypatch):
        monkeypatch.delenv("VOICE_SOUNDBOARD_OUTPUT_ROOT", raising=False)
        root = get_output_root()
        assert root.name == "voice-soundboard"
        assert root.exists()

    def test_env_override(self, tmp_path, monkeypatch):
        custom = tmp_path / "custom-output"
        monkeypatch.setenv("VOICE_SOUNDBOARD_OUTPUT_ROOT", str(custom))
        root = get_output_root()
        assert root == custom.resolve()
        assert root.exists()

    def test_creates_directory(self, tmp_path, monkeypatch):
        custom = tmp_path / "new" / "nested" / "dir"
        monkeypatch.setenv("VOICE_SOUNDBOARD_OUTPUT_ROOT", str(custom))
        root = get_output_root()
        assert root.exists()


class TestSafePath:
    """Path containment checks."""

    def test_normal_filename(self, tmp_path, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_OUTPUT_ROOT", str(tmp_path))
        path = safe_path("test.wav")
        assert str(tmp_path) in str(path)
        assert path.name == "test.wav"

    def test_dotdot_rejected(self, tmp_path, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_OUTPUT_ROOT", str(tmp_path))
        with pytest.raises(ValueError, match="outside output root"):
            safe_path("../../etc/passwd")

    def test_double_dotdot_rejected(self, tmp_path, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_OUTPUT_ROOT", str(tmp_path))
        with pytest.raises(ValueError, match="outside output root"):
            safe_path("../outside.wav")

    def test_explicit_output_root_param(self, tmp_path):
        path = safe_path("ok.wav", output_root=tmp_path)
        assert path == (tmp_path / "ok.wav").resolve()

    def test_traversal_with_explicit_root(self, tmp_path):
        with pytest.raises(ValueError):
            safe_path("../../evil.wav", output_root=tmp_path)


class TestMakeConcatFilename:
    """UUID-based unique filenames."""

    def test_unique(self):
        a = make_concat_filename()
        b = make_concat_filename()
        assert a != b

    def test_default_prefix(self):
        name = make_concat_filename()
        assert name.startswith("merged_")
        assert name.endswith(".wav")

    def test_custom_voice(self):
        name = make_concat_filename("am_fenrir")
        assert name.startswith("am_fenrir_")
        assert name.endswith(".wav")

    def test_format_pattern(self):
        name = make_concat_filename()
        assert re.match(r"^merged_[a-f0-9]{8}\.wav$", name)

    def test_sanitizes_special_chars(self):
        name = make_concat_filename("bad/voice\\name")
        assert "/" not in name
        assert "\\" not in name


class TestIsInsideOutputRoot:
    """Output root membership check."""

    def test_inside(self, tmp_path, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_OUTPUT_ROOT", str(tmp_path))
        assert is_inside_output_root(tmp_path / "test.wav")

    def test_outside(self, tmp_path, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_OUTPUT_ROOT", str(tmp_path))
        assert not is_inside_output_root(tmp_path.parent / "elsewhere.wav")


class TestRetentionSandbox:
    """Retention cleanup respects output root boundary."""

    def test_skips_outside_output_root(self, tmp_path, monkeypatch):
        from voice_soundboard_plugin.playback.retention import cleanup_old_wavs

        # Set output root to a specific subdir
        output_root = tmp_path / "output"
        output_root.mkdir()
        monkeypatch.setenv("VOICE_SOUNDBOARD_OUTPUT_ROOT", str(output_root))

        # Create an old WAV outside the output root
        outside_dir = tmp_path / "other"
        outside_dir.mkdir()
        old_wav = outside_dir / "old.wav"
        _write_tiny_wav(old_wav)
        # Backdate it
        import os
        old_time = time.time() - 86400  # 1 day ago
        os.utime(old_wav, (old_time, old_time))

        # Cleanup should skip (outside output root)
        deleted = cleanup_old_wavs(outside_dir, retention_minutes=1)
        assert deleted == 0
        assert old_wav.exists()

    def test_cleans_inside_output_root(self, tmp_path, monkeypatch):
        from voice_soundboard_plugin.playback.retention import cleanup_old_wavs

        monkeypatch.setenv("VOICE_SOUNDBOARD_OUTPUT_ROOT", str(tmp_path))

        old_wav = tmp_path / "old.wav"
        _write_tiny_wav(old_wav)
        import os
        old_time = time.time() - 86400
        os.utime(old_wav, (old_time, old_time))

        deleted = cleanup_old_wavs(tmp_path, retention_minutes=1)
        assert deleted == 1
        assert not old_wav.exists()


def _write_tiny_wav(path: Path) -> None:
    """Write a minimal valid WAV for testing."""
    n_frames = 100
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(24000)
        wf.writeframes(struct.pack(f"<{n_frames}h", *([0] * n_frames)))
