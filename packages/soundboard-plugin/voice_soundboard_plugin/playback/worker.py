"""PlaybackWorker — single-thread queue-based audio playback.

Replaces the spawn-a-thread-per-play pattern with a single long-lived
worker thread pulling commands from a queue. Supports three policy modes:

    replace (default): stop current, play latest
    queue:             play sequentially
    drop:              ignore new requests while busy

Env vars:
    VOICE_SOUNDBOARD_DISABLE_PLAYBACK   — skip playback entirely
    VOICE_SOUNDBOARD_PLAYBACK_MODE      — replace|queue|drop (default: replace)
    VOICE_SOUNDBOARD_PLAYBACK_BACKEND   — winsound|sounddevice (auto-detect)
    VOICE_SOUNDBOARD_BLOCKING_PLAYBACK  — legacy compat (ignored, worker is always async)
    VOICE_SOUNDBOARD_OUTPUT_DEVICE      — substring match on device name
    VOICE_SOUNDBOARD_OUTPUT_DEVICE_INDEX — sounddevice device index
    VOICE_SOUNDBOARD_LOG_DEVICES        — dump audio devices at startup
    VOICE_SOUNDBOARD_STOP_PREVIOUS      — legacy (replaced by playback mode)
"""

from __future__ import annotations

import enum
import logging
import os
import queue
import sys
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _truthy_env(name: str, default: str = "0") -> bool:
    v = os.environ.get(name, default)
    return str(v).strip().lower() in ("1", "true", "yes", "y", "on")


# ---------------------------------------------------------------------------
# Command protocol
# ---------------------------------------------------------------------------

@dataclass
class PlayCmd:
    path: str
    context: str = ""


@dataclass
class StopCmd:
    pass


@dataclass
class ShutdownCmd:
    pass


_Cmd = PlayCmd | StopCmd | ShutdownCmd


# ---------------------------------------------------------------------------
# PlaybackMode
# ---------------------------------------------------------------------------

class PlaybackMode(enum.Enum):
    REPLACE = "replace"
    QUEUE = "queue"
    DROP = "drop"

    @classmethod
    def from_env(cls) -> PlaybackMode:
        raw = os.environ.get("VOICE_SOUNDBOARD_PLAYBACK_MODE", "replace").strip().lower()
        try:
            return cls(raw)
        except ValueError:
            logger.warning("[playback] unknown mode '%s', defaulting to replace", raw)
            return cls.REPLACE


# ---------------------------------------------------------------------------
# PlaybackWorker
# ---------------------------------------------------------------------------

class PlaybackWorker:
    """Single-thread queue-based audio playback worker.

    Public API (matches old _AudioPlayer contract):
        .play(audio_path, context)
        .stop() -> bool
        .shutdown()
        .interrupted: threading.Event
        .enabled: bool
        .is_busy: bool
    """

    def __init__(
        self,
        *,
        backend: str | None = None,
        mode: PlaybackMode | None = None,
        enabled: bool | None = None,
    ):
        # Config from env
        self.enabled = enabled if enabled is not None else not _truthy_env("VOICE_SOUNDBOARD_DISABLE_PLAYBACK")
        self._mode = mode or PlaybackMode.from_env()
        self.log_devices = _truthy_env("VOICE_SOUNDBOARD_LOG_DEVICES")

        # Device config
        self.device_name = os.environ.get("VOICE_SOUNDBOARD_OUTPUT_DEVICE", "").strip()
        idx = os.environ.get("VOICE_SOUNDBOARD_OUTPUT_DEVICE_INDEX", "").strip()
        self.device_index: int | None = int(idx) if idx.isdigit() else None

        # Backend
        if backend:
            self._backend = backend
        else:
            forced = os.environ.get("VOICE_SOUNDBOARD_PLAYBACK_BACKEND", "").strip().lower()
            if forced in ("sounddevice", "winsound"):
                self._backend = forced
            elif sys.platform == "win32":
                self._backend = "winsound"
            else:
                self._backend = "sounddevice"

        # Timeout guard
        max_s = os.environ.get("VOICE_SOUNDBOARD_MAX_PLAY_SECONDS", "").strip()
        self._max_play_seconds: int = int(max_s) if max_s.isdigit() else 30

        # State
        self._queue: queue.Queue[_Cmd] = queue.Queue()
        self._busy = threading.Event()
        self.interrupted = threading.Event()
        self._shutdown = False

        logger.info(
            "[playback] worker: backend=%s, mode=%s, enabled=%s",
            self._backend, self._mode.value, self.enabled,
        )

        if self.log_devices:
            self._log_available_devices()

        # Start worker thread
        self._thread = threading.Thread(target=self._run, daemon=True, name="playback-worker")
        self._thread.start()

    # -- Public API ----------------------------------------------------------

    @property
    def mode(self) -> PlaybackMode:
        return self._mode

    @property
    def is_busy(self) -> bool:
        return self._busy.is_set()

    def play(self, audio_path: str | None, context: str = "") -> None:
        """Submit a play request. Behavior depends on playback mode."""
        if not self.enabled or not audio_path or self._shutdown:
            return
        p = Path(audio_path)
        if not p.exists():
            logger.warning("[playback] file not found: %s (%s)", audio_path, context)
            return

        if self._mode == PlaybackMode.REPLACE:
            self._drain_play_cmds()
            self._queue.put(StopCmd())
            self._queue.put(PlayCmd(str(p), context))
        elif self._mode == PlaybackMode.QUEUE:
            self._queue.put(PlayCmd(str(p), context))
        elif self._mode == PlaybackMode.DROP:
            if self._busy.is_set():
                logger.debug("[playback] dropping %s (busy)", context)
                return
            self._queue.put(PlayCmd(str(p), context))

    def stop(self) -> bool:
        """Stop current playback immediately. Returns True if something was stopped."""
        self.interrupted.set()
        self._drain_play_cmds()
        return self._stop_audio()

    def shutdown(self) -> None:
        """Shut down the worker thread. Call on server exit."""
        if self._shutdown:
            return
        self._shutdown = True
        self._queue.put(ShutdownCmd())
        self._thread.join(timeout=2.0)
        if self._thread.is_alive():
            logger.warning("[playback] worker thread did not exit in time")

    # -- Worker loop ---------------------------------------------------------

    def _run(self) -> None:
        """Main worker loop — runs on the dedicated playback thread."""
        while True:
            try:
                cmd = self._queue.get(timeout=1.0)
            except queue.Empty:
                continue

            if isinstance(cmd, ShutdownCmd):
                logger.info("[playback] worker shutting down")
                break
            elif isinstance(cmd, StopCmd):
                self._stop_audio()
                continue
            elif isinstance(cmd, PlayCmd):
                self.interrupted.clear()
                self._busy.set()
                try:
                    self._play_sync(cmd.path, cmd.context)
                finally:
                    self._busy.clear()

    # -- Playback backends ---------------------------------------------------

    def _play_sync(self, audio_path: str, context: str = "") -> None:
        """Play a WAV file synchronously on the worker thread.

        Protected by a Timer that calls _stop_audio() if playback exceeds
        _max_play_seconds. This prevents hangs from broken audio devices.
        """
        timer = threading.Timer(
            self._max_play_seconds,
            self._timeout_stop,
            args=(context,),
        )
        timer.daemon = True
        timer.start()
        try:
            if self._backend == "winsound":
                self._play_winsound(audio_path, context)
            else:
                self._play_sounddevice(audio_path, context)
        finally:
            timer.cancel()
            # Delete-after-play (if enabled via env)
            from voice_soundboard_plugin.playback.retention import delete_file_if_enabled
            delete_file_if_enabled(audio_path)

    def _timeout_stop(self, context: str = "") -> None:
        """Called by the watchdog timer if playback exceeds max seconds."""
        logger.warning(
            "[playback] timeout after %ds, forcing stop (%s)",
            self._max_play_seconds, context,
        )
        self._stop_audio()

    def _play_winsound(self, audio_path: str, context: str = "") -> None:
        try:
            import winsound
            logger.info("[playback] winsound path=%s context=%s", audio_path, context)
            winsound.PlaySound(audio_path, winsound.SND_FILENAME)
            logger.info("[playback] completed path=%s", audio_path)
        except Exception as exc:
            logger.warning("[playback] winsound failed: %s (%s), trying sounddevice", exc, context)
            self._play_sounddevice(audio_path, context)

    def _play_sounddevice(self, audio_path: str, context: str = "") -> None:
        try:
            import sounddevice as sd
            import soundfile as sf

            data, sr = sf.read(audio_path, dtype="float32", always_2d=False)
            device = self._resolve_device()
            if device is not None:
                sd.play(data, sr, device=device)
            else:
                sd.play(data, sr)
            logger.info("[playback] sounddevice path=%s device=%s context=%s", audio_path, device, context)
            sd.wait()
            logger.info("[playback] completed path=%s", audio_path)
        except Exception as exc:
            logger.error("[playback] all methods failed: %s (%s)", exc, context)

    def _stop_audio(self) -> bool:
        """Stop audio on the current backend. Called from any thread."""
        stopped = False
        if self._backend == "winsound":
            try:
                import winsound
                winsound.PlaySound(None, winsound.SND_PURGE)
                stopped = True
                logger.info("[playback] winsound stopped")
            except Exception as exc:
                logger.warning("[playback] winsound stop failed: %s", exc)
        else:
            try:
                import sounddevice as sd
                sd.stop()
                stopped = True
                logger.info("[playback] sounddevice stopped")
            except Exception as exc:
                logger.warning("[playback] sounddevice stop failed: %s", exc)
        return stopped

    # -- Device helpers ------------------------------------------------------

    def _resolve_device(self) -> int | None:
        if self.device_index is not None:
            return self.device_index
        if not self.device_name:
            return None
        try:
            import sounddevice as sd
            for i, d in enumerate(sd.query_devices()):
                if self.device_name.lower() in str(d.get("name", "")).lower():
                    return i
        except Exception:
            pass
        return None

    def _log_available_devices(self) -> None:
        try:
            import sounddevice as sd
            devices = sd.query_devices()
            logger.info("[playback] === Audio Device Dump ===")
            for i, d in enumerate(devices):
                if d.get("max_output_channels", 0) > 0:
                    logger.info(
                        "[playback]   [%d] %s (outputs=%d, sr=%.0f)",
                        i, d.get("name", "?"),
                        d.get("max_output_channels", 0),
                        d.get("default_samplerate", 0),
                    )
            default = sd.query_devices(kind="output")
            logger.info("[playback] Default output: %s", default.get("name", "?"))
        except Exception as exc:
            logger.info("[playback] Device dump unavailable: %s", exc)

    # -- Internal helpers ----------------------------------------------------

    def _drain_play_cmds(self) -> None:
        """Drain all pending PlayCmd items from the queue (keep Stop/Shutdown)."""
        requeue: list[_Cmd] = []
        while True:
            try:
                cmd = self._queue.get_nowait()
                if not isinstance(cmd, PlayCmd):
                    requeue.append(cmd)
            except queue.Empty:
                break
        for cmd in requeue:
            self._queue.put(cmd)

    # -- Testing support -----------------------------------------------------

    @classmethod
    def _create_for_testing(
        cls,
        *,
        backend: str = "winsound",
        mode: PlaybackMode = PlaybackMode.REPLACE,
        enabled: bool = True,
    ) -> PlaybackWorker:
        """Create a PlaybackWorker with mocked audio backends for testing."""
        from unittest.mock import MagicMock

        worker = cls.__new__(cls)
        worker.enabled = enabled
        worker._mode = mode
        worker._backend = backend
        worker.log_devices = False
        worker.device_name = ""
        worker.device_index = None
        worker._max_play_seconds = 30
        worker._queue = queue.Queue()
        worker._busy = threading.Event()
        worker.interrupted = threading.Event()
        worker._shutdown = False
        worker._play_winsound = MagicMock()  # type: ignore[assignment]
        worker._play_sounddevice = MagicMock()  # type: ignore[assignment]
        worker._stop_audio = MagicMock(return_value=True)  # type: ignore[assignment]
        worker._thread = threading.Thread(target=worker._run, daemon=True, name="playback-worker-test")
        worker._thread.start()
        return worker
