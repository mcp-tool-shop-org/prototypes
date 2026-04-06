"""WAV file retention — cleanup old synthesized audio files.

Env vars:
    VOICE_SOUNDBOARD_RETENTION_MINUTES — minutes before WAVs are purged (default: 240, 0=disabled)
    VOICE_SOUNDBOARD_DELETE_AFTER_PLAY  — delete WAV immediately after playback (default: 0)
"""

from __future__ import annotations

import logging
import os
import time
from pathlib import Path

logger = logging.getLogger(__name__)

DEFAULT_RETENTION_MINUTES = 240  # 4 hours


def get_retention_minutes() -> int:
    """Get retention minutes from env, defaulting to 240."""
    v = os.environ.get("VOICE_SOUNDBOARD_RETENTION_MINUTES", "").strip()
    if v.isdigit():
        return int(v)
    return DEFAULT_RETENTION_MINUTES


def is_delete_after_play() -> bool:
    """Check if delete-after-play is enabled."""
    v = os.environ.get("VOICE_SOUNDBOARD_DELETE_AFTER_PLAY", "0")
    return str(v).strip().lower() in ("1", "true", "yes", "y", "on")


def cleanup_old_wavs(directory: Path, retention_minutes: int | None = None) -> int:
    """Delete WAV files older than retention_minutes. Returns count deleted.

    Skips directories that don't exist or are outside the output root.
    Retention of 0 disables cleanup.
    """
    if retention_minutes is None:
        retention_minutes = get_retention_minutes()
    if retention_minutes <= 0:
        return 0
    if not directory.exists():
        return 0

    # Safety: only clean inside the output root
    from voice_soundboard_plugin.security.fs_sandbox import is_inside_output_root
    if not is_inside_output_root(directory):
        logger.warning("[retention] %s is outside output root, skipping cleanup", directory)
        return 0

    cutoff = time.time() - (retention_minutes * 60)
    deleted = 0
    for f in directory.glob("*.wav"):
        try:
            if f.stat().st_mtime < cutoff:
                f.unlink()
                deleted += 1
        except OSError as exc:
            logger.warning("[retention] failed to delete %s: %s", f, exc)

    if deleted:
        logger.info("[retention] cleaned up %d WAV files from %s", deleted, directory)
    return deleted


def delete_file_if_enabled(path: str | Path) -> bool:
    """Delete a file if DELETE_AFTER_PLAY is enabled. Returns True if deleted."""
    if not is_delete_after_play():
        return False
    try:
        Path(path).unlink(missing_ok=True)
        return True
    except OSError:
        return False
