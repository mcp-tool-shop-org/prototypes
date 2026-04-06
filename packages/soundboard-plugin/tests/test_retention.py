"""Tests for WAV file retention policy."""

from __future__ import annotations

import os
import time
from pathlib import Path

import pytest

from voice_soundboard_plugin.playback.retention import (
    cleanup_old_wavs,
    delete_file_if_enabled,
    get_retention_minutes,
    is_delete_after_play,
)


class TestRetentionConfig:
    def test_default_retention_minutes(self, monkeypatch):
        monkeypatch.delenv("VOICE_SOUNDBOARD_RETENTION_MINUTES", raising=False)
        assert get_retention_minutes() == 240

    def test_custom_retention_minutes(self, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_RETENTION_MINUTES", "60")
        assert get_retention_minutes() == 60

    def test_delete_after_play_off_by_default(self, monkeypatch):
        monkeypatch.delenv("VOICE_SOUNDBOARD_DELETE_AFTER_PLAY", raising=False)
        assert not is_delete_after_play()

    def test_delete_after_play_on(self, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_DELETE_AFTER_PLAY", "1")
        assert is_delete_after_play()


class TestCleanupOldWavs:
    def test_deletes_old_files(self, tmp_path, monkeypatch):
        """Files older than retention are deleted."""
        monkeypatch.setenv("VOICE_SOUNDBOARD_OUTPUT_ROOT", str(tmp_path))
        old_wav = tmp_path / "old.wav"
        old_wav.write_bytes(b"\x00" * 100)
        # Set mtime to 5 hours ago
        old_time = time.time() - (5 * 3600)
        os.utime(old_wav, (old_time, old_time))

        deleted = cleanup_old_wavs(tmp_path, retention_minutes=240)
        assert deleted == 1
        assert not old_wav.exists()

    def test_preserves_recent_files(self, tmp_path, monkeypatch):
        """Recent files are not deleted."""
        monkeypatch.setenv("VOICE_SOUNDBOARD_OUTPUT_ROOT", str(tmp_path))
        new_wav = tmp_path / "new.wav"
        new_wav.write_bytes(b"\x00" * 100)

        deleted = cleanup_old_wavs(tmp_path, retention_minutes=240)
        assert deleted == 0
        assert new_wav.exists()

    def test_disabled_when_zero(self, tmp_path, monkeypatch):
        """retention_minutes=0 disables cleanup."""
        monkeypatch.setenv("VOICE_SOUNDBOARD_OUTPUT_ROOT", str(tmp_path))
        old_wav = tmp_path / "old.wav"
        old_wav.write_bytes(b"\x00" * 100)
        old_time = time.time() - (5 * 3600)
        os.utime(old_wav, (old_time, old_time))

        deleted = cleanup_old_wavs(tmp_path, retention_minutes=0)
        assert deleted == 0
        assert old_wav.exists()

    def test_nonexistent_directory(self, tmp_path, monkeypatch):
        """Missing directory returns 0 without error."""
        monkeypatch.setenv("VOICE_SOUNDBOARD_OUTPUT_ROOT", str(tmp_path))
        deleted = cleanup_old_wavs(tmp_path / "nonexistent", retention_minutes=240)
        assert deleted == 0

    def test_ignores_non_wav(self, tmp_path, monkeypatch):
        """Non-WAV files are not deleted."""
        monkeypatch.setenv("VOICE_SOUNDBOARD_OUTPUT_ROOT", str(tmp_path))
        txt_file = tmp_path / "notes.txt"
        txt_file.write_text("keep me")
        old_time = time.time() - (5 * 3600)
        os.utime(txt_file, (old_time, old_time))

        deleted = cleanup_old_wavs(tmp_path, retention_minutes=240)
        assert deleted == 0
        assert txt_file.exists()


class TestDeleteFileIfEnabled:
    def test_deletes_when_enabled(self, tmp_path, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_DELETE_AFTER_PLAY", "1")
        f = tmp_path / "temp.wav"
        f.write_bytes(b"\x00")
        assert delete_file_if_enabled(f)
        assert not f.exists()

    def test_skips_when_disabled(self, tmp_path, monkeypatch):
        monkeypatch.delenv("VOICE_SOUNDBOARD_DELETE_AFTER_PLAY", raising=False)
        f = tmp_path / "temp.wav"
        f.write_bytes(b"\x00")
        assert not delete_file_if_enabled(f)
        assert f.exists()

    def test_missing_file_no_error(self, tmp_path, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_DELETE_AFTER_PLAY", "1")
        result = delete_file_if_enabled(tmp_path / "gone.wav")
        assert result is True  # unlink(missing_ok=True) succeeds
