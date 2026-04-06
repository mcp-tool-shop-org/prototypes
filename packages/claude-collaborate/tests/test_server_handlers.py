"""Tests for server.py HTTP handlers -- traversal, health, CORS, API endpoints."""

from __future__ import annotations

# =============================================================================
# Directory traversal prevention
# =============================================================================


async def test_static_handler_blocks_traversal(server_client):
    """Traversal attempts must not leak files outside DIRECTORY."""
    for path in ["../etc/passwd", "..\\server.py", "..%2Fetc%2Fpasswd", "....//etc/passwd"]:
        resp = await server_client.get(f"/{path}")
        assert resp.status in (403, 404)


async def test_static_handler_404_for_nonexistent(server_client):
    """Requesting a file that does not exist returns 404."""
    resp = await server_client.get("/this_file_does_not_exist_12345.txt")
    assert resp.status == 404


# =============================================================================
# Health endpoint
# =============================================================================


async def test_health_returns_200_with_status(server_client):
    """GET /health returns 200 and JSON with 'status' key."""
    resp = await server_client.get("/health")
    assert resp.status == 200
    body = await resp.json()
    assert "status" in body


# =============================================================================
# CORS middleware (MEDIUM 9: send Origin header, assert exact match)
# =============================================================================


async def test_cors_headers_present(server_client):
    """Responses include CORS headers when a valid Origin is sent."""
    resp = await server_client.get(
        "/health",
        headers={"Origin": "http://localhost:8877"},
    )
    assert "Access-Control-Allow-Origin" in resp.headers
    assert resp.headers["Access-Control-Allow-Origin"] == "http://localhost:8877"
    assert "Access-Control-Allow-Methods" in resp.headers
    assert "Access-Control-Allow-Headers" in resp.headers


async def test_cors_options_preflight(server_client):
    """OPTIONS requests return CORS headers."""
    resp = await server_client.options("/health")
    assert resp.status == 200
    assert "Access-Control-Allow-Methods" in resp.headers


# =============================================================================
# /api/ws/respond
# =============================================================================


async def test_ws_respond_valid_json(server_client):
    """POST /api/ws/respond with content returns 200."""
    resp = await server_client.post(
        "/api/ws/respond",
        json={"content": "Hello from test"},
    )
    assert resp.status == 200
    body = await resp.json()
    assert body.get("status") == "sent"


async def test_ws_respond_empty_content(server_client):
    """POST /api/ws/respond with empty content returns 400.

    server.py uses validation semantics: empty content is rejected because a
    response with no content is meaningless to the end user.  This is an
    intentional difference from ws_bridge.py, which uses relay semantics and
    accepts empty content (see test_post_response_empty_content in
    test_ws_bridge_ws.py).
    """
    resp = await server_client.post(
        "/api/ws/respond",
        json={"content": ""},
    )
    assert resp.status == 400


async def test_ws_respond_invalid_body(server_client):
    """POST /api/ws/respond with non-JSON body returns 400 or 500."""
    resp = await server_client.post(
        "/api/ws/respond",
        data=b"not json",
        headers={"Content-Type": "application/json"},
    )
    assert resp.status in (400, 500)


# =============================================================================
# /api/ws/messages
# =============================================================================


async def test_ws_messages_returns_array(server_client):
    """GET /api/ws/messages returns 200 with a messages array."""
    resp = await server_client.get("/api/ws/messages")
    assert resp.status == 200
    body = await resp.json()
    assert isinstance(body.get("messages"), list)
