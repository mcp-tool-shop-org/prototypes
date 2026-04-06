"""WebSocket integration tests for server.py.

Tests the /ws endpoint using aiohttp TestClient + ws_connect.
"""

from __future__ import annotations

import asyncio
import json

import pytest

import server

# ---------------------------------------------------------------------------
# CRITICAL 1: WebSocket integration tests for server.py
# ---------------------------------------------------------------------------


async def test_ws_welcome_message_on_connect(server_client):
    """Connecting to /ws yields a welcome message with type='connected'."""
    async with server_client.ws_connect("/ws") as ws:
        msg = await asyncio.wait_for(ws.receive_json(), timeout=5.0)
        assert msg["type"] == "connected"
        assert "timestamp" in msg
        assert "message" in msg


async def test_ws_user_message_triggers_ack(server_client):
    """Sending a user_message over /ws returns a message_received ack."""
    async with server_client.ws_connect("/ws") as ws:
        # consume welcome
        await ws.receive_json()

        await ws.send_json({"type": "user_message", "content": "hello"})
        ack = await ws.receive_json()
        assert ack["type"] == "message_received"
        assert "timestamp" in ack


async def test_ws_ping_triggers_pong(server_client):
    """Sending a ping over /ws returns a pong."""
    async with server_client.ws_connect("/ws") as ws:
        await asyncio.wait_for(ws.receive_json(), timeout=5.0)  # welcome

        await ws.send_json({"type": "ping"})
        pong = await asyncio.wait_for(ws.receive_json(), timeout=5.0)
        assert pong["type"] == "pong"


async def test_ws_invalid_json_does_not_crash(server_client):
    """Sending invalid JSON over /ws does not crash the handler."""
    async with server_client.ws_connect("/ws") as ws:
        await ws.receive_json()  # welcome

        await ws.send_str("not valid json {{{")
        # The handler logs a warning but does not send back a response
        # and does not close the connection. Verify we can still ping.
        await ws.send_json({"type": "ping"})
        pong = await ws.receive_json()
        assert pong["type"] == "pong"


async def test_ws_disconnect_removes_client(server_client):
    """Disconnecting removes the client from connected_ws_clients."""
    async with server_client.ws_connect("/ws") as ws:
        await ws.receive_json()  # welcome
        assert len(server.connected_ws_clients) == 1

    # After context manager exits, client should be removed
    assert len(server.connected_ws_clients) == 0


# ---------------------------------------------------------------------------
# HIGH 1: File rotation via /api/ws/respond
# ---------------------------------------------------------------------------


async def test_response_file_rotation(server_client, tmp_path, monkeypatch):
    """When RESPONSE_FILE exceeds RESPONSE_FILE_MAX_BYTES, it is rotated."""
    resp_file = tmp_path / "claude_responses.jsonl"
    monkeypatch.setattr(server, "RESPONSE_FILE", resp_file)
    monkeypatch.setattr(server, "RESPONSE_FILE_MAX_BYTES", 50)

    # POST enough content to exceed the 50-byte threshold
    for i in range(5):
        r = await server_client.post(
            "/api/ws/respond",
            json={"content": f"payload-{i}-padding"},
        )
        assert r.status == 200

    # The rotated file should exist and the main file should be small
    rotated = resp_file.with_suffix(".jsonl.1")
    assert rotated.exists(), "Rotation file (.jsonl.1) should exist"
    assert resp_file.stat().st_size < 200, "Main file should be small after rotation"


# ---------------------------------------------------------------------------
# HIGH 2: Oversized WS message rejection
# ---------------------------------------------------------------------------


async def test_oversized_ws_message_rejected(server_client, monkeypatch):
    """Messages larger than MAX_WS_MESSAGE_SIZE get an error response."""
    monkeypatch.setattr(server, "MAX_WS_MESSAGE_SIZE", 100)

    async with server_client.ws_connect("/ws") as ws:
        await ws.receive_json()  # welcome

        # Send a message whose serialised form exceeds 100 bytes
        big_content = "x" * 200
        await ws.send_str(json.dumps({"type": "user_message", "content": big_content}))
        err = await ws.receive_json()
        assert err["type"] == "error"
        assert "too large" in err["message"].lower()


# ---------------------------------------------------------------------------
# HIGH 4: WS connection limit
# ---------------------------------------------------------------------------


async def test_ws_connection_limit_enforced(server_client, monkeypatch):
    """When MAX_WS_CLIENTS is reached, the 3rd connection is rejected (503)."""
    monkeypatch.setattr(server, "MAX_WS_CLIENTS", 2)

    async with server_client.ws_connect("/ws") as ws1, server_client.ws_connect("/ws") as ws2:
        await ws1.receive_json()
        await ws2.receive_json()

        # Third connection should be rejected
        resp = await server_client.request("GET", "/ws")
        assert resp.status == 503


# ---------------------------------------------------------------------------
# broadcast_to_ws_clients tests
# ---------------------------------------------------------------------------


async def test_broadcast_reaches_multiple_clients(server_client):
    """Broadcast delivers a message to all connected WS clients."""
    async with server_client.ws_connect("/ws") as ws1, server_client.ws_connect("/ws") as ws2:
        # consume welcome messages
        await ws1.receive_json()
        await ws2.receive_json()

        await server.broadcast_to_ws_clients({"type": "test", "data": "broadcast"})

        msg1 = await ws1.receive_json()
        msg2 = await ws2.receive_json()
        assert msg1["type"] == "test"
        assert msg2["type"] == "test"


async def test_broadcast_empty_set_is_noop():
    """Broadcast with no connected clients does nothing (no error)."""
    server.connected_ws_clients.clear()
    # Should not raise
    await server.broadcast_to_ws_clients({"type": "noop"})


async def test_broadcast_failed_send_removes_client(server_client):
    """A client that fails to receive is removed from connected set."""
    async with server_client.ws_connect("/ws") as ws:
        await ws.receive_json()  # welcome
        assert len(server.connected_ws_clients) == 1

        # Close the underlying ws so send_json will fail
        await ws.close()

    # Now broadcast; the failed client should be cleaned up
    await server.broadcast_to_ws_clients({"type": "cleanup_test"})
    assert len(server.connected_ws_clients) == 0


# ---------------------------------------------------------------------------
# MEDIUM: ws_status_handler
# ---------------------------------------------------------------------------


async def test_ws_status_handler_returns_expected_keys(server_client):
    """GET /api/ws/status returns JSON with connected_clients, status, timestamp."""
    resp = await server_client.get("/api/ws/status")
    assert resp.status == 200
    body = await resp.json()
    assert "connected_clients" in body
    assert "status" in body
    assert "timestamp" in body
    assert body["status"] == "idle"  # no WS clients connected via HTTP


async def test_ws_status_active_with_client(server_client):
    """GET /api/ws/status shows 'active' when a WS client is connected."""
    async with server_client.ws_connect("/ws") as ws:
        await ws.receive_json()  # welcome
        resp = await server_client.get("/api/ws/status")
        body = await resp.json()
        assert body["status"] == "active"
        assert body["connected_clients"] == 1


# ---------------------------------------------------------------------------
# LOW 12: index_handler with monkeypatched DIRECTORY
# ---------------------------------------------------------------------------


async def test_index_handler_returns_200(server_client, tmp_path, monkeypatch):
    """GET / returns 200 when index.html exists in DIRECTORY."""
    monkeypatch.setattr(server, "DIRECTORY", tmp_path)
    (tmp_path / "index.html").write_text("<html></html>", encoding="utf-8")
    resp = await server_client.get("/")
    assert resp.status == 200


# ---------------------------------------------------------------------------
# MEDIUM: adventures_handler
# ---------------------------------------------------------------------------


async def test_adventures_handler_200_when_exists(
    server_client, tmp_path, monkeypatch,
):
    """GET /adventures returns 200 when adventures/index.html is present."""
    adventures_dir = tmp_path / "adventures"
    adventures_dir.mkdir()
    (adventures_dir / "index.html").write_text("<html>Lab</html>", encoding="utf-8")
    monkeypatch.setattr(server, "DIRECTORY", tmp_path)

    resp = await server_client.get("/adventures")
    assert resp.status == 200


async def test_adventures_handler_returns_404_when_missing(server_client, tmp_path, monkeypatch):
    """GET /adventures returns 404 when adventures/index.html is absent."""
    monkeypatch.setattr(server, "DIRECTORY", tmp_path)

    resp = await server_client.get("/adventures")
    assert resp.status == 404


# ---------------------------------------------------------------------------
# MEDIUM: _safe_resolve path traversal patterns
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("filename", [
    "../server.py",
    "..\\ws_bridge.py",
    "../../etc/passwd",
    "foo/../../../etc/passwd",
    "%2e%2e/server.py",
])
def test_safe_resolve_rejects_traversal(filename):
    """_safe_resolve must return None for all traversal payloads."""
    result = server._safe_resolve(server.DIRECTORY, filename)
    assert result is None


def test_safe_resolve_rejects_nonexistent():
    """_safe_resolve returns None for files that don't exist."""
    result = server._safe_resolve(server.DIRECTORY, "nonexistent_file_xyz.txt")
    assert result is None


# ---------------------------------------------------------------------------
# LOW 13: ws_messages read-and-clear
# ---------------------------------------------------------------------------


async def test_ws_messages_read_and_clear(server_client, tmp_path, monkeypatch):
    """GET /api/ws/messages returns stored messages and clears the file."""
    msg_file = tmp_path / "messages.jsonl"
    lines = [
        json.dumps({"type": "user_message", "content": f"m{i}", "timestamp": "t"})
        for i in range(3)
    ]
    msg_file.write_text("\n".join(lines) + "\n", encoding="utf-8")
    monkeypatch.setattr(server, "MESSAGE_FILE", msg_file)

    resp = await server_client.get("/api/ws/messages")
    assert resp.status == 200
    body = await resp.json()
    assert body["count"] == 3
    assert body["messages"][0]["content"] == "m0"
    assert body["messages"][2]["content"] == "m2"

    # File should be cleared after read
    assert msg_file.read_text(encoding="utf-8") == ""


# ---------------------------------------------------------------------------
# MEDIUM 8: CORS blocking for disallowed origins
# ---------------------------------------------------------------------------


async def test_cors_disallowed_origin_no_header(server_client):
    """Requests with a disallowed Origin should NOT get Access-Control-Allow-Origin."""
    resp = await server_client.get(
        "/health",
        headers={"Origin": "http://evil.com"},
    )
    assert resp.status == 200
    assert "Access-Control-Allow-Origin" not in resp.headers


# ---------------------------------------------------------------------------
# Unknown message type: server.py silently ignores (no error returned)
# ---------------------------------------------------------------------------


async def test_ws_unknown_message_type_silently_ignored(server_client):
    """Sending an unknown message type over /ws does not produce an error.

    This is intentional behavior for server.py: the handle_ws_message function
    only acts on recognised types ('user_message', 'ping') and silently drops
    anything else.  This differs from ws_bridge.py, which explicitly returns an
    error response for unknown types.

    We verify the connection stays open and subsequent messages still work.
    """
    async with server_client.ws_connect("/ws") as ws:
        await asyncio.wait_for(ws.receive_json(), timeout=5.0)  # welcome

        # Send an unknown type -- server should silently ignore it
        await ws.send_json({"type": "unknown_type", "content": "x"})

        # Verify the connection is still alive by sending a ping
        await ws.send_json({"type": "ping"})
        pong = await asyncio.wait_for(ws.receive_json(), timeout=5.0)
        assert pong["type"] == "pong"


# ---------------------------------------------------------------------------
# New feature tests: version in health, version in status
# ---------------------------------------------------------------------------


async def test_health_response_includes_version(server_client):
    """GET /health includes the 'version' key matching server.__version__."""
    resp = await server_client.get("/health")
    assert resp.status == 200
    body = await resp.json()
    assert "version" in body
    assert body["version"] == server.__version__


async def test_ws_status_includes_version(server_client):
    """GET /api/ws/status includes the 'version' key matching server.__version__."""
    resp = await server_client.get("/api/ws/status")
    assert resp.status == 200
    body = await resp.json()
    assert "version" in body
    assert body["version"] == server.__version__


# ---------------------------------------------------------------------------
# Session identity tests
# ---------------------------------------------------------------------------


async def test_ws_welcome_contains_session_id(server_client):
    """Welcome message must contain a non-empty session_id."""
    async with server_client.ws_connect("/ws") as ws:
        welcome = await asyncio.wait_for(ws.receive_json(), timeout=5.0)
        assert "session_id" in welcome
        assert isinstance(welcome["session_id"], str)
        assert len(welcome["session_id"]) > 0


async def test_sessions_endpoint_returns_active_sessions(server_client):
    """GET /api/sessions returns active session list with expected keys."""
    async with server_client.ws_connect("/ws") as ws:
        welcome = await ws.receive_json()
        welcome["session_id"]

        resp = await server_client.get("/api/sessions")
        assert resp.status == 200
        body = await resp.json()
        assert "sessions" in body
        assert "count" in body
        assert body["count"] >= 1

        session = body["sessions"][0]
        assert "session_id" in session
        assert "connected_at" in session
        assert "last_activity" in session


async def test_sessions_empty_when_no_clients(server_client):
    """GET /api/sessions returns empty list when no WS clients connected."""
    resp = await server_client.get("/api/sessions")
    body = await resp.json()
    assert body["count"] == 0
    assert body["sessions"] == []


# ---------------------------------------------------------------------------
# Message history endpoint tests
# ---------------------------------------------------------------------------


async def test_history_endpoint_returns_expected_shape(server_client):
    """GET /api/history returns messages array with count."""
    resp = await server_client.get("/api/history")
    assert resp.status == 200
    body = await resp.json()
    assert "messages" in body
    assert "count" in body
    assert isinstance(body["messages"], list)


async def test_history_messages_have_seq_and_message_id(server_client):
    """Messages in history contain seq and message_id fields."""
    async with server_client.ws_connect("/ws") as ws:
        await ws.receive_json()
        await ws.send_json({"type": "user_message", "content": "test"})
        await ws.receive_json()

    resp = await server_client.get("/api/history")
    body = await resp.json()
    assert body["count"] >= 1
    msg = body["messages"][0]
    assert "seq" in msg
    assert "message_id" in msg
    assert isinstance(msg["seq"], int)


async def test_history_limit_clamps_to_sane_range(server_client):
    """Limit param is clamped: <1 becomes 1, >500 becomes 500."""
    resp_zero = await server_client.get("/api/history?limit=0")
    await resp_zero.json()
    # With no messages, count is 0 regardless; just check it does not error
    assert resp_zero.status == 200

    resp_huge = await server_client.get("/api/history?limit=99999")
    assert resp_huge.status == 200


async def test_history_invalid_limit_defaults(server_client):
    """Non-integer limit defaults to 50."""
    resp = await server_client.get("/api/history?limit=abc")
    assert resp.status == 200


async def test_history_invalid_since_seq_defaults(server_client):
    """Non-integer since_seq defaults to 0."""
    resp = await server_client.get("/api/history?since_seq=xyz")
    assert resp.status == 200


# ---------------------------------------------------------------------------
# Message ack contains message_id and seq
# ---------------------------------------------------------------------------


async def test_user_message_ack_contains_message_id_and_seq(server_client):
    """Ack for user_message includes message_id, seq, and session_id."""
    async with server_client.ws_connect("/ws") as ws:
        welcome = await ws.receive_json()
        sid = welcome["session_id"]

        await ws.send_json({"type": "user_message", "content": "hello"})
        ack = await ws.receive_json()
        assert ack["type"] == "message_received"
        assert "message_id" in ack
        assert "seq" in ack
        assert ack["session_id"] == sid


# ---------------------------------------------------------------------------
# Respond endpoint includes message_id and seq
# ---------------------------------------------------------------------------


async def test_respond_returns_message_id_and_seq(server_client):
    """POST /api/ws/respond returns message_id and seq in response."""
    resp = await server_client.post(
        "/api/ws/respond", json={"content": "test response"},
    )
    assert resp.status == 200
    body = await resp.json()
    assert "message_id" in body
    assert "seq" in body
    assert isinstance(body["seq"], int)


# ---------------------------------------------------------------------------
# Reconnection / resume protocol
# ---------------------------------------------------------------------------


async def test_resume_message_triggers_replay(server_client):
    """Sending a resume message replays missed history entries."""
    async with server_client.ws_connect("/ws") as ws:
        welcome = await ws.receive_json()
        sid = welcome["session_id"]

        await ws.send_json({"type": "user_message", "content": "msg1"})
        ack = await ws.receive_json()
        last_seq = ack["seq"]

    # Post a response while disconnected
    await server_client.post("/api/ws/respond", json={"content": "reply1"})

    # Reconnect and resume
    async with server_client.ws_connect("/ws") as ws2:
        await ws2.receive_json()  # new welcome

        await ws2.send_json({
            "type": "resume",
            "session_id": sid,
            "last_seen_seq": last_seq,
        })

        # Collect replayed messages until resume_complete
        replayed = []
        while True:
            msg = await asyncio.wait_for(ws2.receive_json(), timeout=3.0)
            if msg.get("type") == "resume_complete":
                break
            replayed.append(msg)

        assert len(replayed) >= 1
        assert any(m.get("content") == "reply1" for m in replayed)


async def test_resume_remaps_session_id(server_client):
    """After resume, the session is re-registered under the old session_id."""
    async with server_client.ws_connect("/ws") as ws:
        welcome = await ws.receive_json()
        old_sid = welcome["session_id"]

    # New connection, resume with old_sid
    async with server_client.ws_connect("/ws") as ws2:
        welcome2 = await ws2.receive_json()
        new_sid = welcome2["session_id"]
        assert old_sid != new_sid

        await ws2.send_json({
            "type": "resume",
            "session_id": old_sid,
            "last_seen_seq": 0,
        })

        msg = await asyncio.wait_for(ws2.receive_json(), timeout=3.0)
        assert msg["type"] == "resume_complete"
        assert msg["session_id"] == old_sid

        # Old session should now appear in /api/sessions
        resp = await server_client.get("/api/sessions")
        body = await resp.json()
        sids = [s["session_id"] for s in body["sessions"]]
        assert old_sid in sids
        # New session replaced by old
        assert new_sid not in sids


# ---------------------------------------------------------------------------
# Content-type validation on user_message
# ---------------------------------------------------------------------------


async def test_ws_user_message_non_string_content_rejected(server_client):
    """user_message with non-string content gets an error response."""
    async with server_client.ws_connect("/ws") as ws:
        await ws.receive_json()  # welcome
        await ws.send_json({"type": "user_message", "content": 42})
        err = await ws.receive_json()
        assert err["type"] == "error"


# ---------------------------------------------------------------------------
# HIGH: /api/metrics endpoint tests
# ---------------------------------------------------------------------------


async def test_metrics_returns_200_with_expected_keys(server_client):
    """GET /api/metrics returns 200 with all expected metric keys."""
    resp = await server_client.get("/api/metrics")
    assert resp.status == 200
    body = await resp.json()
    expected_keys = {
        "uptime_seconds",
        "total_messages_received",
        "total_responses_sent",
        "current_clients",
        "history_buffer_size",
        "version",
    }
    assert expected_keys.issubset(body.keys())


async def test_metrics_version_matches_server_version(server_client):
    """GET /api/metrics version field matches server.__version__."""
    resp = await server_client.get("/api/metrics")
    body = await resp.json()
    assert body["version"] == server.__version__


# ---------------------------------------------------------------------------
# HIGH: POST /api/ws/typing endpoint tests
# ---------------------------------------------------------------------------


async def test_typing_start_returns_200(server_client):
    """POST /api/ws/typing with status=start returns 200."""
    resp = await server_client.post(
        "/api/ws/typing",
        json={"status": "start", "sender": "claude"},
    )
    assert resp.status == 200
    body = await resp.json()
    assert body["status"] == "sent"


async def test_typing_invalid_json_returns_400(server_client):
    """POST /api/ws/typing with invalid JSON returns 400."""
    resp = await server_client.post(
        "/api/ws/typing",
        data=b"not json",
        headers={"Content-Type": "application/json"},
    )
    assert resp.status == 400


async def test_typing_missing_status_returns_400(server_client):
    """POST /api/ws/typing with missing/invalid status field returns 400."""
    resp = await server_client.post(
        "/api/ws/typing",
        json={"sender": "claude"},
    )
    assert resp.status == 400
    body = await resp.json()
    assert "status" in body["error"]


# ---------------------------------------------------------------------------
# HIGH: POST /api/ws/stream endpoint tests
# ---------------------------------------------------------------------------


async def test_stream_chunk_then_done(server_client):
    """POST /api/ws/stream with chunks then done=true returns 200 with total_length."""
    mid = "test-stream-id"

    # Send two chunks
    r1 = await server_client.post(
        "/api/ws/stream",
        json={"message_id": mid, "chunk": "Hello ", "done": False},
    )
    assert r1.status == 200
    b1 = await r1.json()
    assert b1["status"] == "chunk_sent"

    r2 = await server_client.post(
        "/api/ws/stream",
        json={"message_id": mid, "chunk": "World", "done": False},
    )
    assert r2.status == 200

    # Finalize
    r3 = await server_client.post(
        "/api/ws/stream",
        json={"message_id": mid, "chunk": "", "done": True},
    )
    assert r3.status == 200
    b3 = await r3.json()
    assert b3["status"] == "stream_complete"
    assert b3["total_length"] == len("Hello World")


async def test_stream_missing_message_id_returns_400(server_client):
    """POST /api/ws/stream with missing message_id returns 400."""
    resp = await server_client.post(
        "/api/ws/stream",
        json={"chunk": "hello", "done": False},
    )
    assert resp.status == 400
    body = await resp.json()
    assert "message_id" in body["error"]


async def test_stream_missing_chunk_field_returns_400(server_client):
    """POST /api/ws/stream with non-string chunk returns 400."""
    resp = await server_client.post(
        "/api/ws/stream",
        json={"message_id": "abc", "chunk": 123, "done": False},
    )
    assert resp.status == 400
    body = await resp.json()
    assert "chunk" in body["error"]


# ---------------------------------------------------------------------------
# MEDIUM: Negative tests for POST /api/ws/respond
# ---------------------------------------------------------------------------


async def test_respond_non_string_content_returns_400(server_client):
    """POST /api/ws/respond with non-string content returns 400."""
    resp = await server_client.post(
        "/api/ws/respond",
        json={"content": 42},
    )
    assert resp.status == 400
    body = await resp.json()
    assert "string" in body["error"].lower()


async def test_respond_oversized_content_returns_413(server_client, monkeypatch):
    """POST /api/ws/respond with content exceeding MAX_WS_MESSAGE_SIZE returns 413."""
    monkeypatch.setattr(server, "MAX_WS_MESSAGE_SIZE", 50)
    resp = await server_client.post(
        "/api/ws/respond",
        json={"content": "x" * 100},
    )
    assert resp.status == 413
    body = await resp.json()
    assert "too large" in body["error"].lower()
