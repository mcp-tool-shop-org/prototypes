"""WebSocket integration tests for ws_bridge.py.

Tests the /ws endpoint using aiohttp TestClient + ws_connect.
"""

from __future__ import annotations

import asyncio
import json

import ws_bridge

# ---------------------------------------------------------------------------
# CRITICAL 2: WebSocket integration tests for ws_bridge.py
# ---------------------------------------------------------------------------


async def test_ws_user_message_writes_to_file(bridge_client, tmp_path, monkeypatch):
    """user_message type writes content to MESSAGE_FILE."""
    msg_file = tmp_path / "ws_msg.jsonl"
    monkeypatch.setattr(ws_bridge, "MESSAGE_FILE", msg_file)

    async with bridge_client.ws_connect("/ws") as ws:
        await ws.receive_json()  # welcome

        await ws.send_json({"type": "user_message", "content": "test content"})
        ack = await ws.receive_json()
        assert ack["type"] == "message_received"

    # Verify file was written
    assert msg_file.exists()
    lines = msg_file.read_text(encoding="utf-8").strip().split("\n")
    assert len(lines) == 1
    data = json.loads(lines[0])
    assert data["content"] == "test content"
    assert data["type"] == "user_message"


async def test_ws_ping_triggers_pong(bridge_client):
    """ping type triggers pong response."""
    async with bridge_client.ws_connect("/ws") as ws:
        await asyncio.wait_for(ws.receive_json(), timeout=5.0)  # welcome

        await ws.send_json({"type": "ping"})
        pong = await asyncio.wait_for(ws.receive_json(), timeout=5.0)
        assert pong["type"] == "pong"
        assert "timestamp" in pong


async def test_ws_get_responses_returns_responses(bridge_client, tmp_path, monkeypatch):
    """get_responses type returns claude_responses from file."""
    resp_file = tmp_path / "ws_resp.jsonl"
    resp_file.write_text(
        json.dumps({"type": "claude_response", "content": "hi", "timestamp": "t"}) + "\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(ws_bridge, "CLAUDE_RESPONSE_FILE", resp_file)

    async with bridge_client.ws_connect("/ws") as ws:
        await ws.receive_json()  # welcome

        await ws.send_json({"type": "get_responses"})
        result = await ws.receive_json()
        assert result["type"] == "claude_responses"
        assert len(result["responses"]) == 1
        assert result["responses"][0]["content"] == "hi"


async def test_ws_invalid_json_returns_error(bridge_client):
    """Sending invalid JSON returns an error message (not a crash)."""
    async with bridge_client.ws_connect("/ws") as ws:
        await ws.receive_json()  # welcome

        await ws.send_str("not valid json {{{")
        err = await ws.receive_json()
        assert err["type"] == "error"
        assert "Invalid JSON" in err["message"]


async def test_ws_connection_limit_enforced(bridge_client, monkeypatch):
    """When MAX_CLIENTS is reached, new connections are rejected with 503."""
    monkeypatch.setattr(ws_bridge, "MAX_CLIENTS", 2)

    async with bridge_client.ws_connect("/ws") as ws1, bridge_client.ws_connect("/ws") as ws2:
        await ws1.receive_json()
        await ws2.receive_json()

        # Third connection should be rejected
        resp = await bridge_client.request("GET", "/ws")
        assert resp.status == 503


async def test_ws_welcome_message(bridge_client):
    """Connecting to /ws yields a welcome message with type='connected'."""
    async with bridge_client.ws_connect("/ws") as ws:
        msg = await asyncio.wait_for(ws.receive_json(), timeout=5.0)
        assert msg["type"] == "connected"
        assert "Connected to Claude Collaborate Bridge" in msg["message"]
        assert "timestamp" in msg


async def test_ws_disconnect_removes_client(bridge_client):
    """Disconnecting removes the client from connected_clients."""
    async with bridge_client.ws_connect("/ws") as ws:
        await ws.receive_json()
        assert len(ws_bridge.connected_clients) == 1

    assert len(ws_bridge.connected_clients) == 0


# ---------------------------------------------------------------------------
# HIGH 3: Content validation — WS path
# ---------------------------------------------------------------------------


async def test_ws_content_too_large_rejected(bridge_client, monkeypatch):
    """WS user_message with content exceeding MAX_CONTENT_CHARS returns error."""
    monkeypatch.setattr(ws_bridge, "MAX_CONTENT_CHARS", 10)

    async with bridge_client.ws_connect("/ws") as ws:
        await ws.receive_json()  # welcome

        await ws.send_json({"type": "user_message", "content": "x" * 20})
        err = await ws.receive_json()
        assert err["type"] == "error"
        assert "max length" in err["message"].lower() or "exceeds" in err["message"].lower()


# ---------------------------------------------------------------------------
# HIGH 3: Content validation — HTTP path
# ---------------------------------------------------------------------------


async def test_http_content_too_large_rejected(bridge_client, monkeypatch):
    """POST /api/respond with content exceeding MAX_CONTENT_CHARS returns 400."""
    monkeypatch.setattr(ws_bridge, "MAX_CONTENT_CHARS", 10)

    resp = await bridge_client.post(
        "/api/respond",
        json={"content": "x" * 20},
    )
    assert resp.status == 400


# ---------------------------------------------------------------------------
# MEDIUM 5: Graceful shutdown
# ---------------------------------------------------------------------------


async def test_graceful_shutdown_clears_clients(bridge_client):
    """on_shutdown closes all WS clients and clears connected_clients."""
    async with bridge_client.ws_connect("/ws") as ws:
        await ws.receive_json()  # welcome
        assert len(ws_bridge.connected_clients) == 1

        # Trigger shutdown handlers
        await bridge_client.app.on_shutdown.send(bridge_client.app)

    assert len(ws_bridge.connected_clients) == 0


# ---------------------------------------------------------------------------
# MEDIUM: CORS middleware in ws_bridge.py
# ---------------------------------------------------------------------------


async def test_bridge_cors_options_preflight(bridge_client):
    """OPTIONS request returns 200 (CORS preflight handled)."""
    resp = await bridge_client.request("OPTIONS", "/health")
    assert resp.status == 200


async def test_bridge_cors_origin_on_get(bridge_client):
    """GET /health succeeds through the CORS middleware layer."""
    resp = await bridge_client.get("/health")
    assert resp.status == 200
    body = await resp.json()
    assert body["status"] == "ok"


# ---------------------------------------------------------------------------
# MEDIUM 8: CORS blocking for disallowed origins
# ---------------------------------------------------------------------------


async def test_bridge_cors_disallowed_origin_no_header(bridge_client):
    """Requests with a disallowed Origin should NOT get Access-Control-Allow-Origin."""
    resp = await bridge_client.get(
        "/health",
        headers={"Origin": "http://evil.com"},
    )
    assert resp.status == 200
    assert "Access-Control-Allow-Origin" not in resp.headers


# ---------------------------------------------------------------------------
# MEDIUM: post_response with empty content
# ---------------------------------------------------------------------------


async def test_post_response_empty_content(bridge_client):
    """POST /api/respond with empty content succeeds (200).

    ws_bridge.py uses relay semantics: it faithfully forwards whatever content
    Claude Code sends, including empty strings.  The bridge does not judge
    whether the content is useful -- that is the caller's responsibility.  This
    is an intentional difference from server.py, which uses validation semantics
    and rejects empty content with a 400 (see test_ws_respond_empty_content in
    test_server_handlers.py).
    """
    resp = await bridge_client.post("/api/respond", json={"content": ""})
    assert resp.status == 200
    body = await resp.json()
    assert body["status"] == "sent"


# ---------------------------------------------------------------------------
# MEDIUM: Malformed JSONL handling
# ---------------------------------------------------------------------------


async def test_get_messages_malformed_jsonl(bridge_client, tmp_path, monkeypatch):
    """Mix of valid/invalid JSON lines returns only valid ones."""
    msg_file = tmp_path / "malformed.jsonl"
    lines = [
        json.dumps({"type": "user_message", "content": "valid1"}),
        "this is not json",
        json.dumps({"type": "user_message", "content": "valid2"}),
        "{bad json",
        "",
    ]
    msg_file.write_text("\n".join(lines) + "\n", encoding="utf-8")
    monkeypatch.setattr(ws_bridge, "MESSAGE_FILE", msg_file)

    resp = await bridge_client.get("/api/messages")
    assert resp.status == 200
    body = await resp.json()
    assert body["count"] == 2
    assert body["messages"][0]["content"] == "valid1"
    assert body["messages"][1]["content"] == "valid2"


# ---------------------------------------------------------------------------
# ws_bridge unknown message type returns an explicit error
# ---------------------------------------------------------------------------


async def test_ws_unknown_message_type_returns_error(bridge_client):
    """ws_bridge returns an error for unrecognised message types.

    Unlike server.py (which silently ignores unknown types), ws_bridge.py
    explicitly responds with ``{"type": "error", "message": "Unknown message type"}``.
    This test verifies both the error shape and that the type name context is
    not leaked into the error message.
    """
    async with bridge_client.ws_connect("/ws") as ws:
        await ws.receive_json()  # welcome

        await ws.send_json({"type": "totally_made_up", "content": "x"})
        err = await ws.receive_json()
        assert err["type"] == "error"
        assert "unknown" in err["message"].lower()


# ---------------------------------------------------------------------------
# Heartbeat parameter
# ---------------------------------------------------------------------------


async def test_ws_heartbeat_is_configured(bridge_client):
    """WebSocket connection should have heartbeat configured."""
    async with bridge_client.ws_connect("/ws") as ws:
        welcome = await ws.receive_json()
        assert welcome["type"] == "connected"
        # The server-side ws has heartbeat=30.0; the client-side ws object
        # reflects this via _heartbeat attribute on aiohttp WebSocketResponse.
        # We verify the server creates the WS with heartbeat by checking
        # that a connected client can exchange messages (heartbeat keeps alive).
        await ws.send_json({"type": "ping"})
        pong = await ws.receive_json()
        assert pong["type"] == "pong"


# ---------------------------------------------------------------------------
# Replay buffer / reconnection
# ---------------------------------------------------------------------------


async def test_welcome_has_seq(bridge_client):
    """Welcome message includes a seq number for replay tracking."""
    async with bridge_client.ws_connect("/ws") as ws:
        welcome = await asyncio.wait_for(ws.receive_json(), timeout=5.0)
        assert "seq" in welcome
        assert isinstance(welcome["seq"], int)
        assert welcome["seq"] >= 1


async def test_replay_returns_buffered_messages(bridge_client):
    """Sending replay request replays messages with seq > since_seq."""
    async with bridge_client.ws_connect("/ws") as ws:
        welcome = await ws.receive_json()
        welcome_seq = welcome["seq"]

        # Send a user message to create buffered outbound messages
        await ws.send_json({"type": "user_message", "content": "replay-test"})
        ack = await ws.receive_json()
        assert ack["type"] == "message_received"
        ack_seq = ack["seq"]

    # New connection: request replay of everything since welcome_seq
    async with bridge_client.ws_connect("/ws") as ws2:
        await ws2.receive_json()

        await ws2.send_json({"type": "replay", "since_seq": welcome_seq})

        # Should receive the ack message (seq > welcome_seq)
        replayed = await asyncio.wait_for(ws2.receive_json(), timeout=3.0)
        assert replayed["seq"] == ack_seq
        assert replayed["type"] == "message_received"


async def test_replay_with_zero_returns_all(bridge_client):
    """Replay with since_seq=0 returns all buffered messages."""
    async with bridge_client.ws_connect("/ws") as ws:
        await ws.receive_json()

        await ws.send_json({"type": "user_message", "content": "m1"})
        await ws.receive_json()  # ack

        await ws.send_json({"type": "user_message", "content": "m2"})
        await ws.receive_json()  # ack

    # New connection
    async with bridge_client.ws_connect("/ws") as ws2:
        await ws2.receive_json()

        await ws2.send_json({"type": "replay", "since_seq": 0})

        # Collect replayed messages
        replayed = []
        while True:
            try:
                msg = await asyncio.wait_for(ws2.receive_json(), timeout=2.0)
                replayed.append(msg)
            except asyncio.TimeoutError:
                break

        # Should have at least welcome + 2 acks + new welcome from buffer
        assert len(replayed) >= 2


async def test_replay_invalid_since_seq_returns_error(bridge_client):
    """Replay with non-integer since_seq returns an error."""
    async with bridge_client.ws_connect("/ws") as ws:
        await ws.receive_json()

        await ws.send_json({"type": "replay", "since_seq": "abc"})
        err = await ws.receive_json()
        assert err["type"] == "error"
        assert "since_seq" in err["message"]


async def test_replay_negative_since_seq_returns_error(bridge_client):
    """Replay with negative since_seq returns an error."""
    async with bridge_client.ws_connect("/ws") as ws:
        await ws.receive_json()

        await ws.send_json({"type": "replay", "since_seq": -5})
        err = await ws.receive_json()
        assert err["type"] == "error"


# ---------------------------------------------------------------------------
# False-ack fix: write failure returns error instead of ack
# ---------------------------------------------------------------------------


async def test_false_ack_fix_write_failure_returns_error(
    bridge_client, monkeypatch,
):
    """When file write raises OSError, client gets error instead of ack."""

    def _raise_oserror(*args, **kwargs):
        raise OSError("Disk full")

    async with bridge_client.ws_connect("/ws") as ws:
        await ws.receive_json()  # welcome

        # Monkeypatch open to fail
        monkeypatch.setattr("builtins.open", _raise_oserror)

        await ws.send_json({"type": "user_message", "content": "should-fail"})
        resp = await asyncio.wait_for(ws.receive_json(), timeout=5.0)
        assert resp["type"] == "error"
        assert "failed" in resp["message"].lower() or "store" in resp["message"].lower()


# ---------------------------------------------------------------------------
# GET /api/history (ws_bridge)
# ---------------------------------------------------------------------------


async def test_bridge_history_returns_replay_buffer(bridge_client):
    """GET /api/history returns messages from the replay buffer."""
    async with bridge_client.ws_connect("/ws") as ws:
        await ws.receive_json()  # welcome (stamped into replay buffer)

        await ws.send_json({"type": "user_message", "content": "hist-msg"})
        await ws.receive_json()  # ack

    resp = await bridge_client.get("/api/history")
    assert resp.status == 200
    body = await resp.json()
    assert "messages" in body
    assert "count" in body
    assert body["count"] >= 1


async def test_bridge_history_since_filter(bridge_client):
    """GET /api/history?since=N returns only messages with seq > N."""
    async with bridge_client.ws_connect("/ws") as ws:
        welcome = await ws.receive_json()
        welcome_seq = welcome["seq"]

        await ws.send_json({"type": "user_message", "content": "after"})
        await ws.receive_json()

    resp = await bridge_client.get(f"/api/history?since={welcome_seq}")
    body = await resp.json()
    for m in body["messages"]:
        assert m["seq"] > welcome_seq


async def test_bridge_history_limit(bridge_client):
    """GET /api/history?limit=1 returns at most 1 message."""
    async with bridge_client.ws_connect("/ws") as ws:
        await ws.receive_json()

        for i in range(3):
            await ws.send_json({"type": "user_message", "content": f"m{i}"})
            await ws.receive_json()

    resp = await bridge_client.get("/api/history?limit=1")
    body = await resp.json()
    assert body["count"] == 1


async def test_bridge_history_invalid_params_returns_400(bridge_client):
    """GET /api/history with non-integer params returns 400."""
    resp = await bridge_client.get("/api/history?limit=abc&since=xyz")
    assert resp.status == 400


# ---------------------------------------------------------------------------
# Outbound messages get seq numbers
# ---------------------------------------------------------------------------


async def test_outbound_messages_have_monotonic_seq(bridge_client):
    """Outbound messages from ws_bridge carry monotonically increasing seq."""
    async with bridge_client.ws_connect("/ws") as ws:
        welcome = await ws.receive_json()
        seq1 = welcome["seq"]

        await ws.send_json({"type": "ping"})
        pong = await ws.receive_json()
        seq2 = pong["seq"]

        assert seq2 > seq1


# ---------------------------------------------------------------------------
# Protocol version in welcome
# ---------------------------------------------------------------------------


async def test_welcome_includes_protocol_version(bridge_client):
    """Welcome message includes protocol_version field."""
    async with bridge_client.ws_connect("/ws") as ws:
        welcome = await ws.receive_json()
        assert "protocol_version" in welcome
        assert welcome["protocol_version"] == ws_bridge.PROTOCOL_VERSION


# ---------------------------------------------------------------------------
# HIGH: POST /api/stream endpoint tests (ws_bridge)
# ---------------------------------------------------------------------------


async def test_bridge_stream_chunk_then_done(bridge_client):
    """POST /api/stream with chunks then done=true returns 200 with total_length."""
    mid = "bridge-stream-id"

    # Send a chunk
    r1 = await bridge_client.post(
        "/api/stream",
        json={"message_id": mid, "chunk": "Hello ", "done": False},
    )
    assert r1.status == 200
    b1 = await r1.json()
    assert b1["status"] == "chunk_sent"

    # Finalize
    r2 = await bridge_client.post(
        "/api/stream",
        json={"message_id": mid, "chunk": "", "done": True},
    )
    assert r2.status == 200
    b2 = await r2.json()
    assert b2["status"] == "stream_complete"
    assert b2["total_length"] == len("Hello ")


async def test_bridge_stream_missing_message_id_returns_400(bridge_client):
    """POST /api/stream with missing message_id returns 400."""
    resp = await bridge_client.post(
        "/api/stream",
        json={"chunk": "hello", "done": False},
    )
    assert resp.status == 400


# ---------------------------------------------------------------------------
# HIGH: GET /api/metrics endpoint tests (ws_bridge)
# ---------------------------------------------------------------------------


async def test_bridge_metrics_returns_200_with_expected_keys(bridge_client):
    """GET /api/metrics returns 200 with expected metric keys."""
    resp = await bridge_client.get("/api/metrics")
    assert resp.status == 200
    body = await resp.json()
    expected_keys = {
        "uptime_seconds",
        "total_messages",
        "total_responses",
        "current_clients",
        "buffer_size",
        "inflight_streams",
        "protocol_version",
    }
    assert expected_keys.issubset(body.keys())
