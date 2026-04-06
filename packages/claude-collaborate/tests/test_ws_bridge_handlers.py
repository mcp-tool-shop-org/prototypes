"""Tests for ws_bridge.py HTTP endpoints -- health, post_response, get_messages."""

from __future__ import annotations

# =============================================================================
# Health check
# =============================================================================


async def test_health_check_returns_200(bridge_client):
    """GET /health returns 200 with JSON containing 'status'."""
    resp = await bridge_client.get("/health")
    assert resp.status == 200
    body = await resp.json()
    assert "status" in body


# =============================================================================
# POST /api/respond
# =============================================================================


async def test_post_response_valid_json(bridge_client):
    """POST /api/respond with valid content returns 200."""
    resp = await bridge_client.post(
        "/api/respond",
        json={"content": "Test response from Claude"},
    )
    assert resp.status == 200
    body = await resp.json()
    assert body.get("status") == "sent"


async def test_post_response_invalid_json(bridge_client):
    """POST /api/respond with non-JSON body returns 500."""
    resp = await bridge_client.post(
        "/api/respond",
        data=b"not json",
        headers={"Content-Type": "application/json"},
    )
    assert resp.status == 500


# =============================================================================
# GET /api/messages
# =============================================================================


async def test_get_messages_returns_array(bridge_client):
    """GET /api/messages returns 200 with messages array."""
    resp = await bridge_client.get("/api/messages")
    assert resp.status == 200
    body = await resp.json()
    assert isinstance(body.get("messages"), list)
    assert "count" in body
