"""Tests for speech.debug.format_plan_debug()."""

from __future__ import annotations

from voice_soundboard_plugin.speech import SpeechChunk, SpeechPlan, SpeechWarning
from voice_soundboard_plugin.speech.debug import format_plan_debug


def test_format_plan_debug_structure():
    plan = SpeechPlan(
        chunks=[SpeechChunk(text="hello", voice="am_fenrir", speed=1.0)],
        warnings=[],
        trace_id="abc123def456",
        source_text="hello",
        mode="speak",
    )
    debug = format_plan_debug(plan)

    assert debug["trace_id"] == "abc123def456"
    assert debug["mode"] == "speak"
    assert debug["chunk_count"] == 1
    assert len(debug["chunks"]) == 1
    assert debug["chunks"][0]["voice"] == "am_fenrir"
    assert debug["chunks"][0]["text_len"] == 5
    assert debug["source_text_len"] == 5
    assert debug["warnings"] == []


def test_format_plan_debug_with_warnings():
    plan = SpeechPlan(
        chunks=[SpeechChunk(text="hi", voice="am_fenrir", speed=0.5)],
        warnings=[SpeechWarning(code="speed_clamped", message="clamped to 0.5")],
        trace_id="000000000000",
        source_text="hi",
        mode="narrate",
    )
    debug = format_plan_debug(plan)

    assert len(debug["warnings"]) == 1
    assert debug["warnings"][0]["code"] == "speed_clamped"
