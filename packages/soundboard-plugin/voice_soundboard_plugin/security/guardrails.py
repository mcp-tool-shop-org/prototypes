"""Centralized guardrails — re-exports all limits, adds concurrency + rate controls.

Import from here for a single view of all security limits:
    from voice_soundboard_plugin.security.guardrails import ALL_LIMITS

Limits stay defined at point-of-use in their source modules. This module
re-exports them for discoverability and adds server-level controls
(concurrency gate, rate limiter, structured error format).

Env vars:
    VOICE_SOUNDBOARD_RATE_COOLDOWN_MS — minimum ms between tool calls (default: 0, disabled)
"""

from __future__ import annotations

import asyncio
import os
import time

# Re-export existing limits from source modules
from voice_soundboard_plugin.speech.limits import (
    MAX_TEXT_LENGTH,
    MAX_CHUNKS,
    SPEED_MIN,
    SPEED_MAX,
)
from voice_soundboard_plugin.speech.ssml_lite import (
    MAX_SSML_INPUT_CHARS,
    MAX_SSML_NODES,
    MAX_BREAK_DURATION_MS,
    MAX_NESTING_DEPTH,
)
from voice_soundboard_plugin.speech.emotion.types import (
    MAX_EMOTION_SPANS,
    MAX_EMOTION_NESTING,
)
from voice_soundboard_plugin.speech.dialogue.types import (
    MAX_DIALOGUE_LINES,
    MAX_LINE_CHARS,
    MAX_PAUSES,
    MAX_PAUSE_MS,
)
from voice_soundboard_plugin.audio.sfx import MAX_SFX_PER_REQUEST

# ---------------------------------------------------------------------------
# New server-level limits
# ---------------------------------------------------------------------------

MAX_CONCURRENT_SYNTH = 1
DEFAULT_RATE_COOLDOWN_MS = 0  # disabled by default
MAX_RESPONSE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB per WAV chunk

# ---------------------------------------------------------------------------
# Tool classification
# ---------------------------------------------------------------------------

SYNTHESIS_TOOLS = frozenset({
    "voice.speak",
    "voice.narrate",
    "voice.workflow_notify",
    "voice.dialogue",
    "voice.inner_monologue",
})

CONTROL_TOOLS = frozenset({
    "voice.status",
    "voice.list_voices",
    "voice.interrupt",
    "voice.playback_diagnose",
    "voice.ambient_enable",
    "voice.ambient_mute",
})

# ---------------------------------------------------------------------------
# Error codes
# ---------------------------------------------------------------------------


class ErrorCode:
    """Stable error codes for structured error responses."""

    INTERNAL_ERROR = "INTERNAL_ERROR"
    ENGINE_UNAVAILABLE = "ENGINE_UNAVAILABLE"
    VOICE_REJECTED = "VOICE_REJECTED"
    LIMIT_EXCEEDED = "LIMIT_EXCEEDED"
    RATE_LIMITED = "RATE_LIMITED"
    CAST_ERROR = "CAST_ERROR"
    PARSE_ERROR = "PARSE_ERROR"
    PATH_NOT_ALLOWED = "PATH_NOT_ALLOWED"
    BUSY = "BUSY"


def make_error(code: str, message: str, trace_id: str = "") -> dict:
    """Build a structured error response dict."""
    return {
        "ok": False,
        "error": {
            "code": code,
            "message": message,
            "trace_id": trace_id,
        },
    }


# ---------------------------------------------------------------------------
# ALL_LIMITS manifest (for status endpoint / docs)
# ---------------------------------------------------------------------------

ALL_LIMITS: dict[str, int | float] = {
    "MAX_TEXT_LENGTH": MAX_TEXT_LENGTH,
    "MAX_CHUNKS": MAX_CHUNKS,
    "SPEED_MIN": SPEED_MIN,
    "SPEED_MAX": SPEED_MAX,
    "MAX_SSML_INPUT_CHARS": MAX_SSML_INPUT_CHARS,
    "MAX_SSML_NODES": MAX_SSML_NODES,
    "MAX_BREAK_DURATION_MS": MAX_BREAK_DURATION_MS,
    "MAX_NESTING_DEPTH": MAX_NESTING_DEPTH,
    "MAX_EMOTION_SPANS": MAX_EMOTION_SPANS,
    "MAX_EMOTION_NESTING": MAX_EMOTION_NESTING,
    "MAX_DIALOGUE_LINES": MAX_DIALOGUE_LINES,
    "MAX_LINE_CHARS": MAX_LINE_CHARS,
    "MAX_PAUSES": MAX_PAUSES,
    "MAX_PAUSE_MS": MAX_PAUSE_MS,
    "MAX_SFX_PER_REQUEST": MAX_SFX_PER_REQUEST,
    "MAX_CONCURRENT_SYNTH": MAX_CONCURRENT_SYNTH,
    "MAX_RESPONSE_SIZE_BYTES": MAX_RESPONSE_SIZE_BYTES,
}

# ---------------------------------------------------------------------------
# Env helper
# ---------------------------------------------------------------------------


def _int_env(name: str, default: int) -> int:
    v = os.environ.get(name, "").strip()
    return int(v) if v.isdigit() else default


def get_rate_cooldown_ms() -> int:
    """Get rate cooldown from env, defaulting to 0 (disabled)."""
    return _int_env("VOICE_SOUNDBOARD_RATE_COOLDOWN_MS", DEFAULT_RATE_COOLDOWN_MS)


# ---------------------------------------------------------------------------
# ConcurrencyGate
# ---------------------------------------------------------------------------


class ConcurrencyGate:
    """asyncio.Semaphore wrapper — serializes synthesis tool calls.

    Control tools (status, interrupt, etc.) always bypass the gate.
    """

    def __init__(self, max_concurrent: int = MAX_CONCURRENT_SYNTH):
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._max = max_concurrent

    async def acquire(self, tool_name: str) -> bool:
        """Try to acquire the gate. Returns False if busy (non-blocking)."""
        if tool_name not in SYNTHESIS_TOOLS:
            return True
        if self._semaphore._value <= 0:
            return False
        await self._semaphore.acquire()
        return True

    def release(self, tool_name: str) -> None:
        """Release the gate (only for synthesis tools)."""
        if tool_name in SYNTHESIS_TOOLS:
            self._semaphore.release()


# ---------------------------------------------------------------------------
# RateLimiter
# ---------------------------------------------------------------------------


class RateLimiter:
    """Simple per-tool timestamp-based rate limiter.

    If VOICE_SOUNDBOARD_RATE_COOLDOWN_MS > 0, rejects tool calls that arrive
    before the cooldown period has elapsed since the last call to that tool.
    """

    def __init__(self):
        self._last_call: dict[str, float] = {}

    def check(self, tool_name: str) -> tuple[bool, int]:
        """Check if a call is allowed. Returns (allowed, wait_ms)."""
        cooldown_ms = get_rate_cooldown_ms()
        if cooldown_ms <= 0:
            return True, 0

        now = time.time()
        last = self._last_call.get(tool_name, 0.0)
        elapsed_ms = (now - last) * 1000

        if elapsed_ms < cooldown_ms:
            return False, int(cooldown_ms - elapsed_ms)

        return True, 0

    def record(self, tool_name: str) -> None:
        """Record a successful call timestamp."""
        self._last_call[tool_name] = time.time()
