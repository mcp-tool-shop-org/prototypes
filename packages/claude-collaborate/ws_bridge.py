"""
WebSocket Bridge for Claude Collaborate
Enables real-time bidirectional communication between browser UI and Claude Code.

Architecture:
  Browser (Claude Collaborate) <--WebSocket--> ws_bridge.py <--File/API--> Claude Code

Usage:
  python ws_bridge.py

Then in Claude Collaborate, connect to ws://localhost:8878
"""

import asyncio
import datetime
import itertools
import json
import logging
import os
import time
import uuid
from collections import deque
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any

import aiohttp
from aiohttp import web

# Structured logging
logger = logging.getLogger("ws_bridge")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)

# Configuration
WS_HOST = os.environ.get("WS_BRIDGE_HOST", "127.0.0.1")
WS_PORT = int(os.environ.get("WS_BRIDGE_PORT", "8878"))
MESSAGE_FILE = Path(__file__).parent / "messages.jsonl"
CLAUDE_RESPONSE_FILE = Path(__file__).parent / "claude_responses.jsonl"
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
MAX_CLIENTS = 50
MAX_CONTENT_CHARS = 50_000

# Build CORS allowlist dynamically so a custom port is always included
CORS_ALLOWLIST = [
    "http://localhost:8877",
    "http://127.0.0.1:8877",
]
if WS_PORT != 8878:
    CORS_ALLOWLIST.extend([
        f"http://localhost:{WS_PORT}",
        f"http://127.0.0.1:{WS_PORT}",
    ])

PROTOCOL_VERSION = 2

connected_clients: set[web.WebSocketResponse] = set()

# Monotonic sequence counter for outbound messages
_seq_counter = itertools.count(1)

# Server start time for uptime calculation
_server_start_time = datetime.datetime.now(datetime.timezone.utc)

# Metrics counters
_total_messages = 0
_total_responses = 0

# In-flight streaming responses keyed by message_id
_inflight_streams: dict[str, dict[str, Any]] = {}

# Stale stream threshold in seconds (5 minutes)
_STREAM_TTL_SECONDS = 300


def _cleanup_stale_streams() -> None:
    """Remove streams older than _STREAM_TTL_SECONDS (lazy cleanup)."""
    now = time.monotonic()
    stale = [
        mid for mid, state in _inflight_streams.items()
        if now - state.get("started_at", now) > _STREAM_TTL_SECONDS
    ]
    for mid in stale:
        del _inflight_streams[mid]
        logger.info("Cleaned up stale stream: %s", mid)

# Ring buffer for reconnection replay (stores recent outbound messages with seq)
_replay_buffer: deque[dict[str, Any]] = deque(maxlen=500)

# File I/O locks to prevent race conditions on read+clear operations
_message_file_lock = asyncio.Lock()
_response_file_lock = asyncio.Lock()


def _next_seq() -> int:
    """Return the next monotonic sequence number."""
    return next(_seq_counter)


def _stamp_outbound(message: dict[str, Any]) -> dict[str, Any]:
    """Add seq number to an outbound message and buffer it for replay."""
    message["seq"] = _next_seq()
    _replay_buffer.append(message)
    return message


def _rotate_file_if_needed(file_path: Path) -> None:
    """Rotate file if it exceeds MAX_FILE_SIZE_BYTES.

    Rotation scheme: file.jsonl -> file.jsonl.1 -> file.jsonl.2 (deleted)
    Creates the empty replacement first, then renames the old file to minimize
    the data-loss window.
    """
    if not file_path.exists():
        return

    try:
        size = file_path.stat().st_size
        if size < MAX_FILE_SIZE_BYTES:
            return

        backup_2 = file_path.with_suffix(file_path.suffix + ".2")
        backup_1 = file_path.with_suffix(file_path.suffix + ".1")

        if backup_2.exists():
            backup_2.unlink()
        if backup_1.exists():
            backup_1.rename(backup_2)

        # Create fresh empty file FIRST, then rename old to .1
        # This minimises the window where no file exists
        tmp = file_path.with_suffix(file_path.suffix + ".tmp")
        tmp.touch()
        file_path.rename(backup_1)
        tmp.rename(file_path)

        logger.info("Rotated %s (was %s bytes)", file_path.name, f"{size:,}")
    except OSError as e:
        logger.error("File rotation error: %s", e)


async def _read_and_clear_jsonl(
    file_path: Path, lock: asyncio.Lock
) -> list[dict[str, Any]]:
    """Read all JSON lines from *file_path*, clear it, and return the parsed list.

    Blocks are offloaded to a thread to avoid stalling the event loop.
    Malformed lines are logged and skipped.
    """
    items: list[dict[str, Any]] = []
    async with lock:
        exists = await asyncio.to_thread(file_path.exists)
        if not exists:
            return items
        try:
            raw = await asyncio.to_thread(file_path.read_text, "utf-8")
            for line in raw.splitlines():
                if line.strip():
                    try:
                        items.append(json.loads(line))
                    except json.JSONDecodeError as e:
                        logger.warning("Skipping malformed line in %s: %s", file_path.name, e)
            await asyncio.to_thread(file_path.write_text, "")
        except (json.JSONDecodeError, OSError) as e:
            logger.error("Error reading %s: %s", file_path.name, e)
    return items


async def websocket_handler(request: web.Request) -> web.StreamResponse:
    """Handle WebSocket connections from browser."""
    if len(connected_clients) >= MAX_CLIENTS:
        logger.warning("Connection rejected: at capacity (%d)", MAX_CLIENTS)
        return web.Response(status=503, text="Server at capacity")

    ws = web.WebSocketResponse(heartbeat=30.0, max_msg_size=1 * 1024 * 1024)
    await ws.prepare(request)

    # Re-check capacity after prepare to close the TOCTOU gap
    if len(connected_clients) >= MAX_CLIENTS:
        await ws.close(code=aiohttp.WSCloseCode.TRY_AGAIN_LATER, message=b"Server at capacity")
        logger.warning("Connection rejected post-prepare: at capacity (%d)", MAX_CLIENTS)
        return ws

    connected_clients.add(ws)
    logger.info("Client connected. Total: %d", len(connected_clients))

    try:
        # Send welcome message inside try so finally always cleans up
        welcome = _stamp_outbound({
            "type": "connected",
            "message": "Connected to Claude Collaborate Bridge",
            "protocol_version": PROTOCOL_VERSION,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        })
        await ws.send_json(welcome)

        async for msg in ws:
            if msg.type == aiohttp.WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                    # Handle replay requests for reconnection
                    if data.get("type") == "replay":
                        since_seq = data.get("since_seq", 0)
                        if not isinstance(since_seq, int) or since_seq < 0:
                            await ws.send_json({
                                "type": "error",
                                "message": "since_seq must be a non-negative integer",
                            })
                            continue
                        replayed = 0
                        for buffered in _replay_buffer:
                            if buffered.get("seq", 0) > since_seq:
                                await ws.send_json(buffered)
                                replayed += 1
                        logger.info("Replayed %d messages (since_seq=%d)", replayed, since_seq)
                        continue
                    await handle_message(ws, data)
                except json.JSONDecodeError:
                    await ws.send_json({"type": "error", "message": "Invalid JSON"})
            elif msg.type == aiohttp.WSMsgType.ERROR:
                logger.error("WebSocket error: %s", ws.exception())
    finally:
        connected_clients.discard(ws)
        logger.info("Client disconnected. Total: %d", len(connected_clients))

    return ws


async def _broadcast_to_others(
    sender: web.WebSocketResponse, message: dict[str, Any]
) -> None:
    """Broadcast a message to all connected clients except the sender.

    Used for ephemeral indicators (typing, thinking) that should not echo back.
    These messages are NOT stamped with seq or buffered for replay.
    """
    targets = [c for c in connected_clients if c is not sender and not c.closed]
    if not targets:
        return
    results = await asyncio.gather(
        *[c.send_json(message) for c in targets],
        return_exceptions=True,
    )
    for client, result in zip(targets, results, strict=False):
        if isinstance(result, Exception):
            logger.warning("Dropping client during ephemeral broadcast: %s", result)
            connected_clients.discard(client)


async def handle_message(ws: web.WebSocketResponse, data: dict[str, Any]) -> None:
    """Process incoming WebSocket messages from browser clients.

    Protocol version: 2

    Inbound message types (client -> server):

    - user_message (content: str) — persist + ack with message_id
    - ping — replies with pong + timestamp
    - get_responses — reads & clears claude_responses.jsonl
    - replay (since_seq: int >= 0) — replays buffered messages
    - typing_start — forwards to other clients (ephemeral)
    - typing_stop — forwards to other clients (ephemeral)

    Outbound message types (server -> client):

    - connected — welcome with protocol_version
    - message_received — ack with message_id
    - pong — reply to ping
    - claude_responses — list from claude_responses.jsonl
    - claude_response — broadcast via POST /api/respond
    - stream_chunk — streaming chunk (message_id, chunk, seq)
    - stream_end — end of stream (message_id)
    - typing_start/stop — ephemeral, forwarded
    - error — human-readable message field

    All sequenced outbound messages carry a monotonic ``seq`` field and are
    buffered in a 500-entry ring for reconnection replay.  Ephemeral messages
    (typing_start, typing_stop) are NOT sequenced or buffered.
    """
    global _total_messages
    msg_type = data.get("type", "unknown")
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

    if msg_type in ("typing_start", "typing_stop"):
        # Ephemeral indicators: forward to all OTHER clients, don't store
        await _broadcast_to_others(sender=ws, message={
            "type": msg_type,
            "timestamp": timestamp,
        })
        logger.debug("Forwarded %s to %d other client(s)", msg_type, len(connected_clients) - 1)
        return

    if msg_type == "user_message":
        content = data.get("content", "")

        # Type guard: content must be a string
        if not isinstance(content, str):
            await ws.send_json({
                "type": "error",
                "message": "Field 'content' must be a string",
                "timestamp": timestamp,
            })
            return

        # Validate message size
        if len(content) > MAX_CONTENT_CHARS:
            await ws.send_json({
                "type": "error",
                "message": f"Content exceeds max length of {MAX_CONTENT_CHARS}",
                "timestamp": timestamp,
            })
            return

        message_id = str(uuid.uuid4())
        message = {
            "type": "user_message",
            "content": content,
            "message_id": message_id,
            "timestamp": timestamp,
            "source": "claude_collaborate",
        }

        # Append to message file for Claude Code to read (with lock)
        # FALSE-ACK FIX: only ack AFTER successful file write
        try:
            async with _message_file_lock:
                await asyncio.to_thread(_rotate_file_if_needed, MESSAGE_FILE)

                def _append_message() -> None:
                    with open(MESSAGE_FILE, "a", encoding="utf-8") as f:
                        f.write(json.dumps(message) + "\n")

                await asyncio.to_thread(_append_message)
        except OSError as e:
            logger.error("Failed to write message to file: %s", e)
            await ws.send_json(_stamp_outbound({
                "type": "error",
                "message": "Failed to store message",
                "message_id": message_id,
                "timestamp": timestamp,
            }))
            return

        # Acknowledge receipt -- only reached if file write succeeded
        preview = content[:50] + ("..." if len(content) > 50 else "")
        await ws.send_json(_stamp_outbound({
            "type": "message_received",
            "message_id": message_id,
            "timestamp": timestamp,
            "content": preview,
        }))

        _total_messages += 1
        logger.info("User: %s (id=%s)", content[:80], message_id)

    elif msg_type == "ping":
        await ws.send_json(_stamp_outbound({"type": "pong", "timestamp": timestamp}))

    elif msg_type == "get_responses":
        # Check for Claude responses
        responses = await get_claude_responses()
        await ws.send_json(_stamp_outbound({
            "type": "claude_responses",
            "responses": responses,
            "timestamp": timestamp,
        }))

    else:
        await ws.send_json(_stamp_outbound({
            "type": "error",
            "message": f"Unknown message type: {msg_type}",
            "timestamp": timestamp,
        }))


async def get_claude_responses() -> list[dict[str, Any]]:
    """Read Claude responses from file."""
    return await _read_and_clear_jsonl(CLAUDE_RESPONSE_FILE, _response_file_lock)


async def broadcast_to_clients(message: dict[str, Any]) -> None:
    """Send message to all connected clients.

    The message is stamped with a seq number and buffered for replay before
    being fanned out to connected clients.
    """
    _stamp_outbound(message)
    stale = {c for c in connected_clients if c.closed}
    if stale:
        connected_clients.difference_update(stale)
        logger.info("Cleaned up %d stale client(s)", len(stale))
    clients = [c for c in connected_clients if not c.closed]
    if not clients:
        return
    results = await asyncio.gather(
        *[client.send_json(message) for client in clients],
        return_exceptions=True
    )
    dropped = 0
    for client, result in zip(clients, results, strict=False):
        if isinstance(result, Exception):
            logger.warning("Dropping client due to send error: %s", result)
            connected_clients.discard(client)
            dropped += 1
    if dropped:
        logger.info("Dropped %d client(s) after broadcast errors", dropped)


# HTTP endpoints for Claude Code to use
async def post_response(request: web.Request) -> web.Response:
    """Endpoint for Claude Code to send responses to browser."""
    global _total_responses
    try:
        data = await request.json()
        if not isinstance(data, dict):
            return web.json_response(
                {"status": "error", "message": "Expected JSON object"}, status=400
            )
        content = data.get("content", "")

        # Type guard: content must be a string
        if not isinstance(content, str):
            return web.json_response(
                {"status": "error", "message": "Field 'content' must be a string"},
                status=400,
            )

        # Validate message size
        if len(content) > MAX_CONTENT_CHARS:
            return web.json_response(
                {"status": "error", "message": f"Content exceeds {MAX_CONTENT_CHARS} characters"},
                status=400,
            )

        message_id = str(uuid.uuid4())
        message = {
            "type": "claude_response",
            "content": content,
            "message_id": message_id,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }

        # Broadcast to all connected browser clients
        await broadcast_to_clients(message)

        # Also save to file as backup (with lock and rotation)
        async with _response_file_lock:
            await asyncio.to_thread(_rotate_file_if_needed, CLAUDE_RESPONSE_FILE)

            def _append_response() -> None:
                with open(CLAUDE_RESPONSE_FILE, "a", encoding="utf-8") as f:
                    f.write(json.dumps(message) + "\n")

            await asyncio.to_thread(_append_response)

        _total_responses += 1
        return web.json_response({
            "status": "sent",
            "message_id": message_id,
            "clients": len(connected_clients),
        })
    except (json.JSONDecodeError, OSError) as e:
        logger.exception("post_response error: %s", e)
        return web.json_response(
            {"status": "error", "message": "Internal server error"}, status=500
        )


async def post_stream(request: web.Request) -> web.Response:
    """Streaming response endpoint for Claude Code.

    Accepts chunks of a response and broadcasts them to WS clients in real time.
    When the final chunk arrives (done: true), the full assembled response is
    persisted to claude_responses.jsonl.

    Request body:
        message_id: str  -- stable ID that groups chunks into one response
        chunk: str       -- text fragment (ignored when done=true and chunk is empty)
        done: bool       -- true signals end-of-stream
    """
    global _total_responses
    try:
        data = await request.json()
        if not isinstance(data, dict):
            return web.json_response(
                {"status": "error", "message": "Expected JSON object"}, status=400,
            )

        message_id = data.get("message_id")
        chunk = data.get("chunk", "")
        done = data.get("done", False)

        if not isinstance(message_id, str) or not message_id:
            return web.json_response(
                {"status": "error", "message": "Field 'message_id' is required (string)"},
                status=400,
            )
        if not isinstance(chunk, str):
            return web.json_response(
                {"status": "error", "message": "Field 'chunk' must be a string"},
                status=400,
            )

        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Lazy cleanup of abandoned streams
        _cleanup_stale_streams()

        # Initialise in-flight state on first chunk
        if message_id not in _inflight_streams:
            _inflight_streams[message_id] = {
                "chunks": [],
                "seq": 0,
                "started_at": time.monotonic(),
            }

        stream_state = _inflight_streams[message_id]

        if not done:
            # Accumulate and broadcast chunk
            stream_state["chunks"].append(chunk)
            stream_state["seq"] += 1
            await broadcast_to_clients({
                "type": "stream_chunk",
                "message_id": message_id,
                "chunk": chunk,
                "seq": stream_state["seq"],
                "timestamp": timestamp,
            })
            return web.json_response({
                "status": "chunk_sent",
                "message_id": message_id,
                "stream_seq": stream_state["seq"],
                "clients": len(connected_clients),
            })

        # done == True: assemble full response, persist, broadcast end signal
        full_content = "".join(stream_state["chunks"])
        del _inflight_streams[message_id]

        # Broadcast stream_end
        await broadcast_to_clients({
            "type": "stream_end",
            "message_id": message_id,
            "timestamp": timestamp,
        })

        # Persist assembled response to file
        message = {
            "type": "claude_response",
            "content": full_content,
            "message_id": message_id,
            "timestamp": timestamp,
        }
        async with _response_file_lock:
            await asyncio.to_thread(_rotate_file_if_needed, CLAUDE_RESPONSE_FILE)

            def _append_response() -> None:
                with open(CLAUDE_RESPONSE_FILE, "a", encoding="utf-8") as f:
                    f.write(json.dumps(message) + "\n")

            await asyncio.to_thread(_append_response)

        _total_responses += 1
        logger.info(
            "Stream complete: message_id=%s, length=%d chars",
            message_id, len(full_content),
        )
        return web.json_response({
            "status": "stream_complete",
            "message_id": message_id,
            "total_length": len(full_content),
            "clients": len(connected_clients),
        })

    except (json.JSONDecodeError, OSError) as e:
        logger.exception("post_stream error: %s", e)
        return web.json_response(
            {"status": "error", "message": "Internal server error"}, status=500,
        )


async def get_metrics(request: web.Request) -> web.Response:
    """Return bridge operational metrics."""
    now = datetime.datetime.now(datetime.timezone.utc)
    uptime_seconds = (now - _server_start_time).total_seconds()
    return web.json_response({
        "uptime_seconds": round(uptime_seconds, 1),
        "total_messages": _total_messages,
        "total_responses": _total_responses,
        "current_clients": len(connected_clients),
        "buffer_size": len(_replay_buffer),
        "inflight_streams": len(_inflight_streams),
        "protocol_version": PROTOCOL_VERSION,
        "timestamp": now.isoformat(),
    })


async def get_messages(request: web.Request) -> web.Response:
    """Endpoint for Claude Code to read user messages."""
    messages = await _read_and_clear_jsonl(MESSAGE_FILE, _message_file_lock)
    return web.json_response({"messages": messages, "count": len(messages)})


async def get_history(request: web.Request) -> web.Response:
    """Non-destructive read of the replay buffer.

    Query params:
        limit  - max items to return (default 50, capped at 500)
        since  - only return messages with seq > since (default 0)
    """
    try:
        limit = min(int(request.query.get("limit", "50")), 500)
        since = int(request.query.get("since", "0"))
    except (ValueError, TypeError):
        return web.json_response(
            {"status": "error", "message": "limit and since must be integers"},
            status=400,
        )

    messages = [m for m in _replay_buffer if m.get("seq", 0) > since][-limit:]
    return web.json_response({"messages": messages, "count": len(messages)})


async def health_check(request: web.Request) -> web.Response:
    """Health check endpoint."""
    return web.json_response({
        "status": "ok",
        "connected_clients": len(connected_clients),
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    })


async def on_shutdown(app: web.Application) -> None:
    """Gracefully close all WebSocket connections on server shutdown."""
    clients = list(connected_clients)
    closed_count = 0
    for ws in clients:
        if not ws.closed:
            try:
                await ws.close(code=aiohttp.WSCloseCode.GOING_AWAY, message=b"Server shutting down")
                closed_count += 1
            except Exception as e:
                logger.error("Error closing client during shutdown: %s", e)
    connected_clients.clear()
    logger.info("Graceful shutdown complete, closed %d client(s)", closed_count)


def create_app() -> web.Application:
    """Create the aiohttp application."""
    app = web.Application(client_max_size=1 * 1024 * 1024)

    # WebSocket route
    app.router.add_get("/ws", websocket_handler)

    # HTTP API routes for Claude Code
    app.router.add_post("/api/respond", post_response)
    app.router.add_post("/api/stream", post_stream)
    app.router.add_get("/api/messages", get_messages)
    app.router.add_get("/api/history", get_history)
    app.router.add_get("/api/metrics", get_metrics)
    app.router.add_get("/health", health_check)

    # Graceful shutdown handler
    app.on_shutdown.append(on_shutdown)

    # CORS middleware for browser access (origin-checked)
    @web.middleware
    async def cors_middleware(
        request: web.Request,
        handler: Callable[[web.Request], Awaitable[web.StreamResponse]],
    ) -> web.StreamResponse:
        origin = request.headers.get("Origin")
        if request.method == "OPTIONS":
            resp = web.Response()
            if origin in CORS_ALLOWLIST:
                resp.headers["Access-Control-Allow-Origin"] = origin
                resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
                resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
            return resp
        try:
            response = await handler(request)
        except web.HTTPException as exc:
            if origin in CORS_ALLOWLIST:
                exc.headers["Access-Control-Allow-Origin"] = origin
            raise
        if origin in CORS_ALLOWLIST:
            response.headers["Access-Control-Allow-Origin"] = origin
        return response

    app.middlewares.append(cors_middleware)

    # Startup writability probe -- fail fast if files are not writable
    try:
        MESSAGE_FILE.touch(exist_ok=True)
        CLAUDE_RESPONSE_FILE.touch(exist_ok=True)
    except OSError as e:
        logger.error(
            "Cannot write to data files (%s, %s): %s -- bridge may not function correctly",
            MESSAGE_FILE, CLAUDE_RESPONSE_FILE, e,
        )

    return app


if __name__ == "__main__":
    _w = 55
    _ws = f"ws://{WS_HOST}:{WS_PORT}/ws"
    _msg = f"http://{WS_HOST}:{WS_PORT}/api/messages (GET)"
    _rsp = f"http://{WS_HOST}:{WS_PORT}/api/respond (POST)"
    _stm = f"http://{WS_HOST}:{WS_PORT}/api/stream (POST)"
    _met = f"http://{WS_HOST}:{WS_PORT}/api/metrics (GET)"
    _hlt = f"http://{WS_HOST}:{WS_PORT}/health"
    _curl = f"http://{WS_HOST}:{WS_PORT}"
    print(f"""
{"=" * _w}
  Claude Collaborate WebSocket Bridge  (proto v{PROTOCOL_VERSION})
{"=" * _w}
  WebSocket: {_ws}
  HTTP API:  {_msg}
             {_rsp}
             {_stm}
  Metrics:   {_met}
  Health:    {_hlt}
{"=" * _w}

For Claude Code, use these commands:
  - Read messages:  curl {_curl}/api/messages
  - Send response:
      curl -X POST {_curl}/api/respond \\
        -H "Content-Type: application/json" \\
        -d '{{"content": "Hello from Claude!"}}'
  - Stream response:
      curl -X POST {_curl}/api/stream \\
        -H "Content-Type: application/json" \\
        -d '{{"message_id": "abc", "chunk": "Hello", "done": false}}'
  - Metrics: curl {_curl}/api/metrics
""")

    app = create_app()
    web.run_app(app, host=WS_HOST, port=WS_PORT, print=None)
