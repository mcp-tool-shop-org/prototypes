"""Tests for speech.pipeline.process_text()."""

from __future__ import annotations

import re

import pytest

from voice_soundboard_plugin.speech import VoiceRejectedError, process_text


def test_default_voice():
    plan = process_text("hello")
    assert plan.chunks[0].voice == "am_fenrir"
    assert plan.mode == "speak"


def test_explicit_approved_voice():
    plan = process_text("hello", voice="bf_emma")
    assert plan.chunks[0].voice == "bf_emma"


def test_preset_resolves_to_voice():
    plan = process_text("hello", voice="announcer")
    assert plan.chunks[0].voice == "am_eric"


def test_invalid_voice_raises():
    with pytest.raises(VoiceRejectedError) as exc_info:
        process_text("hello", voice="am_michael")
    assert "am_michael" in str(exc_info.value)
    assert exc_info.value.voice == "am_michael"


def test_speed_clamping_low():
    plan = process_text("hello", speed=0.3)
    assert plan.chunks[0].speed == 0.5
    assert any(w.code == "speed_clamped" for w in plan.warnings)


def test_speed_clamping_high():
    plan = process_text("hello", speed=3.0)
    assert plan.chunks[0].speed == 2.0
    assert plan.warnings[0].code == "speed_clamped"


def test_normal_speed_no_warning():
    plan = process_text("hello", speed=1.0)
    assert plan.chunks[0].speed == 1.0
    # No speed warning (may have chunking warning)
    assert not any(w.code == "speed_clamped" for w in plan.warnings)


def test_text_truncation():
    long_text = "x" * 20_000
    plan = process_text(long_text, chunking="off")
    assert len(plan.chunks[0].text) == 10_000
    assert any(w.code == "text_truncated" for w in plan.warnings)


def test_trace_id_format():
    plan = process_text("hello")
    assert len(plan.trace_id) == 12
    assert re.fullmatch(r"[0-9a-f]{12}", plan.trace_id)


def test_mode_passthrough():
    plan = process_text("hello", mode="narrate")
    assert plan.mode == "narrate"


def test_emotion_passthrough():
    plan = process_text("hello", emotion="joy")
    assert plan.chunks[0].emotion == "joy"


# --- Phase 2: SSML + chunking integration ---

def test_ssml_format_parsed():
    """SSML input → flattened to plain text for engine."""
    plan = process_text(
        "<speak>Hello <break time='500ms'/> world</speak>",
        format="ssml",
    )
    # Should contain "Hello" and "world" (break → space)
    full_text = " ".join(c.text for c in plan.chunks)
    assert "Hello" in full_text
    assert "world" in full_text


def test_ssml_malformed_falls_back():
    """Malformed SSML → falls back to plain text + warning."""
    plan = process_text("<speak><break>bad", format="ssml")
    assert len(plan.chunks) >= 1
    codes = [w.code for w in plan.warnings]
    assert "ssml_parse_failed" in codes


def test_chunking_auto_splits_long_text():
    """Long text with auto chunking → multiple chunks."""
    paragraphs = ["This is paragraph number %d with enough text to matter." % i for i in range(10)]
    text = "\n\n".join(paragraphs)
    plan = process_text(text, chunking="auto", max_chunk_chars=100)
    assert len(plan.chunks) > 1


def test_chunking_off_single_chunk():
    """chunking='off' → single chunk regardless of length."""
    text = "Sentence one. " * 50
    plan = process_text(text, chunking="off")
    assert len(plan.chunks) == 1


def test_short_text_stays_single_chunk():
    """Short text with auto chunking → still single chunk."""
    plan = process_text("hello world")
    assert len(plan.chunks) == 1


def test_all_chunks_share_voice_and_speed():
    """All chunks in a plan share the same voice and speed."""
    text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph."
    plan = process_text(text, voice="bf_emma", speed=0.8, chunking="auto", max_chunk_chars=30)
    for chunk in plan.chunks:
        assert chunk.voice == "bf_emma"
        assert chunk.speed == 0.8
