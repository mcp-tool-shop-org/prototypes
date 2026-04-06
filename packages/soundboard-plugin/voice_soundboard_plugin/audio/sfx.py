"""SFX WAV generation — pure-Python sine wave synthesis with envelopes.

Generates short audio cues (dings, chimes, clicks) as WAV files using
only stdlib (wave, math, struct). No external dependencies.

SFX files are cached in a temp directory and reused across requests.
Feature-gated via VOICE_SOUNDBOARD_ENABLE_SFX env var.
"""

from __future__ import annotations

import math
import os
import struct
import tempfile
import wave
from dataclasses import dataclass
from pathlib import Path

MAX_SFX_PER_REQUEST = 30
SAMPLE_RATE = 24000
AMPLITUDE = 0.6  # 0.0-1.0, moderate volume


@dataclass
class SfxDef:
    """Definition for a sound effect."""

    frequency: float  # Hz
    duration_ms: int  # milliseconds
    envelope: str  # "bell", "rising", "falling", "click"


SFX_CATALOG: dict[str, SfxDef] = {
    "ding":    SfxDef(frequency=880,  duration_ms=150, envelope="bell"),
    "chime":   SfxDef(frequency=660,  duration_ms=300, envelope="bell"),
    "success": SfxDef(frequency=523,  duration_ms=200, envelope="rising"),
    "fail":    SfxDef(frequency=220,  duration_ms=300, envelope="falling"),
    "click":   SfxDef(frequency=1200, duration_ms=50,  envelope="click"),
    "tick":    SfxDef(frequency=800,  duration_ms=80,  envelope="click"),
}

# Cache directory for generated WAVs
_CACHE_DIR: Path | None = None


def is_sfx_enabled() -> bool:
    """Check if SFX feature is enabled via env var."""
    v = os.environ.get("VOICE_SOUNDBOARD_ENABLE_SFX", "0")
    return str(v).strip().lower() in ("1", "true", "yes", "y", "on")


def _get_cache_dir() -> Path:
    """Get or create the SFX cache directory."""
    global _CACHE_DIR
    if _CACHE_DIR is None:
        _CACHE_DIR = Path(tempfile.gettempdir()) / "voice_soundboard_sfx"
        _CACHE_DIR.mkdir(exist_ok=True)
    return _CACHE_DIR


def get_sfx_path(tag: str) -> Path | None:
    """Get the WAV file path for an SFX tag. Generates if not cached.

    Returns None for unknown tags.
    """
    tag_lower = tag.lower()
    sfx_def = SFX_CATALOG.get(tag_lower)
    if sfx_def is None:
        return None

    cache_dir = _get_cache_dir()
    wav_path = cache_dir / f"sfx_{tag_lower}.wav"

    if not wav_path.exists():
        generate_sfx_wav(sfx_def, wav_path)

    return wav_path


def generate_sfx_wav(sfx_def: SfxDef, output_path: Path) -> None:
    """Generate a WAV file from an SfxDef using sine wave + envelope."""
    num_samples = int(SAMPLE_RATE * sfx_def.duration_ms / 1000)
    samples = _synthesize_samples(sfx_def.frequency, num_samples, sfx_def.envelope)

    with wave.open(str(output_path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(SAMPLE_RATE)
        # Pack as 16-bit signed integers
        raw = struct.pack(f"<{len(samples)}h", *samples)
        wf.writeframes(raw)


def _synthesize_samples(
    frequency: float,
    num_samples: int,
    envelope: str,
) -> list[int]:
    """Generate PCM16 samples with the given envelope shape."""
    samples: list[int] = []
    max_val = 32767

    for i in range(num_samples):
        t = i / SAMPLE_RATE
        progress = i / max(num_samples - 1, 1)  # 0.0 to 1.0

        # Sine wave
        value = math.sin(2 * math.pi * frequency * t)

        # Apply envelope
        env = _envelope(envelope, progress)
        value *= env * AMPLITUDE

        # Clamp and convert to int16
        sample = int(value * max_val)
        sample = max(-max_val, min(max_val, sample))
        samples.append(sample)

    return samples


def _envelope(kind: str, progress: float) -> float:
    """Compute envelope amplitude at a given progress (0.0 to 1.0)."""
    if kind == "bell":
        # Fast attack, exponential decay
        attack = min(progress * 20, 1.0)  # 5% attack
        decay = math.exp(-4 * progress)
        return attack * decay
    elif kind == "rising":
        # Linear ramp up with slight fade at end
        ramp = progress
        fade = 1.0 - max(0, (progress - 0.8) * 5)  # fade last 20%
        return ramp * fade
    elif kind == "falling":
        # Start at full, linear ramp down
        return 1.0 - progress
    elif kind == "click":
        # Very short burst — full for first 30%, then sharp cutoff
        if progress < 0.3:
            return 1.0
        return math.exp(-15 * (progress - 0.3))
    else:
        return 1.0
