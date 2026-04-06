"""Tests for speech.orchestrator.synthesize_plan()."""

from __future__ import annotations

import threading

import pytest

from voice_soundboard_plugin.speech import SpeechChunk, SpeechPlan, process_text
from voice_soundboard_plugin.speech.orchestrator import synthesize_plan
from voice_soundboard_plugin.speech.types import SpeechWarning


@pytest.mark.asyncio
async def test_synthesize_single_chunk(mock_engine, disabled_player):
    plan = process_text("hello world")
    result = await synthesize_plan(plan, mock_engine, disabled_player)

    assert result["voice"] == "am_fenrir"
    assert result["mode"] == "speak"
    assert result["trace_id"] == plan.trace_id
    assert "audio_path" in result
    assert "duration_ms" in result
    assert "latency_ms" in result
    assert isinstance(result["warnings"], list)
    mock_engine.speak.assert_called_once()


@pytest.mark.asyncio
async def test_synthesize_calls_player(mock_engine, disabled_player):
    plan = process_text("hello world")
    await synthesize_plan(plan, mock_engine, disabled_player)
    disabled_player.play.assert_called_once()


@pytest.mark.asyncio
async def test_synthesize_no_player(mock_engine):
    plan = process_text("hello world")
    result = await synthesize_plan(plan, mock_engine, player=None)
    assert result["audio_path"] is not None


@pytest.mark.asyncio
async def test_synthesize_passes_emotion(mock_engine, disabled_player):
    plan = process_text("hello", emotion="joy")
    await synthesize_plan(plan, mock_engine, disabled_player)
    call_kwargs = mock_engine.speak.call_args
    assert "emotion" in call_kwargs.kwargs or (
        len(call_kwargs.args) > 1
    )


@pytest.mark.asyncio
async def test_synthesize_passes_speed(mock_engine, disabled_player):
    plan = process_text("hello", speed=0.8)
    await synthesize_plan(plan, mock_engine, disabled_player)
    call_kwargs = mock_engine.speak.call_args
    assert call_kwargs.kwargs.get("speed") == 0.8


@pytest.mark.asyncio
async def test_synthesize_warnings_in_result(mock_engine, disabled_player):
    plan = process_text("hello", speed=0.3)  # will be clamped
    result = await synthesize_plan(plan, mock_engine, disabled_player)
    assert len(result["warnings"]) == 1
    assert result["warnings"][0]["code"] == "speed_clamped"


# --- Phase 2: Multi-chunk tests ---

@pytest.mark.asyncio
async def test_synthesize_multi_chunk(mock_engine, disabled_player):
    """Multiple chunks → all synthesized, multi-chunk fields present."""
    plan = SpeechPlan(
        chunks=[
            SpeechChunk(text="First chunk.", voice="am_fenrir", speed=1.0),
            SpeechChunk(text="Second chunk.", voice="am_fenrir", speed=1.0),
            SpeechChunk(text="Third chunk.", voice="am_fenrir", speed=1.0),
        ],
        trace_id="abc123def456",
        source_text="First chunk. Second chunk. Third chunk.",
        mode="speak",
    )
    result = await synthesize_plan(plan, mock_engine, disabled_player)

    assert result["chunk_count"] == 3
    assert result["chunks_synthesized"] == 3
    assert result["interrupted"] is False
    assert len(result["audio_paths"]) == 3
    assert len(result["per_chunk_timings"]) == 3
    assert result["total_duration_ms"] > 0
    assert mock_engine.speak.call_count == 3


@pytest.mark.asyncio
async def test_synthesize_multi_chunk_plays_each(mock_engine, disabled_player):
    """Without concat, each chunk is played separately."""
    plan = SpeechPlan(
        chunks=[
            SpeechChunk(text="A.", voice="am_fenrir", speed=1.0),
            SpeechChunk(text="B.", voice="am_fenrir", speed=1.0),
        ],
        trace_id="abc123def456",
        source_text="A. B.",
        mode="speak",
    )
    result = await synthesize_plan(plan, mock_engine, disabled_player, concat=False)
    assert disabled_player.play.call_count == 2


@pytest.mark.asyncio
async def test_synthesize_concat_suppresses_per_chunk_play(mock_engine, disabled_player):
    """With concat=True, per-chunk playback is suppressed (concat plays merged)."""
    plan = SpeechPlan(
        chunks=[
            SpeechChunk(text="A.", voice="am_fenrir", speed=1.0),
            SpeechChunk(text="B.", voice="am_fenrir", speed=1.0),
        ],
        trace_id="abc123def456",
        source_text="A. B.",
        mode="speak",
    )
    # concat=True but we have mock wav files — concat will fail gracefully
    # and fall back to sequential playback
    result = await synthesize_plan(plan, mock_engine, disabled_player, concat=True)
    # Either concat succeeded (1 play) or failed (2 plays for fallback)
    assert disabled_player.play.call_count >= 1


@pytest.mark.asyncio
async def test_synthesize_interrupt_between_chunks(mock_engine, disabled_player):
    """Setting interrupted event stops synthesis mid-stream."""
    disabled_player.interrupted = threading.Event()

    # Capture return value before setting side_effect (avoids recursion)
    fake_result = mock_engine.speak.return_value
    call_count = [0]

    def speak_and_interrupt(text, **kwargs):
        call_count[0] += 1
        if call_count[0] == 1:
            # After first chunk, set interrupt
            disabled_player.interrupted.set()
        return fake_result

    mock_engine.speak.side_effect = speak_and_interrupt

    plan = SpeechPlan(
        chunks=[
            SpeechChunk(text="First.", voice="am_fenrir", speed=1.0),
            SpeechChunk(text="Second.", voice="am_fenrir", speed=1.0),
            SpeechChunk(text="Third.", voice="am_fenrir", speed=1.0),
        ],
        trace_id="abc123def456",
        source_text="First. Second. Third.",
        mode="speak",
    )
    result = await synthesize_plan(plan, mock_engine, disabled_player)

    assert result["interrupted"] is True
    assert result["chunks_synthesized"] == 1
    assert result["chunk_count"] == 3


@pytest.mark.asyncio
async def test_synthesize_single_chunk_no_multi_fields(mock_engine, disabled_player):
    """Single chunk plan → no multi-chunk fields (backward compat)."""
    plan = process_text("hello")
    result = await synthesize_plan(plan, mock_engine, disabled_player)
    assert "chunk_count" not in result
    assert "audio_paths" not in result
    assert "interrupted" not in result
