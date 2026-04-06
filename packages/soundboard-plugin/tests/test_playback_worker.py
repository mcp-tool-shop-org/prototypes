"""Tests for PlaybackWorker — queue-based playback with policy modes."""

from __future__ import annotations

import time
import threading

import pytest

from voice_soundboard_plugin.playback.worker import PlaybackMode, PlaybackWorker


@pytest.fixture
def replace_worker(temp_wav):
    """Worker in replace mode with mocked backends."""
    w = PlaybackWorker._create_for_testing(mode=PlaybackMode.REPLACE)
    yield w
    w.shutdown()


@pytest.fixture
def queue_worker(temp_wav):
    """Worker in queue mode with mocked backends."""
    w = PlaybackWorker._create_for_testing(mode=PlaybackMode.QUEUE)
    yield w
    w.shutdown()


@pytest.fixture
def drop_worker(temp_wav):
    """Worker in drop mode with mocked backends."""
    w = PlaybackWorker._create_for_testing(mode=PlaybackMode.DROP)
    yield w
    w.shutdown()


class TestPlaybackModeEnum:
    def test_from_env_default(self, monkeypatch):
        monkeypatch.delenv("VOICE_SOUNDBOARD_PLAYBACK_MODE", raising=False)
        assert PlaybackMode.from_env() == PlaybackMode.REPLACE

    def test_from_env_queue(self, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_PLAYBACK_MODE", "queue")
        assert PlaybackMode.from_env() == PlaybackMode.QUEUE

    def test_from_env_invalid(self, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_PLAYBACK_MODE", "nonsense")
        assert PlaybackMode.from_env() == PlaybackMode.REPLACE


class TestReplaceMode:
    def test_play_calls_backend(self, replace_worker, temp_wav):
        replace_worker.play(str(temp_wav), "test")
        time.sleep(0.2)
        assert replace_worker._play_winsound.called or replace_worker._play_sounddevice.called

    def test_stop_sets_interrupted(self, replace_worker):
        replace_worker.stop()
        assert replace_worker.interrupted.is_set()

    def test_stop_drains_queue(self, replace_worker, temp_wav):
        # Enqueue several plays
        for i in range(5):
            replace_worker._queue.put(
                __import__("voice_soundboard_plugin.playback.worker", fromlist=["PlayCmd"]).PlayCmd(str(temp_wav), f"drain-{i}")
            )
        replace_worker.stop()
        # Queue should be drained of PlayCmds
        assert replace_worker._queue.empty()

    def test_replace_stops_before_new(self, replace_worker, temp_wav):
        """Replace mode sends StopCmd before each new PlayCmd."""
        replace_worker.play(str(temp_wav), "first")
        replace_worker.play(str(temp_wav), "second")
        time.sleep(0.2)
        assert replace_worker._stop_audio.called


class TestQueueMode:
    def test_plays_sequentially(self, queue_worker, temp_wav):
        calls = []
        original_play = queue_worker._play_winsound

        def track_play(path, ctx=""):
            calls.append(ctx)
            original_play(path, ctx)

        queue_worker._play_winsound = track_play
        queue_worker.play(str(temp_wav), "first")
        queue_worker.play(str(temp_wav), "second")
        queue_worker.play(str(temp_wav), "third")
        time.sleep(0.5)
        assert len(calls) == 3
        assert calls == ["first", "second", "third"]


class TestDropMode:
    def test_drops_when_busy(self, drop_worker, temp_wav):
        # Simulate busy state
        drop_worker._busy.set()
        drop_worker.play(str(temp_wav), "should-drop")
        time.sleep(0.1)
        # Nothing should have been queued (no play call)
        assert not drop_worker._play_winsound.called
        drop_worker._busy.clear()

    def test_plays_when_idle(self, drop_worker, temp_wav):
        drop_worker.play(str(temp_wav), "should-play")
        time.sleep(0.2)
        assert drop_worker._play_winsound.called


class TestShutdown:
    def test_shutdown_joins_thread(self, temp_wav):
        w = PlaybackWorker._create_for_testing()
        assert w._thread.is_alive()
        w.shutdown()
        assert not w._thread.is_alive()

    def test_double_shutdown_safe(self, temp_wav):
        w = PlaybackWorker._create_for_testing()
        w.shutdown()
        w.shutdown()  # should not raise


class TestDisabledWorker:
    def test_disabled_skips_play(self, temp_wav):
        w = PlaybackWorker._create_for_testing(enabled=False)
        w.play(str(temp_wav), "should-skip")
        time.sleep(0.1)
        assert not w._play_winsound.called
        w.shutdown()

    def test_disabled_stop_returns(self, temp_wav):
        w = PlaybackWorker._create_for_testing(enabled=False)
        result = w.stop()
        assert result is True  # mocked _stop_audio returns True
        w.shutdown()
