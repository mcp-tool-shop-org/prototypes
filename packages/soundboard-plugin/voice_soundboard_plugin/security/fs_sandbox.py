"""Filesystem sandbox — output directory containment and safe filenames.

All synthesized WAV output is confined to a single OUTPUT_ROOT directory.
Path traversal attempts (../, absolute paths) are rejected.

Env vars:
    VOICE_SOUNDBOARD_OUTPUT_ROOT — override output directory (default: {tempdir}/voice-soundboard/)
"""

from __future__ import annotations

import os
import tempfile
import uuid
from pathlib import Path

_DEFAULT_OUTPUT_ROOT = Path(tempfile.gettempdir()) / "voice-soundboard"


def get_output_root() -> Path:
    """Get the output root directory, creating it if needed.

    Default: {tempdir}/voice-soundboard/
    Override: VOICE_SOUNDBOARD_OUTPUT_ROOT env var.
    """
    env_root = os.environ.get("VOICE_SOUNDBOARD_OUTPUT_ROOT", "").strip()
    if env_root:
        root = Path(env_root).resolve()
    else:
        root = _DEFAULT_OUTPUT_ROOT.resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def safe_path(filename: str, output_root: Path | None = None) -> Path:
    """Resolve a filename inside OUTPUT_ROOT with containment check.

    Raises ValueError if the resolved path escapes OUTPUT_ROOT.
    """
    if output_root is None:
        output_root = get_output_root()
    output_root = output_root.resolve()

    candidate = (output_root / filename).resolve()

    try:
        candidate.relative_to(output_root)
    except ValueError:
        raise ValueError(
            f"Path '{filename}' resolves outside output root '{output_root}'"
        )

    return candidate


def make_concat_filename(voice: str = "merged") -> str:
    """Generate a unique concat output filename: {voice}_{uuid8}.wav"""
    short_uuid = uuid.uuid4().hex[:8]
    safe_voice = "".join(c if c.isalnum() or c == "_" else "_" for c in voice)
    return f"{safe_voice}_{short_uuid}.wav"


def is_inside_output_root(path: Path, output_root: Path | None = None) -> bool:
    """Check if a path is inside the output root."""
    if output_root is None:
        output_root = get_output_root()
    try:
        path.resolve().relative_to(output_root.resolve())
        return True
    except ValueError:
        return False
