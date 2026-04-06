"""End-to-end integration tests for claude-collaborate.

Tests full flows spanning both WS and HTTP endpoints in server.py:
  - WS connect -> send message -> poll via HTTP -> post response -> verify WS receives it
  - Session identity lifecycle
  - Message history (non-destructive)
  - Reconnection with replay
"""

from __future__ import annotations

import asyncio

# ---------------------------------------------------------------------------
# E2E: Full message round-trip
# ---------------------------------------------------------------------------


async def test_full_roundtrip_ws_send_http_poll_http_respond_ws_receive(server_client):
    """Full flow: WS user_message -> HTTP poll -> HTTP respond -> WS receives response."""
    async with server_client.ws_connect("/ws") as ws:
        welcome = await asyncio.wait_for(ws.receive_json(), timeout=5.0)
        assert welcome["type"] == "connected"

        # 1. Send user message over WS
        await ws.send_json({"type": "user_message", "content": "Hello Claude"})
        ack = await asyncio.wait_for(ws.receive_json(), timeout=5.0)
        assert ack["type"] == "message_received"
        assert "message_id" in ack
        assert "seq" in ack

        # 2. Poll pending messages via HTTP (simulating Claude Code)
        poll_resp = await server_client.get("/api/ws/messages")
        assert poll_resp.status == 200
        poll_body = await poll_resp.json()
        assert poll_body["count"] == 1
        assert poll_body["messages"][0]["content"] == "Hello Claude"

        # 3. Post response via HTTP (simulating Claude Code reply)
        respond_resp = await server_client.post(
            "/api/ws/respond",
            json={"content": "Hi there, human!"},
        )
        assert respond_resp.status == 200
        respond_body = await respond_resp.json()
        assert respond_body["status"] == "sent"
        assert "message_id" in respond_body
        assert "seq" in respond_body

        # 4. Verify WS client receives the response broadcast
        ws_msg = await asyncio.wait_for(ws.receive_json(), timeout=5.0)
        assert ws_msg["type"] == "claude_response"
        assert ws_msg["content"] == "Hi there, human!"
        assert "message_id" in ws_msg
        assert "seq" in ws_msg


# ---------------------------------------------------------------------------
# E2E: Session identity
# ---------------------------------------------------------------------------


async def test_session_identity_on_connect(server_client):
    """WS welcome message contains a session_id, and /api/sessions lists it."""
    async with server_client.ws_connect("/ws") as ws:
        welcome = await asyncio.wait_for(ws.receive_json(), timeout=5.0)
        assert welcome["type"] == "connected"
        assert "session_id" in welcome
        session_id = welcome["session_id"]
        assert isinstance(session_id, str)
        assert len(session_id) > 0

        # Verify /api/sessions lists this session
        resp = await server_client.get("/api/sessions")
        assert resp.status == 200
        body = await resp.json()
        assert body["count"] >= 1
        session_ids = [s["session_id"] for s in body["sessions"]]
        assert session_id in session_ids


async def test_session_removed_on_disconnect(server_client):
    """After WS disconnect, the session is removed from /api/sessions."""
    async with server_client.ws_connect("/ws") as ws:
        welcome = await ws.receive_json()
        session_id = welcome["session_id"]

    # After disconnect
    resp = await server_client.get("/api/sessions")
    body = await resp.json()
    session_ids = [s["session_id"] for s in body["sessions"]]
    assert session_id not in session_ids


async def test_multiple_sessions_tracked(server_client):
    """Multiple WS connections each get distinct session_ids."""
    async with server_client.ws_connect("/ws") as ws1, server_client.ws_connect("/ws") as ws2:
        w1 = await ws1.receive_json()
        w2 = await ws2.receive_json()
        assert w1["session_id"] != w2["session_id"]

        resp = await server_client.get("/api/sessions")
        body = await resp.json()
        assert body["count"] == 2


# ---------------------------------------------------------------------------
# E2E: Message history (non-destructive)
# ---------------------------------------------------------------------------


async def test_history_returns_messages_non_destructively(server_client):
    """GET /api/history returns messages without clearing them."""
    async with server_client.ws_connect("/ws") as ws:
        await ws.receive_json()  # welcome

        # Send a few messages
        for i in range(3):
            await ws.send_json({"type": "user_message", "content": f"msg-{i}"})
            await ws.receive_json()  # ack

        # First read
        resp1 = await server_client.get("/api/history")
        body1 = await resp1.json()
        assert body1["count"] == 3

        # Second read should still return same messages (non-destructive)
        resp2 = await server_client.get("/api/history")
        body2 = await resp2.json()
        assert body2["count"] == 3
        assert body2["messages"][0]["content"] == "msg-0"


async def test_history_includes_responses(server_client):
    """History buffer includes both user messages and claude responses."""
    async with server_client.ws_connect("/ws") as ws:
        await ws.receive_json()  # welcome

        await ws.send_json({"type": "user_message", "content": "question"})
        await ws.receive_json()  # ack

        await server_client.post("/api/ws/respond", json={"content": "answer"})
        await ws.receive_json()  # broadcast

        resp = await server_client.get("/api/history")
        body = await resp.json()
        assert body["count"] == 2
        types = [m["type"] for m in body["messages"]]
        assert "user_message" in types
        assert "claude_response" in types


async def test_history_since_seq_filter(server_client):
    """GET /api/history?since_seq=N returns only messages with seq > N."""
    async with server_client.ws_connect("/ws") as ws:
        await ws.receive_json()  # welcome

        seqs = []
        for i in range(5):
            await ws.send_json({"type": "user_message", "content": f"m-{i}"})
            ack = await ws.receive_json()
            seqs.append(ack["seq"])

        # Ask for messages since the 3rd one
        resp = await server_client.get(f"/api/history?since_seq={seqs[2]}")
        body = await resp.json()
        assert body["count"] == 2
        for m in body["messages"]:
            assert m["seq"] > seqs[2]


async def test_history_limit_param(server_client):
    """GET /api/history?limit=2 returns at most 2 messages."""
    async with server_client.ws_connect("/ws") as ws:
        await ws.receive_json()  # welcome

        for i in range(5):
            await ws.send_json({"type": "user_message", "content": f"m-{i}"})
            await ws.receive_json()  # ack

        resp = await server_client.get("/api/history?limit=2")
        body = await resp.json()
        assert body["count"] == 2
        # Should return the last 2 (most recent)
        assert body["messages"][-1]["content"] == "m-4"


# ---------------------------------------------------------------------------
# E2E: Reconnection with replay
# ---------------------------------------------------------------------------


async def test_reconnection_replays_missed_messages(server_client):
    """Reconnect with resume replays messages missed during disconnection."""
    # First connection: send messages, note the session_id and seq
    async with server_client.ws_connect("/ws") as ws1:
        welcome = await ws1.receive_json()
        session_id = welcome["session_id"]

        await ws1.send_json({"type": "user_message", "content": "before-disconnect-1"})
        ack1 = await ws1.receive_json()
        last_seen = ack1["seq"]

    # While disconnected, post a response via HTTP (goes into history)
    await server_client.post("/api/ws/respond", json={"content": "missed-response"})

    # Second connection: resume with old session_id and last_seen_seq
    async with server_client.ws_connect("/ws") as ws2:
        welcome2 = await ws2.receive_json()  # new welcome
        welcome2["session_id"]

        # Send resume message
        await ws2.send_json({
            "type": "resume",
            "session_id": session_id,
            "last_seen_seq": last_seen,
        })

        # Should receive replayed messages (those with seq > last_seen)
        replayed_msgs = []
        while True:
            try:
                msg = await asyncio.wait_for(ws2.receive_json(), timeout=2.0)
                if msg.get("type") == "resume_complete":
                    assert msg["session_id"] == session_id
                    assert msg["replayed"] >= 1
                    break
                replayed_msgs.append(msg)
            except asyncio.TimeoutError:
                break

        # At least the "missed-response" should have been replayed
        assert len(replayed_msgs) >= 1
        contents = [m.get("content", "") for m in replayed_msgs]
        assert "missed-response" in contents


async def test_resume_with_zero_last_seen_replays_all(server_client):
    """Resume with last_seen_seq=0 replays entire history buffer."""
    async with server_client.ws_connect("/ws") as ws:
        welcome = await ws.receive_json()
        session_id = welcome["session_id"]

        for i in range(3):
            await ws.send_json({"type": "user_message", "content": f"hist-{i}"})
            await ws.receive_json()  # ack

    # Reconnect and resume from seq 0
    async with server_client.ws_connect("/ws") as ws2:
        await ws2.receive_json()  # welcome

        await ws2.send_json({
            "type": "resume",
            "session_id": session_id,
            "last_seen_seq": 0,
        })

        replayed = []
        while True:
            try:
                msg = await asyncio.wait_for(ws2.receive_json(), timeout=2.0)
                if msg.get("type") == "resume_complete":
                    assert msg["replayed"] == 3
                    break
                replayed.append(msg)
            except asyncio.TimeoutError:
                break

        assert len(replayed) == 3


# ---------------------------------------------------------------------------
# E2E: Messages read-and-clear does not affect history
# ---------------------------------------------------------------------------


async def test_messages_poll_clears_file_but_not_history(server_client):
    """GET /api/ws/messages clears the file, but /api/history still has them."""
    async with server_client.ws_connect("/ws") as ws:
        await ws.receive_json()

        await ws.send_json({"type": "user_message", "content": "persistent"})
        await ws.receive_json()

    # Poll messages (destructive read)
    poll = await server_client.get("/api/ws/messages")
    poll_body = await poll.json()
    assert poll_body["count"] == 1

    # Second poll should be empty (file cleared)
    poll2 = await server_client.get("/api/ws/messages")
    poll2_body = await poll2.json()
    assert poll2_body["count"] == 0

    # But history should still have it
    hist = await server_client.get("/api/history")
    hist_body = await hist.json()
    assert hist_body["count"] == 1
    assert hist_body["messages"][0]["content"] == "persistent"
