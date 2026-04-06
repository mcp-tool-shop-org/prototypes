"""WAV concatenation — merge multiple chunk WAVs into a single file."""

from __future__ import annotations

import logging
import os
import struct
import wave
from pathlib import Path

from voice_soundboard_plugin.speech.types import SpeechWarning

logger = logging.getLogger(__name__)

DEFAULT_SILENCE_MS = 200


def should_concat() -> bool:
    """True if env VOICE_SOUNDBOARD_CONCAT is set (any truthy value)."""
    return os.environ.get("VOICE_SOUNDBOARD_CONCAT", "").strip().lower() in (
        "1", "true", "yes",
    )


def concatenate_wavs(
    audio_paths: list[str],
    silence_ms: int = DEFAULT_SILENCE_MS,
    output_dir: Path | None = None,
) -> tuple[str | None, list[SpeechWarning]]:
    """Concatenate multiple WAV files into one, with silence gaps.

    Args:
        audio_paths: Paths to WAV files to merge.
        silence_ms: Milliseconds of silence between chunks.
        output_dir: Where to write the merged file (default: tempdir).

    Returns:
        (merged_path, warnings). On error: (None, [concat_failed warning]).
    """
    warnings: list[SpeechWarning] = []

    if not audio_paths:
        return None, warnings

    # Single file → passthrough (no concat needed)
    if len(audio_paths) == 1:
        return audio_paths[0], warnings

    try:
        return _do_concat(audio_paths, silence_ms, output_dir, warnings)
    except Exception as exc:
        logger.error("[concat] failed: %s", exc)
        warnings.append(SpeechWarning(
            code="concat_failed",
            message=f"WAV concatenation failed: {exc}",
            original=len(audio_paths),
            resolved=None,
        ))
        return None, warnings


def _do_concat(
    audio_paths: list[str],
    silence_ms: int,
    output_dir: Path | None,
    warnings: list[SpeechWarning],
) -> tuple[str | None, list[SpeechWarning]]:
    """Internal concat implementation using stdlib wave module."""
    # Read first file to get reference params
    with wave.open(audio_paths[0], "rb") as ref:
        n_channels = ref.getnchannels()
        sampwidth = ref.getsampwidth()
        framerate = ref.getframerate()

    # Generate silence frames
    silence_frames = _make_silence(n_channels, sampwidth, framerate, silence_ms)

    # Write merged file
    from voice_soundboard_plugin.security.fs_sandbox import get_output_root, make_concat_filename
    if output_dir is None:
        output_dir = get_output_root()
    output_dir.mkdir(parents=True, exist_ok=True)
    merged_path = str(output_dir / make_concat_filename())

    with wave.open(merged_path, "wb") as out:
        out.setnchannels(n_channels)
        out.setsampwidth(sampwidth)
        out.setframerate(framerate)

        for i, path in enumerate(audio_paths):
            with wave.open(path, "rb") as inp:
                # Verify format matches reference
                if (inp.getnchannels() != n_channels
                        or inp.getsampwidth() != sampwidth
                        or inp.getframerate() != framerate):
                    warnings.append(SpeechWarning(
                        code="concat_format_mismatch",
                        message=(
                            f"Chunk {i} format mismatch "
                            f"({inp.getframerate()}Hz/{inp.getsampwidth()*8}bit "
                            f"vs {framerate}Hz/{sampwidth*8}bit), skipped"
                        ),
                        original=path,
                        resolved=None,
                    ))
                    continue

                out.writeframes(inp.readframes(inp.getnframes()))

            # Add silence between chunks (not after last)
            if i < len(audio_paths) - 1 and silence_frames:
                out.writeframes(silence_frames)

    logger.info(
        "[concat] merged %d WAVs → %s (silence=%dms)",
        len(audio_paths), merged_path, silence_ms,
    )
    return merged_path, warnings


def _make_silence(
    n_channels: int,
    sampwidth: int,
    framerate: int,
    duration_ms: int,
) -> bytes:
    """Generate silent PCM frames."""
    if duration_ms <= 0:
        return b""

    n_frames = int(framerate * duration_ms / 1000)
    # Silent sample = zero bytes
    return b"\x00" * (n_frames * n_channels * sampwidth)
