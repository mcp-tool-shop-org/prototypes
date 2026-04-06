"""Shared fixtures for claude-collaborate test suite.

Provides tmp_path-based file isolation and state cleanup to prevent
module-level state leaks between tests.
"""

from __future__ import annotations

import asyncio
import itertools
from pathlib import Path

import pytest
from aiohttp.test_utils import TestClient, TestServer

import server
import ws_bridge

# ---------------------------------------------------------------------------
# Shared utility: CountingLock
# ---------------------------------------------------------------------------


class CountingLock:
    """An async context-manager wrapper that counts how many times a lock is acquired.

    Used in tests to verify that file I/O operations properly acquire their
    respective locks.  Wraps a real ``asyncio.Lock`` so serialisation still
    works.

    Usage::

        counter = {"n": 0}
        lock = CountingLock(asyncio.Lock(), counter)
        monkeypatch.setattr(ws_bridge, "_message_file_lock", lock)
        # ... run code under test ...
        assert counter["n"] == expected_acquisitions
    """

    def __init__(self, lock: asyncio.Lock, counter: dict[str, int] | None = None):
        self._lock = lock
        self._counter = counter if counter is not None else {"n": 0}

    @property
    def count(self) -> int:
        return self._counter["n"]

    async def __aenter__(self):
        await self._lock.acquire()
        self._counter["n"] += 1
        return self

    async def __aexit__(self, *args):
        self._lock.release()

# ---------------------------------------------------------------------------
# File isolation: redirect MESSAGE_FILE / RESPONSE_FILE to tmp_path
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _isolate_files(tmp_path: Path, monkeypatch):
    """Redirect all file I/O to tmp_path and clear global WS state."""
    msg_file = tmp_path / "messages.jsonl"
    resp_file = tmp_path / "claude_responses.jsonl"

    # server.py paths
    monkeypatch.setattr(server, "MESSAGE_FILE", msg_file)
    monkeypatch.setattr(server, "RESPONSE_FILE", resp_file)

    # ws_bridge.py paths
    monkeypatch.setattr(ws_bridge, "MESSAGE_FILE", msg_file)
    monkeypatch.setattr(ws_bridge, "CLAUDE_RESPONSE_FILE", resp_file)

    # Reset locks to fresh instances so no test inherits a held lock
    monkeypatch.setattr(server, "_messages_lock", asyncio.Lock())
    monkeypatch.setattr(server, "_response_lock", asyncio.Lock())
    monkeypatch.setattr(ws_bridge, "_message_file_lock", asyncio.Lock())
    monkeypatch.setattr(ws_bridge, "_response_file_lock", asyncio.Lock())

    # Reset server.py session/history state
    server._history_buffer.clear()
    server._sessions.clear()
    server._ws_session_map.clear()
    monkeypatch.setattr(server, "_seq_counter", itertools.count(1))

    # Reset server.py metrics counters and streams
    monkeypatch.setattr(server, "_total_messages_received", 0)
    monkeypatch.setattr(server, "_total_responses_sent", 0)
    monkeypatch.setattr(server, "_total_ws_connections", 0)
    server._active_streams.clear()
    import time
    monkeypatch.setattr(server, "_server_start_time", time.monotonic())

    # Reset ws_bridge.py replay buffer, seq counter, metrics, streams
    ws_bridge._replay_buffer.clear()
    ws_bridge._inflight_streams.clear()
    monkeypatch.setattr(ws_bridge, "_seq_counter", itertools.count(1))
    monkeypatch.setattr(ws_bridge, "_total_messages", 0)
    monkeypatch.setattr(ws_bridge, "_total_responses", 0)

    yield

    # Teardown: clear connected client sets and session maps
    server.connected_ws_clients.clear()
    server._sessions.clear()
    server._ws_session_map.clear()
    server._history_buffer.clear()
    ws_bridge.connected_clients.clear()
    ws_bridge._replay_buffer.clear()
    ws_bridge._inflight_streams.clear()


# ---------------------------------------------------------------------------
# Shared test-client fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
async def server_client():
    """aiohttp TestClient for server.py."""
    app = server.create_app()
    async with TestClient(TestServer(app)) as c:
        yield c


@pytest.fixture
async def bridge_client():
    """aiohttp TestClient for ws_bridge.py."""
    app = ws_bridge.create_app()
    async with TestClient(TestServer(app)) as c:
        yield c
