from __future__ import annotations

import asyncio
import json
from pathlib import Path

from conftest import CountingLock

import ws_bridge

# =============================================================================
# P0: File rotation tests
# =============================================================================


def test_rotate_file_if_needed_no_rotation_under_threshold(tmp_path: Path, monkeypatch):
    """P0: Files under MAX_FILE_SIZE_BYTES are not rotated."""
    test_file = tmp_path / "test.jsonl"
    test_file.write_text("small content\n", encoding="utf-8")

    monkeypatch.setattr(ws_bridge, "MAX_FILE_SIZE_BYTES", 1000)  # 1KB threshold

    ws_bridge._rotate_file_if_needed(test_file)

    # File should remain unchanged
    assert test_file.exists()
    assert test_file.read_text(encoding="utf-8") == "small content\n"
    assert not (tmp_path / "test.jsonl.1").exists()


def test_rotate_file_if_needed_rotates_at_threshold(tmp_path: Path, monkeypatch):
    """P0: Files at or over MAX_FILE_SIZE_BYTES are rotated."""
    test_file = tmp_path / "test.jsonl"
    large_content = "x" * 2000  # 2KB content
    test_file.write_text(large_content, encoding="utf-8")

    monkeypatch.setattr(ws_bridge, "MAX_FILE_SIZE_BYTES", 1000)  # 1KB threshold

    ws_bridge._rotate_file_if_needed(test_file)

    # Original file should be empty, .1 should have old content
    assert test_file.exists()
    assert test_file.read_text(encoding="utf-8") == ""
    backup_1 = tmp_path / "test.jsonl.1"
    assert backup_1.exists()
    assert backup_1.read_text(encoding="utf-8") == large_content


def test_rotate_file_cascade(tmp_path: Path, monkeypatch):
    """P0: Rotation cascades .1 -> .2 and deletes old .2."""
    test_file = tmp_path / "test.jsonl"
    backup_1 = tmp_path / "test.jsonl.1"
    backup_2 = tmp_path / "test.jsonl.2"

    # Set up existing backups
    test_file.write_text("current" * 500, encoding="utf-8")
    backup_1.write_text("backup1_content", encoding="utf-8")
    backup_2.write_text("backup2_will_be_deleted", encoding="utf-8")

    monkeypatch.setattr(ws_bridge, "MAX_FILE_SIZE_BYTES", 1000)

    ws_bridge._rotate_file_if_needed(test_file)

    # Check rotation cascade
    assert test_file.read_text(encoding="utf-8") == ""
    assert backup_1.read_text(encoding="utf-8") == "current" * 500
    assert backup_2.read_text(encoding="utf-8") == "backup1_content"


def test_rotate_file_nonexistent_file(tmp_path: Path):
    """P0: Rotation handles nonexistent files gracefully."""
    nonexistent = tmp_path / "does_not_exist.jsonl"
    ws_bridge._rotate_file_if_needed(nonexistent)
    # Should not raise, should not create file
    assert not nonexistent.exists()


# =============================================================================
# P0: File locking tests
# =============================================================================


async def test_concurrent_message_writes_use_lock(tmp_path: Path, monkeypatch):
    """P0: Concurrent message writes are serialized by lock."""
    msg_file = tmp_path / "messages.jsonl"
    msg_file.touch()
    monkeypatch.setattr(ws_bridge, "MESSAGE_FILE", msg_file)
    monkeypatch.setattr(ws_bridge, "MAX_FILE_SIZE_BYTES", 10 * 1024 * 1024)

    # Track lock acquisitions using shared CountingLock
    counting_lock = CountingLock(asyncio.Lock())
    monkeypatch.setattr(ws_bridge, "_message_file_lock", counting_lock)

    # Create mock WebSocket
    class MockWS:
        async def send_json(self, data):
            pass

    ws = MockWS()

    # Run multiple handle_message calls concurrently
    tasks = [
        ws_bridge.handle_message(ws, {"type": "user_message", "content": f"msg{i}"})
        for i in range(5)
    ]
    await asyncio.gather(*tasks)

    # Verify lock was acquired for each write
    assert counting_lock.count == 5


async def test_concurrent_response_reads_use_lock(tmp_path: Path, monkeypatch):
    """P0: Concurrent response reads are serialized by lock."""
    resp_file = tmp_path / "responses.jsonl"
    resp_file.write_text('{"type":"test"}\n', encoding="utf-8")
    monkeypatch.setattr(ws_bridge, "CLAUDE_RESPONSE_FILE", resp_file)

    counting_lock = CountingLock(asyncio.Lock())
    monkeypatch.setattr(ws_bridge, "_response_file_lock", counting_lock)

    # Run multiple reads concurrently
    tasks = [ws_bridge.get_claude_responses() for _ in range(10)]
    await asyncio.gather(*tasks)

    # Each call should have acquired the lock
    assert counting_lock.count == 10


# =============================================================================
# Existing tests (unchanged)
# =============================================================================


async def test_get_claude_responses_reads_all_lines_and_clears(tmp_path: Path, monkeypatch):
    resp_file = tmp_path / "claude_responses.jsonl"
    monkeypatch.setattr(ws_bridge, "CLAUDE_RESPONSE_FILE", resp_file)

    lines = [
        {"type": "claude_response", "content": f"r{i}", "timestamp": "t"}
        for i in range(50)
    ]
    resp_file.write_text("".join(json.dumps(x) + "\n" for x in lines), encoding="utf-8")

    out = await ws_bridge.get_claude_responses()
    assert len(out) == 50
    assert out[0]["content"] == "r0"
    assert out[-1]["content"] == "r49"
    # Cleared after read
    assert resp_file.read_text(encoding="utf-8") == ""


async def test_get_messages_reads_all_lines_and_clears(tmp_path: Path, monkeypatch):
    msg_file = tmp_path / "messages.jsonl"
    monkeypatch.setattr(ws_bridge, "MESSAGE_FILE", msg_file)

    lines = [
        {"type": "user_message", "content": f"m{i}", "timestamp": "t"}
        for i in range(200)
    ]
    msg_file.write_text("".join(json.dumps(x) + "\n" for x in lines), encoding="utf-8")

    # Call the handler directly; request isn't used by current implementation.
    resp = await ws_bridge.get_messages(None)  # type: ignore[arg-type]
    payload = json.loads(resp.text)

    assert payload["count"] == 200
    assert payload["messages"][0]["content"] == "m0"
    assert payload["messages"][-1]["content"] == "m199"
    # Cleared after read
    assert msg_file.read_text(encoding="utf-8") == ""
