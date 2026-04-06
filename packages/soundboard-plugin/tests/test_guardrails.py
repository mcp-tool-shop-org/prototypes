"""Tests for security guardrails — limits manifest, error format, concurrency, rate limiting."""

from __future__ import annotations

import asyncio
import time

import pytest

from voice_soundboard_plugin.security.guardrails import (
    ALL_LIMITS,
    CONTROL_TOOLS,
    ConcurrencyGate,
    ErrorCode,
    RateLimiter,
    SYNTHESIS_TOOLS,
    make_error,
)


class TestAllLimits:
    """ALL_LIMITS manifest contains all expected keys."""

    def test_has_text_limits(self):
        assert "MAX_TEXT_LENGTH" in ALL_LIMITS
        assert "MAX_CHUNKS" in ALL_LIMITS

    def test_has_ssml_limits(self):
        assert "MAX_SSML_INPUT_CHARS" in ALL_LIMITS
        assert "MAX_SSML_NODES" in ALL_LIMITS
        assert "MAX_NESTING_DEPTH" in ALL_LIMITS
        assert "MAX_BREAK_DURATION_MS" in ALL_LIMITS

    def test_has_emotion_limits(self):
        assert "MAX_EMOTION_SPANS" in ALL_LIMITS
        assert "MAX_EMOTION_NESTING" in ALL_LIMITS

    def test_has_dialogue_limits(self):
        assert "MAX_DIALOGUE_LINES" in ALL_LIMITS
        assert "MAX_LINE_CHARS" in ALL_LIMITS
        assert "MAX_PAUSES" in ALL_LIMITS

    def test_has_sfx_limits(self):
        assert "MAX_SFX_PER_REQUEST" in ALL_LIMITS

    def test_has_server_limits(self):
        assert "MAX_CONCURRENT_SYNTH" in ALL_LIMITS
        assert "MAX_RESPONSE_SIZE_BYTES" in ALL_LIMITS

    def test_all_values_are_numeric(self):
        for key, value in ALL_LIMITS.items():
            assert isinstance(value, (int, float)), f"{key} = {value!r} is not numeric"


class TestMakeError:
    """Structured error format."""

    def test_format(self):
        err = make_error("CODE", "Something failed", "trace123")
        assert err["ok"] is False
        assert err["error"]["code"] == "CODE"
        assert err["error"]["message"] == "Something failed"
        assert err["error"]["trace_id"] == "trace123"

    def test_empty_trace_id(self):
        err = make_error("CODE", "msg")
        assert err["error"]["trace_id"] == ""


class TestErrorCode:
    """ErrorCode attributes are non-empty strings."""

    def test_all_codes_are_strings(self):
        codes = [
            ErrorCode.INTERNAL_ERROR,
            ErrorCode.ENGINE_UNAVAILABLE,
            ErrorCode.VOICE_REJECTED,
            ErrorCode.LIMIT_EXCEEDED,
            ErrorCode.RATE_LIMITED,
            ErrorCode.CAST_ERROR,
            ErrorCode.PARSE_ERROR,
            ErrorCode.PATH_NOT_ALLOWED,
            ErrorCode.BUSY,
        ]
        for code in codes:
            assert isinstance(code, str) and len(code) > 0


class TestToolSets:
    """Tool classification sets."""

    def test_synthesis_tools(self):
        assert "voice.speak" in SYNTHESIS_TOOLS
        assert "voice.narrate" in SYNTHESIS_TOOLS
        assert "voice.dialogue" in SYNTHESIS_TOOLS
        assert "voice.workflow_notify" in SYNTHESIS_TOOLS

    def test_control_tools(self):
        assert "voice.status" in CONTROL_TOOLS
        assert "voice.list_voices" in CONTROL_TOOLS
        assert "voice.interrupt" in CONTROL_TOOLS
        assert "voice.playback_diagnose" in CONTROL_TOOLS

    def test_no_overlap(self):
        assert SYNTHESIS_TOOLS.isdisjoint(CONTROL_TOOLS)


class TestRateLimiter:
    """Simple per-tool rate limiter."""

    def test_allows_first_call(self, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_RATE_COOLDOWN_MS", "1000")
        limiter = RateLimiter()
        allowed, wait = limiter.check("voice.speak")
        assert allowed
        assert wait == 0

    def test_rejects_rapid_call(self, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_RATE_COOLDOWN_MS", "1000")
        limiter = RateLimiter()
        limiter.record("voice.speak")
        allowed, wait = limiter.check("voice.speak")
        assert not allowed
        assert wait > 0

    def test_disabled_by_default(self, monkeypatch):
        monkeypatch.delenv("VOICE_SOUNDBOARD_RATE_COOLDOWN_MS", raising=False)
        limiter = RateLimiter()
        limiter.record("voice.speak")
        allowed, wait = limiter.check("voice.speak")
        assert allowed


class TestConcurrencyGate:
    """asyncio.Semaphore-based synthesis serialization."""

    @pytest.mark.asyncio
    async def test_control_tools_bypass(self):
        gate = ConcurrencyGate(max_concurrent=1)
        assert await gate.acquire("voice.status") is True
        assert await gate.acquire("voice.interrupt") is True

    @pytest.mark.asyncio
    async def test_blocks_second_synthesis(self):
        gate = ConcurrencyGate(max_concurrent=1)
        assert await gate.acquire("voice.speak") is True
        # Second synthesis should fail (non-blocking)
        assert await gate.acquire("voice.narrate") is False
        gate.release("voice.speak")

    @pytest.mark.asyncio
    async def test_allows_after_release(self):
        gate = ConcurrencyGate(max_concurrent=1)
        assert await gate.acquire("voice.speak") is True
        gate.release("voice.speak")
        assert await gate.acquire("voice.narrate") is True
        gate.release("voice.narrate")
