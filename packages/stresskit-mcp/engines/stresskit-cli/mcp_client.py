"""
MCP Client Library for StressKit.

Provides transport-agnostic interface for MCP protocol operations.
Checks consume this interface; they never know the transport.
"""

from __future__ import annotations

import json
import subprocess
import sys
import threading
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Callable
from queue import Queue, Empty
import logging

logger = logging.getLogger(__name__)


# =============================================================================
# Protocol Types
# =============================================================================

@dataclass
class ServerIdentity:
    """Server identity from initialize response."""
    name: str
    version: str | None = None
    protocol_version: str | None = None
    capabilities: dict[str, Any] = field(default_factory=dict)


@dataclass
class Tool:
    """MCP tool definition."""
    name: str
    description: str | None = None
    input_schema: dict[str, Any] | None = None


@dataclass
class Resource:
    """MCP resource definition."""
    uri: str
    name: str | None = None
    description: str | None = None
    mime_type: str | None = None


@dataclass
class CallResult:
    """Result of an MCP call with timing."""
    success: bool
    result: Any = None
    error: dict[str, Any] | None = None
    latency_ms: float = 0
    request_bytes: int = 0
    response_bytes: int = 0


@dataclass
class TranscriptEntry:
    """Single request/response pair for replay."""
    request_id: int | str
    method: str
    params: dict[str, Any] | None
    result: Any = None
    error: dict[str, Any] | None = None
    latency_ms: float = 0
    timestamp: float = 0


# =============================================================================
# Client Interface
# =============================================================================

class MCPClientError(Exception):
    """Base error for MCP client operations."""
    pass


class MCPConnectionError(MCPClientError):
    """Connection failed or lost."""
    pass


class MCPProtocolError(MCPClientError):
    """Protocol-level error (invalid JSON-RPC, etc.)."""
    pass


class MCPTimeoutError(MCPClientError):
    """Request timed out."""
    pass


class MCPClient(ABC):
    """Abstract MCP client interface.

    Checks use this interface. Transport implementations inherit from it.
    """

    def __init__(self, timeout_ms: int = 30000):
        self.timeout_ms = timeout_ms
        self.transcript: list[TranscriptEntry] = []
        self._request_id = 0
        self._identity: ServerIdentity | None = None

    @property
    def identity(self) -> ServerIdentity | None:
        return self._identity

    @abstractmethod
    def connect(self) -> None:
        """Establish connection to server."""
        pass

    @abstractmethod
    def close(self) -> None:
        """Close connection."""
        pass

    @abstractmethod
    def _send_request(self, method: str, params: dict[str, Any] | None = None) -> CallResult:
        """Send JSON-RPC request and wait for response."""
        pass

    def _next_id(self) -> int:
        self._request_id += 1
        return self._request_id

    def _record(self, entry: TranscriptEntry) -> None:
        """Record a transcript entry."""
        self.transcript.append(entry)

    def initialize(self, client_info: dict[str, Any] | None = None) -> CallResult:
        """Send initialize request and capture server identity."""
        params = {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": client_info or {
                "name": "stresskit",
                "version": "0.1.0",
            },
        }

        result = self._send_request("initialize", params)

        if result.success and result.result:
            server_info = result.result.get("serverInfo", {})
            self._identity = ServerIdentity(
                name=server_info.get("name", "unknown"),
                version=server_info.get("version"),
                protocol_version=result.result.get("protocolVersion"),
                capabilities=result.result.get("capabilities", {}),
            )

        return result

    def initialized(self) -> CallResult:
        """Send initialized notification."""
        # This is a notification, no response expected
        return self._send_request("notifications/initialized", {})

    def list_tools(self) -> CallResult:
        """Get list of available tools."""
        return self._send_request("tools/list", {})

    def invoke_tool(self, name: str, arguments: dict[str, Any] | None = None) -> CallResult:
        """Invoke a tool by name."""
        params = {
            "name": name,
            "arguments": arguments or {},
        }
        return self._send_request("tools/call", params)

    def list_resources(self) -> CallResult:
        """Get list of available resources."""
        return self._send_request("resources/list", {})

    def read_resource(self, uri: str) -> CallResult:
        """Read a resource by URI."""
        return self._send_request("resources/read", {"uri": uri})

    def ping(self) -> CallResult:
        """Ping the server (if supported)."""
        return self._send_request("ping", {})


# =============================================================================
# Stdio Transport
# =============================================================================

class StdioClient(MCPClient):
    """MCP client over stdio (subprocess)."""

    def __init__(
        self,
        command: str,
        args: list[str] | None = None,
        cwd: str | None = None,
        env: dict[str, str] | None = None,
        timeout_ms: int = 30000,
    ):
        super().__init__(timeout_ms)
        self.command = command
        self.args = args or []
        self.cwd = cwd
        self.env = env

        self._process: subprocess.Popen | None = None
        self._reader_thread: threading.Thread | None = None
        self._response_queue: Queue[dict[str, Any]] = Queue()
        self._pending: dict[int | str, threading.Event] = {}
        self._responses: dict[int | str, dict[str, Any]] = {}
        self._running = False
        self._lock = threading.Lock()

    def connect(self) -> None:
        """Start the subprocess and begin reading."""
        if self._process is not None:
            raise MCPConnectionError("Already connected")

        try:
            # Build full command
            cmd = [self.command] + self.args

            # Merge environment
            import os
            env = os.environ.copy()
            if self.env:
                env.update(self.env)

            self._process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=self.cwd,
                env=env,
                bufsize=0,  # Unbuffered
            )

            self._running = True

            # Start reader thread
            self._reader_thread = threading.Thread(target=self._read_loop, daemon=True)
            self._reader_thread.start()

        except FileNotFoundError as e:
            raise MCPConnectionError(f"Command not found: {self.command}") from e
        except OSError as e:
            raise MCPConnectionError(f"Failed to start process: {e}") from e

    def close(self) -> None:
        """Stop the subprocess."""
        self._running = False

        if self._process:
            try:
                self._process.stdin.close()
                self._process.terminate()
                self._process.wait(timeout=5)
            except Exception:
                try:
                    self._process.kill()
                except Exception:
                    pass
            self._process = None

        if self._reader_thread:
            self._reader_thread.join(timeout=2)
            self._reader_thread = None

    def _read_loop(self) -> None:
        """Read JSON-RPC messages from stdout."""
        if not self._process or not self._process.stdout:
            return

        buffer = b""
        while self._running:
            try:
                chunk = self._process.stdout.read(4096)
                if not chunk:
                    break
                buffer += chunk

                # Try to parse complete JSON messages (newline-delimited)
                while b"\n" in buffer:
                    line, buffer = buffer.split(b"\n", 1)
                    line = line.strip()
                    if not line:
                        continue

                    try:
                        msg = json.loads(line.decode("utf-8"))
                        self._handle_message(msg)
                    except json.JSONDecodeError as e:
                        logger.warning(f"Invalid JSON from server: {e}")

            except Exception as e:
                if self._running:
                    logger.error(f"Read error: {e}")
                break

    def _handle_message(self, msg: dict[str, Any]) -> None:
        """Handle an incoming JSON-RPC message."""
        msg_id = msg.get("id")

        if msg_id is not None:
            # Response to a request
            with self._lock:
                if msg_id in self._pending:
                    self._responses[msg_id] = msg
                    self._pending[msg_id].set()

    def _send_request(self, method: str, params: dict[str, Any] | None = None) -> CallResult:
        """Send request and wait for response."""
        if not self._process or not self._process.stdin:
            raise MCPConnectionError("Not connected")

        request_id = self._next_id()
        request = {
            "jsonrpc": "2.0",
            "id": request_id,
            "method": method,
        }
        if params is not None:
            request["params"] = params

        # Serialize
        request_bytes = (json.dumps(request) + "\n").encode("utf-8")

        # Prepare to wait
        event = threading.Event()
        with self._lock:
            self._pending[request_id] = event

        # Record start time
        start_time = time.perf_counter()
        timestamp = time.time()

        # Send
        try:
            self._process.stdin.write(request_bytes)
            self._process.stdin.flush()
        except (BrokenPipeError, OSError) as e:
            with self._lock:
                del self._pending[request_id]
            raise MCPConnectionError(f"Write failed: {e}") from e

        # Wait for response
        timeout_sec = self.timeout_ms / 1000.0
        if not event.wait(timeout=timeout_sec):
            with self._lock:
                del self._pending[request_id]
            raise MCPTimeoutError(f"Request {method} timed out after {self.timeout_ms}ms")

        # Get response
        with self._lock:
            response = self._responses.pop(request_id, None)
            del self._pending[request_id]

        end_time = time.perf_counter()
        latency_ms = (end_time - start_time) * 1000

        if response is None:
            raise MCPProtocolError("No response received")

        response_bytes = len(json.dumps(response).encode("utf-8"))

        # Build result
        if "error" in response:
            result = CallResult(
                success=False,
                error=response["error"],
                latency_ms=latency_ms,
                request_bytes=len(request_bytes),
                response_bytes=response_bytes,
            )
        else:
            result = CallResult(
                success=True,
                result=response.get("result"),
                latency_ms=latency_ms,
                request_bytes=len(request_bytes),
                response_bytes=response_bytes,
            )

        # Record transcript
        entry = TranscriptEntry(
            request_id=request_id,
            method=method,
            params=params,
            result=result.result if result.success else None,
            error=result.error,
            latency_ms=latency_ms,
            timestamp=timestamp,
        )
        self._record(entry)

        return result

    @property
    def is_alive(self) -> bool:
        """Check if process is still running."""
        if self._process is None:
            return False
        return self._process.poll() is None

    def get_stderr(self) -> str:
        """Get any stderr output (for debugging)."""
        if self._process and self._process.stderr:
            try:
                # Non-blocking read of available stderr
                import select
                if sys.platform != "win32":
                    ready, _, _ = select.select([self._process.stderr], [], [], 0)
                    if ready:
                        return self._process.stderr.read().decode("utf-8", errors="replace")
                return ""
            except Exception:
                return ""
        return ""


# =============================================================================
# Client Factory
# =============================================================================

def create_client(
    transport: str,
    command: str | None = None,
    args: list[str] | None = None,
    cwd: str | None = None,
    url: str | None = None,
    env: dict[str, str] | None = None,
    timeout_ms: int = 30000,
) -> MCPClient:
    """Create an MCP client for the given transport."""
    if transport == "stdio":
        if not command:
            raise ValueError("stdio transport requires command")
        return StdioClient(
            command=command,
            args=args,
            cwd=cwd,
            env=env,
            timeout_ms=timeout_ms,
        )
    elif transport in ("http", "http_sse"):
        raise NotImplementedError(f"Transport {transport} not yet implemented")
    else:
        raise ValueError(f"Unknown transport: {transport}")
