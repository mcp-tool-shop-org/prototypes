"""Golden behavior tests — verify output shapes match expected contracts.

These tests mock the engine but exercise the full pipeline path
(process_text → synthesize_plan) to ensure behavior preservation.
"""

from __future__ import annotations

import pytest

from voice_soundboard_plugin.speech import VoiceRejectedError, process_text
from voice_soundboard_plugin.speech.orchestrator import synthesize_plan
from voice_soundboard_plugin.speech.types import SpeechChunk, SpeechPlan


@pytest.mark.asyncio
async def test_golden_speak_default(mock_engine, disabled_player):
    """voice.speak with no args → Fenrir, mode=speak, trace_id present."""
    plan = process_text("Hello there")
    result = await synthesize_plan(plan, mock_engine, disabled_player)

    assert result["voice"] == "am_fenrir"
    assert result["mode"] == "speak"
    assert len(result["trace_id"]) == 12
    assert result["audio_path"] is not None
    assert isinstance(result["warnings"], list)
    assert "duration_ms" in result
    assert "latency_ms" in result


@pytest.mark.asyncio
async def test_golden_narrate(mock_engine, disabled_player):
    """voice.narrate → mode=narrate, narrate-specific fields possible."""
    plan = process_text("This function iterates over items", mode="narrate", speed=0.95)
    result = await synthesize_plan(plan, mock_engine, disabled_player)

    assert result["mode"] == "narrate"
    assert result["voice"] == "am_fenrir"
    assert result["trace_id"]


@pytest.mark.asyncio
async def test_golden_workflow_notify(mock_engine, disabled_player):
    """voice.workflow_notify → mode=notification, workflow fields enriched by caller."""
    plan = process_text(
        "All 47 tests passed",
        voice="am_eric",
        speed=1.1,
        emotion="joy",
        mode="notification",
        context="workflow:tests_pass",
    )
    result = await synthesize_plan(plan, mock_engine, disabled_player)

    assert result["mode"] == "notification"
    assert result["voice"] == "am_eric"
    assert result["emotion"] == "joy"
    assert result["trace_id"]


def test_golden_voice_rejection():
    """Cut voice produces VoiceRejectedError."""
    with pytest.raises(VoiceRejectedError):
        process_text("hello", voice="am_michael")


@pytest.mark.asyncio
async def test_golden_all_results_have_trace_and_warnings(mock_engine, disabled_player):
    """Every result from synthesize_plan has trace_id and warnings list."""
    for mode in ("speak", "narrate", "notification"):
        plan = process_text("test", mode=mode)
        result = await synthesize_plan(plan, mock_engine, disabled_player)
        assert "trace_id" in result
        assert isinstance(result["warnings"], list)


# --- Phase 2: SSML + chunking golden tests ---

@pytest.mark.asyncio
async def test_golden_ssml_speak(mock_engine, disabled_player):
    """SSML input through full pipeline → synthesized correctly."""
    plan = process_text(
        "<speak>Hello <break time='200ms'/> world</speak>",
        format="ssml",
    )
    result = await synthesize_plan(plan, mock_engine, disabled_player)
    assert result["audio_path"] is not None
    assert result["voice"] == "am_fenrir"


@pytest.mark.asyncio
async def test_golden_long_text_chunked(mock_engine, disabled_player):
    """Long text → auto-chunked → multi-chunk synthesis."""
    paragraphs = [f"This is paragraph {i} with enough content." for i in range(10)]
    text = "\n\n".join(paragraphs)
    plan = process_text(text, chunking="auto", max_chunk_chars=80)

    assert len(plan.chunks) > 1

    result = await synthesize_plan(plan, mock_engine, disabled_player)
    assert result["chunk_count"] == len(plan.chunks)
    assert result["chunks_synthesized"] == len(plan.chunks)
    assert result["interrupted"] is False
    assert len(result["audio_paths"]) == len(plan.chunks)


@pytest.mark.asyncio
async def test_golden_narrate_with_chunking(mock_engine, disabled_player):
    """Narration with long text → auto-chunked."""
    paragraphs = [f"Narration segment {i} explaining the code." for i in range(8)]
    text = "\n\n".join(paragraphs)
    plan = process_text(text, mode="narrate", chunking="auto", max_chunk_chars=80)

    assert len(plan.chunks) > 1
    assert plan.mode == "narrate"

    result = await synthesize_plan(plan, mock_engine, disabled_player)
    assert result["mode"] == "narrate"
    assert result["chunk_count"] > 1


# --- Phase 5: Schema stability + emotion enforcement ---


@pytest.mark.asyncio
async def test_golden_speak_response_keys(mock_engine, disabled_player):
    """voice.speak response contains all required top-level keys."""
    plan = process_text("Hello world")
    result = await synthesize_plan(plan, mock_engine, disabled_player)
    required_keys = {
        "audio_path", "duration_ms", "text", "voice", "speed",
        "emotion", "latency_ms", "mode", "trace_id", "warnings",
    }
    assert required_keys.issubset(result.keys())


@pytest.mark.asyncio
async def test_golden_dialogue_response_keys(mock_engine, disabled_player):
    """Dialogue plan → result has all base keys."""
    plan = SpeechPlan(
        chunks=[
            SpeechChunk(text="Hello", voice="am_fenrir", speed=1.0, context="dialogue:Alice"),
            SpeechChunk(text="Hi there", voice="am_liam", speed=1.0, context="dialogue:Bob"),
        ],
        trace_id="golden123456",
        source_text="Alice: Hello\nBob: Hi there",
        mode="dialogue",
    )
    result = await synthesize_plan(plan, mock_engine, disabled_player)
    required_keys = {
        "audio_path", "duration_ms", "text", "voice", "speed",
        "latency_ms", "mode", "trace_id", "warnings",
    }
    assert required_keys.issubset(result.keys())
    assert result["mode"] == "dialogue"


def test_golden_emotion_names_exactly_8():
    """Emotion set is locked to exactly 8 names."""
    from voice_soundboard_plugin.speech.emotion.types import EMOTION_NAMES

    assert len(EMOTION_NAMES) == 8
    assert EMOTION_NAMES == frozenset({
        "neutral", "serious", "friendly", "professional",
        "calm", "joy", "urgent", "whisper",
    })
