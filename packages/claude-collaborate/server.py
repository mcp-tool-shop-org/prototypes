"""
Claude Collaborate - Real-time collaboration server.

A unified sandbox environment for human-AI collaboration with WebSocket bridge.

Usage:
    python server.py [--port N]

Then open http://localhost:8877 in your browser.
"""

from __future__ import annotations

import asyncio
import contextlib
import itertools
import json
import logging
import os
import sys
import time
import uuid
from collections import deque
from collections.abc import Awaitable, Callable
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from aiohttp import WSMsgType, web

__version__ = "1.1.0"

# Configure logging
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
logger = logging.getLogger(__name__)

# Environment-driven configuration with defaults
PORT = int(os.environ.get("CC_PORT", "8877"))
HOST = os.environ.get("CC_HOST", "127.0.0.1")
MAX_WS_CLIENTS = int(os.environ.get("CC_MAX_CLIENTS", "50"))
MAX_WS_MESSAGE_SIZE = int(os.environ.get("CC_MAX_MESSAGE_SIZE", "65536"))

DIRECTORY = Path(__file__).parent.resolve()
RESPONSE_FILE_MAX_BYTES = 10 * 1024 * 1024  # 10 MB
# Built dynamically in main(); seeded from default PORT for module-level callers
ALLOWED_ORIGINS: list[str] = [
    f"http://localhost:{PORT}",
    f"http://127.0.0.1:{PORT}",
]

# WebSocket state
connected_ws_clients: set[web.WebSocketResponse] = set()
_messages_lock = asyncio.Lock()
_response_lock = asyncio.Lock()
MESSAGE_FILE = DIRECTORY / "messages.jsonl"
RESPONSE_FILE = DIRECTORY / "claude_responses.jsonl"

# Session & history state
HISTORY_MAX_LEN = 500
_history_buffer: deque[dict[str, Any]] = deque(maxlen=HISTORY_MAX_LEN)
_seq_counter = itertools.count(1)
_sessions: dict[str, dict[str, Any]] = {}  # session_id -> session metadata
_ws_session_map: dict[int, str] = {}  # id(ws) -> session_id

# Metrics counters
_server_start_time: float = time.monotonic()
_total_messages_received: int = 0
_total_responses_sent: int = 0
_total_ws_connections: int = 0

# In-flight streaming responses: message_id -> {chunks, started_at}
_active_streams: dict[str, dict[str, Any]] = {}

# Stale stream threshold in seconds (5 minutes)
_STREAM_TTL_SECONDS = 300


def _cleanup_stale_streams() -> None:
    """Remove streams older than _STREAM_TTL_SECONDS (lazy cleanup)."""
    now = time.monotonic()
    stale = [
        mid for mid, state in _active_streams.items()
        if now - state.get("started_at", now) > _STREAM_TTL_SECONDS
    ]
    for mid in stale:
        del _active_streams[mid]
        logger.info("Cleaned up stale stream: %s", mid)


def _next_seq() -> int:
    """Return the next monotonic sequence number."""
    return next(_seq_counter)


def _append_to_history(entry: dict[str, Any]) -> dict[str, Any]:
    """Append an entry to the history buffer with seq and message_id, return it."""
    entry["seq"] = _next_seq()
    entry["message_id"] = str(uuid.uuid4())
    _history_buffer.append(entry)
    return entry


def _touch_session(session_id: str) -> None:
    """Update last_activity for a session."""
    if session_id in _sessions:
        _sessions[session_id]["last_activity"] = datetime.now(timezone.utc).isoformat()


def _safe_resolve(root: Path, filename: str) -> Path | None:
    try:
        resolved = (root / filename).resolve()
    except (OSError, ValueError):
        return None
    if not resolved.is_relative_to(root):
        return None
    if not resolved.is_file():
        return None
    return resolved


async def index_handler(request: web.Request) -> web.StreamResponse:
    """Serve main Claude Collaborate UI."""
    index_path = DIRECTORY / "index.html"
    if not index_path.is_file():
        return web.Response(text="index.html not found", status=404)
    return web.FileResponse(index_path)


async def static_handler(request: web.Request) -> web.StreamResponse:
    """Serve static files."""
    filename = request.match_info.get('filename', '')
    file_path = await asyncio.to_thread(_safe_resolve, DIRECTORY, filename)
    if file_path:
        return web.FileResponse(file_path)
    return web.Response(text="Not Found", status=404)


async def adventures_handler(request: web.Request) -> web.StreamResponse:
    """Serve Creative Lab."""
    adventures_path = DIRECTORY / "adventures" / "index.html"
    if adventures_path.is_file():
        return web.FileResponse(adventures_path)
    return web.Response(text="Creative Lab not found", status=404)


async def adventures_static_handler(request: web.Request) -> web.StreamResponse:
    """Serve Creative Lab static files."""
    filename = request.match_info.get('filename', '')
    file_path = await asyncio.to_thread(_safe_resolve, DIRECTORY / "adventures", filename)
    if file_path:
        return web.FileResponse(file_path)
    return web.Response(text="Not Found", status=404)


async def websocket_handler(request: web.Request) -> web.WebSocketResponse | web.Response:
    """Handle WebSocket connections for real-time Claude communication."""
    if len(connected_ws_clients) >= MAX_WS_CLIENTS:
        return web.Response(text="Too many connections", status=503)

    ws = web.WebSocketResponse()
    await ws.prepare(request)

    # Re-check capacity after prepare to avoid TOCTOU race
    if len(connected_ws_clients) >= MAX_WS_CLIENTS:
        await ws.close(code=1013, message=b"Too many connections")
        return ws

    connected_ws_clients.add(ws)

    global _total_ws_connections
    _total_ws_connections += 1

    # Assign session identity
    session_id = str(uuid.uuid4())
    _ws_session_map[id(ws)] = session_id
    _sessions[session_id] = {
        "session_id": session_id,
        "connected_at": datetime.now(timezone.utc).isoformat(),
        "last_activity": datetime.now(timezone.utc).isoformat(),
        "client_count": 1,
    }

    logger.info(
        "WS client connected. session=%s Total: %d",
        session_id, len(connected_ws_clients),
    )

    # Send welcome message with session_id
    await ws.send_json({
        "type": "connected",
        "message": "Connected to Claude Collaborate Bridge",
        "session_id": session_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    try:
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                # Check for resume message (reconnection protocol)
                handled = await _try_handle_resume(ws, msg.data)
                if not handled:
                    await handle_ws_message(ws, msg.data)
            elif msg.type == WSMsgType.ERROR:
                logger.error("WebSocket error: %s", ws.exception())
    finally:
        connected_ws_clients.discard(ws)
        sid = _ws_session_map.pop(id(ws), None)
        if sid and sid in _sessions:
            del _sessions[sid]
        logger.info(
            "WS client disconnected. session=%s Total: %d",
            sid, len(connected_ws_clients),
        )

    return ws


async def _try_handle_resume(ws: web.WebSocketResponse, data: str) -> bool:
    """Handle a resume message for reconnection. Returns True if handled."""
    try:
        message = json.loads(data)
    except json.JSONDecodeError:
        return False

    if message.get("type") != "resume":
        return False

    old_session_id = message.get("session_id", "")
    last_seen_seq = message.get("last_seen_seq", 0)

    if not isinstance(last_seen_seq, int):
        last_seen_seq = 0

    # Re-map this ws to the resumed session_id (or keep a new one)
    current_sid = _ws_session_map.get(id(ws))
    if current_sid and current_sid in _sessions:
        del _sessions[current_sid]

    _ws_session_map[id(ws)] = old_session_id
    _sessions[old_session_id] = {
        "session_id": old_session_id,
        "connected_at": datetime.now(timezone.utc).isoformat(),
        "last_activity": datetime.now(timezone.utc).isoformat(),
        "client_count": 1,
    }

    # Replay messages from history with seq > last_seen_seq
    replayed = 0
    for entry in _history_buffer:
        if entry.get("seq", 0) > last_seen_seq:
            await ws.send_json({**entry, "type": "replay"})
            replayed += 1

    logger.info(
        "Session resumed. session=%s last_seen_seq=%d replayed=%d",
        old_session_id, last_seen_seq, replayed,
    )

    await ws.send_json({
        "type": "resume_complete",
        "session_id": old_session_id,
        "replayed": replayed,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    _touch_session(old_session_id)
    return True


async def handle_ws_message(ws: web.WebSocketResponse, data: str) -> None:
    """Process incoming WebSocket message."""
    # Finding 6: reject oversized messages
    if len(data) > MAX_WS_MESSAGE_SIZE:
        await ws.send_json({"type": "error", "message": "Message too large"})
        return

    session_id = _ws_session_map.get(id(ws), "")

    try:
        message = json.loads(data)
        msg_type = message.get("type", "")

        if msg_type in ("typing_start", "typing_stop"):
            # Broadcast typing indicators to all other clients
            indicator: dict[str, Any] = {
                "type": msg_type,
                "sender": message.get("sender", "unknown"),
                "session_id": session_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            await _broadcast_to_others(ws, indicator)
            return

        if msg_type == "user_message":
            content = message.get("content", "")
            if not isinstance(content, str):
                await ws.send_json({"type": "error", "message": "Content must be a string"})
                return
            logger.info("User message: %s...", content[:100])

            now = datetime.now(timezone.utc).isoformat()

            # Build the stored message record
            stored_record: dict[str, Any] = {
                "timestamp": now,
                "content": content,
                "type": "user_message",
                "session_id": session_id,
            }

            # Append to history buffer (adds seq + message_id)
            history_entry = _append_to_history({**stored_record})

            # Store message for Claude Code to read (under lock)
            line = json.dumps(stored_record) + "\n"

            async with _messages_lock:
                def _append_message() -> None:
                    with open(MESSAGE_FILE, "a", encoding="utf-8") as f:
                        f.write(line)

                await asyncio.to_thread(_append_message)

            global _total_messages_received
            _total_messages_received += 1
            _touch_session(session_id)

            # Acknowledge receipt with message_id
            await ws.send_json({
                "type": "message_received",
                "message_id": history_entry["message_id"],
                "seq": history_entry["seq"],
                "session_id": session_id,
                "timestamp": now,
            })

        elif msg_type == "ping":
            await ws.send_json({"type": "pong"})

    except json.JSONDecodeError:
        logger.warning("Invalid JSON received: %s", data[:100])
    except (OSError, ConnectionError):
        logger.exception("Error handling WebSocket message")


async def broadcast_to_ws_clients(message: dict[str, Any]) -> None:
    """Broadcast message to all connected WebSocket clients."""
    if not connected_ws_clients:
        return

    clients = list(connected_ws_clients)
    results = await asyncio.gather(
        *[ws.send_json(message) for ws in clients],
        return_exceptions=True,
    )

    disconnected: set[web.WebSocketResponse] = set()
    for ws, result in zip(clients, results, strict=False):
        if isinstance(result, asyncio.CancelledError):
            connected_ws_clients.difference_update(disconnected)
            raise result
        if isinstance(result, (OSError, ConnectionError)):
            disconnected.add(ws)

    if disconnected:
        connected_ws_clients.difference_update(disconnected)
        logger.info("Broadcast complete. Removed %d stale client(s)", len(disconnected))


async def _broadcast_to_others(
    sender: web.WebSocketResponse, message: dict[str, Any]
) -> None:
    """Broadcast message to all connected WebSocket clients except the sender."""
    clients = [ws for ws in connected_ws_clients if ws is not sender]
    if not clients:
        return

    results = await asyncio.gather(
        *[ws.send_json(message) for ws in clients],
        return_exceptions=True,
    )

    disconnected: set[web.WebSocketResponse] = set()
    for ws, result in zip(clients, results, strict=False):
        if isinstance(result, asyncio.CancelledError):
            connected_ws_clients.difference_update(disconnected)
            raise result
        if isinstance(result, (OSError, ConnectionError)):
            disconnected.add(ws)

    if disconnected:
        connected_ws_clients.difference_update(disconnected)


async def ws_respond_handler(request: web.Request) -> web.Response:
    """HTTP endpoint for Claude Code to send responses to browser."""
    try:
        data = await request.json()
        content = data.get("content", "")

        if not isinstance(content, str):
            return web.json_response({"error": "Content must be a string"}, status=400)

        if not content:
            return web.json_response({"error": "No content provided"}, status=400)

        if len(content) > MAX_WS_MESSAGE_SIZE:
            return web.json_response({"error": "Content too large"}, status=413)

        now = datetime.now(timezone.utc).isoformat()

        # Build response record and append to history
        response_record: dict[str, Any] = {
            "type": "claude_response",
            "content": content,
            "timestamp": now,
        }
        history_entry = _append_to_history({**response_record})

        # Broadcast to all connected clients (include message_id + seq)
        await broadcast_to_ws_clients({
            "type": "claude_response",
            "content": content,
            "message_id": history_entry["message_id"],
            "seq": history_entry["seq"],
            "timestamp": now,
        })

        # Store response (with rotation if file exceeds 10 MB)
        line = json.dumps({
            "timestamp": now,
            "content": content,
        }) + "\n"

        def _append_response() -> None:
            if RESPONSE_FILE.exists() and RESPONSE_FILE.stat().st_size > RESPONSE_FILE_MAX_BYTES:
                rotated = RESPONSE_FILE.with_suffix(".jsonl.1")
                if rotated.exists():
                    rotated.unlink()
                RESPONSE_FILE.rename(rotated)
            with open(RESPONSE_FILE, "a", encoding="utf-8") as f:
                f.write(line)

        async with _response_lock:
            await asyncio.to_thread(_append_response)

        global _total_responses_sent
        _total_responses_sent += 1

        return web.json_response({
            "status": "sent",
            "clients": len(connected_ws_clients),
            "message_id": history_entry["message_id"],
            "seq": history_entry["seq"],
        })

    except json.JSONDecodeError:
        return web.json_response({"error": "Invalid JSON"}, status=400)
    except Exception:
        logger.exception("Error in ws_respond_handler")
        return web.json_response({"error": "Internal server error"}, status=500)


async def ws_messages_handler(request: web.Request) -> web.Response:
    """HTTP endpoint for Claude Code to read pending messages."""
    messages = []

    async with _messages_lock:
        if MESSAGE_FILE.exists():
            def _read_and_clear() -> list[dict[str, Any]]:
                result: list[dict[str, Any]] = []
                with open(MESSAGE_FILE, encoding="utf-8") as f:
                    for raw_line in f:
                        if raw_line.strip():
                            with contextlib.suppress(json.JSONDecodeError):
                                result.append(json.loads(raw_line))
                if result:
                    MESSAGE_FILE.write_text("")
                return result

            messages = await asyncio.to_thread(_read_and_clear)

    return web.json_response({
        "messages": messages,
        "count": len(messages)
    })


async def ws_status_handler(request: web.Request) -> web.Response:
    """WebSocket bridge status."""
    return web.json_response({
        "connected_clients": len(connected_ws_clients),
        "status": "active" if connected_ws_clients else "idle",
        "version": __version__,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


async def sessions_handler(request: web.Request) -> web.Response:
    """Return active sessions with client count and last activity."""
    sessions_list = list(_sessions.values())
    return web.json_response({
        "sessions": sessions_list,
        "count": len(sessions_list),
    })


async def history_handler(request: web.Request) -> web.Response:
    """Non-destructive read from the message history ring buffer."""
    try:
        limit = int(request.query.get("limit", "50"))
    except ValueError:
        limit = 50
    try:
        since_seq = int(request.query.get("since_seq", "0"))
    except ValueError:
        since_seq = 0

    # Clamp limit to sane range
    limit = max(1, min(limit, HISTORY_MAX_LEN))

    entries = [e for e in _history_buffer if e.get("seq", 0) > since_seq]
    # Return only the last `limit` entries
    result = entries[-limit:] if len(entries) > limit else entries

    return web.json_response({
        "messages": result,
        "count": len(result),
    })


async def ws_typing_handler(request: web.Request) -> web.Response:
    """HTTP endpoint for Claude Code to broadcast typing indicators."""
    try:
        data = await request.json()
        status = data.get("status", "")
        sender = data.get("sender", "claude")

        if status not in ("start", "stop"):
            return web.json_response(
                {"error": "status must be 'start' or 'stop'"}, status=400,
            )

        msg_type = f"typing_{status}"
        indicator: dict[str, Any] = {
            "type": msg_type,
            "sender": sender,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        await broadcast_to_ws_clients(indicator)

        return web.json_response({"status": "sent", "clients": len(connected_ws_clients)})
    except json.JSONDecodeError:
        return web.json_response({"error": "Invalid JSON"}, status=400)
    except Exception:
        logger.exception("Error in ws_typing_handler")
        return web.json_response({"error": "Internal server error"}, status=500)


async def ws_stream_handler(request: web.Request) -> web.Response:
    """HTTP endpoint for streaming chunked responses to WS clients."""
    try:
        data = await request.json()
        message_id = data.get("message_id", "")
        chunk = data.get("chunk", "")
        done = data.get("done", False)

        if not message_id or not isinstance(message_id, str):
            return web.json_response(
                {"error": "message_id is required"}, status=400,
            )

        if not done and not isinstance(chunk, str):
            return web.json_response(
                {"error": "chunk must be a string"}, status=400,
            )

        # Lazy cleanup of abandoned streams
        _cleanup_stale_streams()

        if not done:
            # Accumulate chunk
            if message_id not in _active_streams:
                _active_streams[message_id] = {
                    "chunks": [],
                    "started_at": time.monotonic(),
                }
            _active_streams[message_id]["chunks"].append(chunk)

            await broadcast_to_ws_clients({
                "type": "stream_chunk",
                "message_id": message_id,
                "chunk": chunk,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

            return web.json_response({
                "status": "chunk_sent",
                "message_id": message_id,
                "clients": len(connected_ws_clients),
            })
        else:
            # Stream complete — assemble and store
            stream_state = _active_streams.pop(message_id, {"chunks": []})
            chunks = stream_state["chunks"]
            if chunk:
                chunks.append(chunk)
            full_content = "".join(chunks)

            await broadcast_to_ws_clients({
                "type": "stream_end",
                "message_id": message_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

            # Store the assembled response as a regular history entry
            now = datetime.now(timezone.utc).isoformat()
            response_record: dict[str, Any] = {
                "type": "claude_response",
                "content": full_content,
                "message_id": message_id,
                "timestamp": now,
            }
            _append_to_history({**response_record})

            # Also persist to response file
            line = json.dumps({
                "timestamp": now,
                "content": full_content,
            }) + "\n"

            async with _response_lock:
                def _append_stream_response() -> None:
                    over_limit = (
                        RESPONSE_FILE.exists()
                        and RESPONSE_FILE.stat().st_size > RESPONSE_FILE_MAX_BYTES
                    )
                    if over_limit:
                        rotated = RESPONSE_FILE.with_suffix(".jsonl.1")
                        if rotated.exists():
                            rotated.unlink()
                        RESPONSE_FILE.rename(rotated)
                    with open(RESPONSE_FILE, "a", encoding="utf-8") as f:
                        f.write(line)

                await asyncio.to_thread(_append_stream_response)

            global _total_responses_sent
            _total_responses_sent += 1

            return web.json_response({
                "status": "stream_complete",
                "message_id": message_id,
                "total_length": len(full_content),
                "clients": len(connected_ws_clients),
            })

    except json.JSONDecodeError:
        return web.json_response({"error": "Invalid JSON"}, status=400)
    except Exception:
        logger.exception("Error in ws_stream_handler")
        return web.json_response({"error": "Internal server error"}, status=500)


async def metrics_handler(request: web.Request) -> web.Response:
    """Return server metrics."""
    return web.json_response({
        "uptime_seconds": round(time.monotonic() - _server_start_time, 2),
        "total_messages_received": _total_messages_received,
        "total_responses_sent": _total_responses_sent,
        "total_ws_connections": _total_ws_connections,
        "current_clients": len(connected_ws_clients),
        "history_buffer_size": len(_history_buffer),
        "version": __version__,
    })


async def health_handler(request: web.Request) -> web.Response:
    """Health check endpoint."""
    return web.json_response({
        "status": "healthy",
        "service": "claude-collaborate",
        "version": __version__,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


@web.middleware
async def cors_middleware(
    request: web.Request,
    handler: Callable[[web.Request], Awaitable[web.StreamResponse]],
) -> web.StreamResponse:
    """Add CORS headers to all responses."""
    if request.method == "OPTIONS":
        resp: web.StreamResponse = web.Response()
    else:
        resp = await handler(request)

    origin = request.headers.get("Origin", "")
    if origin in ALLOWED_ORIGINS:
        resp.headers["Access-Control-Allow-Origin"] = origin
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return resp


def create_app() -> web.Application:
    """Create and configure the application."""
    # One-time directory guarantee for message/response files
    MESSAGE_FILE.parent.mkdir(parents=True, exist_ok=True)

    app = web.Application(middlewares=[cors_middleware], client_max_size=1 * 1024 * 1024)

    # Routes
    app.router.add_get("/", index_handler)
    app.router.add_get("/health", health_handler)
    app.router.add_get("/ws", websocket_handler)
    app.router.add_get("/adventures", adventures_handler)
    app.router.add_get("/adventures/{filename:.*}", adventures_static_handler)
    app.router.add_post("/api/ws/respond", ws_respond_handler)
    app.router.add_post("/api/ws/typing", ws_typing_handler)
    app.router.add_post("/api/ws/stream", ws_stream_handler)
    app.router.add_get("/api/ws/messages", ws_messages_handler)
    app.router.add_get("/api/ws/status", ws_status_handler)
    app.router.add_get("/api/metrics", metrics_handler)
    app.router.add_get("/api/sessions", sessions_handler)
    app.router.add_get("/api/history", history_handler)
    app.router.add_get("/{filename:.*}", static_handler)

    return app


def main() -> None:
    """Run the server."""
    args = sys.argv[1:]
    if "--version" in args or "-V" in args:
        print(f"claude-collaborate {__version__}")
        sys.exit(0)
    if "--help" in args or "-h" in args:
        print(f"claude-collaborate {__version__} — Real-time human-AI collaboration server\n")
        print("Usage: python server.py [options]\n")
        print("Options:")
        print(f"  --port N        Port to listen on (env: CC_PORT, default: {PORT})")
        print("  --version, -V   Show version and exit")
        print("  --help, -h      Show this help and exit")
        print("\nEnvironment variables:")
        print("  CC_PORT              Server port (default: 8877)")
        print("  CC_HOST              Bind address (default: 127.0.0.1)")
        print("  CC_MAX_CLIENTS       Max WS connections (default: 50)")
        print("  CC_MAX_MESSAGE_SIZE  Max message bytes (default: 65536)")
        print(f"\nStarts the server on http://{HOST}:{PORT}")
        sys.exit(0)

    # Parse --port flag (overrides CC_PORT env var)
    port = PORT
    host = HOST
    if "--port" in args:
        idx = args.index("--port")
        if idx + 1 < len(args):
            try:
                port = int(args[idx + 1])
            except ValueError:
                print(f"Error: --port requires an integer, got '{args[idx + 1]}'")
                sys.exit(1)
        else:
            print("Error: --port requires a value")
            sys.exit(1)

    # Rebuild allowed origins from the actual runtime port
    ALLOWED_ORIGINS.clear()
    ALLOWED_ORIGINS.extend([
        f"http://localhost:{port}",
        f"http://127.0.0.1:{port}",
    ])

    print()
    print("=" * 60)
    print("  Claude Collaborate")
    print("  Where Human Creativity Meets AI Intelligence")
    print("=" * 60)
    print()
    print(f"  Main UI:        http://localhost:{port}")
    print(f"  WebSocket:      ws://localhost:{port}/ws")
    print(f"  Creative Lab:   http://localhost:{port}/adventures")
    print()
    print("  API Endpoints:")
    print("    GET  /api/ws/messages  - Read pending messages")
    print("    POST /api/ws/respond   - Send response to browser")
    print("    POST /api/ws/typing    - Broadcast typing indicator")
    print("    POST /api/ws/stream    - Stream chunked response")
    print("    GET  /api/ws/status    - Bridge status")
    print("    GET  /api/metrics      - Server metrics")
    print("    GET  /api/sessions     - Active sessions")
    print("    GET  /api/history      - Message history (non-destructive)")
    print()
    print("  Press Ctrl+C to stop")
    print("=" * 60)
    print()

    # Reset server start time just before serving
    global _server_start_time
    _server_start_time = time.monotonic()

    app = create_app()
    web.run_app(app, host=host, port=port, print=None)


if __name__ == "__main__":
    main()
