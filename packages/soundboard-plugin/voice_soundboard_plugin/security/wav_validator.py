"""WAV header validator — verify engine output is valid audio.

Checks the RIFF/WAVE magic bytes and minimum file size. Does not
perform full format validation — just enough to catch corrupt or
non-WAV files from the engine.
"""

from __future__ import annotations

import logging
from pathlib import Path

logger = logging.getLogger(__name__)

WAV_RIFF_MAGIC = b"RIFF"
WAV_WAVE_MAGIC = b"WAVE"
MIN_WAV_SIZE = 44  # minimum WAV header size


def validate_wav(path: str | Path) -> tuple[bool, str]:
    """Validate that a file has a valid WAV header.

    Returns (valid, reason). If valid=False, reason explains why.
    """
    path = Path(path)

    if not path.exists():
        return False, f"File not found: {path.name}"

    size = path.stat().st_size
    if size < MIN_WAV_SIZE:
        return False, f"File too small for WAV: {size} bytes (min {MIN_WAV_SIZE})"

    try:
        with open(path, "rb") as f:
            header = f.read(12)
    except OSError as exc:
        return False, f"Cannot read file: {exc}"

    if len(header) < 12:
        return False, f"Header too short: {len(header)} bytes"

    if header[:4] != WAV_RIFF_MAGIC:
        return False, f"Missing RIFF magic: got {header[:4]!r}"

    if header[8:12] != WAV_WAVE_MAGIC:
        return False, f"Missing WAVE magic: got {header[8:12]!r}"

    return True, "ok"
