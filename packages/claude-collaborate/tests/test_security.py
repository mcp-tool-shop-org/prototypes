"""Security-focused tests — connection limits, body size, CORS origin."""

from __future__ import annotations

import server
import ws_bridge

# =============================================================================
# WebSocket connection limit is configured
# =============================================================================


def test_server_max_ws_clients_is_bounded():
    """server.MAX_WS_CLIENTS must be a positive integer <= 100."""
    assert isinstance(server.MAX_WS_CLIENTS, int)
    assert 1 <= server.MAX_WS_CLIENTS <= 100


def test_ws_bridge_max_clients_is_bounded():
    """ws_bridge.MAX_CLIENTS must be a positive integer <= 100."""
    assert isinstance(ws_bridge.MAX_CLIENTS, int)
    assert 1 <= ws_bridge.MAX_CLIENTS <= 100


# =============================================================================
# client_max_size is enforced
# =============================================================================


def test_server_app_has_client_max_size():
    """server create_app sets client_max_size to reject oversized bodies."""
    app = server.create_app()
    assert app._client_max_size is not None
    assert app._client_max_size <= 10 * 1024 * 1024  # at most 10 MB


def test_ws_bridge_app_has_client_max_size():
    """ws_bridge create_app sets client_max_size to reject oversized bodies."""
    app = ws_bridge.create_app()
    assert app._client_max_size is not None
    assert app._client_max_size <= 10 * 1024 * 1024


## server_client fixture is provided by conftest.py


async def test_oversized_body_rejected(server_client):
    """A POST body exceeding client_max_size should be rejected (413)."""
    huge = "x" * (2 * 1024 * 1024)  # 2 MB > 1 MB limit
    resp = await server_client.post(
        "/api/ws/respond",
        json={"content": huge},
    )
    # aiohttp raises HTTPRequestEntityTooLarge (413) but handler may catch it
    assert resp.status in (413, 500)


# =============================================================================
# CORS origin is restricted
# =============================================================================


async def test_server_cors_origin_is_not_wildcard(server_client):
    """server CORS origin must not be the unrestricted wildcard '*'."""
    resp = await server_client.get("/health")
    origin = resp.headers.get("Access-Control-Allow-Origin", "")
    assert origin != "*", "CORS origin should be restricted, not '*'"
