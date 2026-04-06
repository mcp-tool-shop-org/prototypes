"""Shared fixtures for speech pipeline tests."""

from __future__ import annotations

import struct
import threading
import wave
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock

import pytest

from voice_soundboard_plugin.playback.worker import PlaybackMode, PlaybackWorker


@dataclass
class FakeSpeechResult:
    """Mimics voice_soundboard SpeechResult for testing."""

    audio_path: Path
    duration_seconds: float = 1.5
    generation_time: float = 0.3
    voice_used: str = "am_fenrir"
    sample_rate: int = 24000
    realtime_factor: float = 5.0


@pytest.fixture
def temp_wav(tmp_path: Path) -> Path:
    """Create a tiny valid WAV file for playback tests."""
    wav_path = tmp_path / "test.wav"
    n_frames = 2400  # 0.1s at 24kHz
    with wave.open(str(wav_path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(24000)
        wf.writeframes(struct.pack(f"<{n_frames}h", *([0] * n_frames)))
    return wav_path


@pytest.fixture
def mock_engine(temp_wav: Path) -> Any:
    """Engine mock that returns a FakeSpeechResult without synthesis."""
    engine = MagicMock()
    engine.speak.return_value = FakeSpeechResult(audio_path=temp_wav)
    return engine


@pytest.fixture
def disabled_player() -> Any:
    """PlaybackWorker mock with playback disabled."""
    player = MagicMock()
    player.enabled = False
    player.play = MagicMock()
    player.stop = MagicMock(return_value=False)
    player.interrupted = threading.Event()
    return player


@pytest.fixture
def mock_worker(temp_wav: Path) -> PlaybackWorker:
    """PlaybackWorker with mocked audio backends for testing."""
    worker = PlaybackWorker._create_for_testing(
        backend="winsound",
        mode=PlaybackMode.REPLACE,
    )
    yield worker  # type: ignore[misc]
    worker.shutdown()


@pytest.fixture
def disabled_worker() -> PlaybackWorker:
    """PlaybackWorker that is disabled (enabled=False)."""
    worker = PlaybackWorker._create_for_testing(
        backend="winsound",
        mode=PlaybackMode.REPLACE,
        enabled=False,
    )
    yield worker  # type: ignore[misc]
    worker.shutdown()
