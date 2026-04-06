"""Tests for emotion plan builder — EmotionSpan list to SpeechPlan."""

from __future__ import annotations

import pytest

from voice_soundboard_plugin.speech.emotion.plan_builder import (
    MANY_SPANS_THRESHOLD,
    build_emotion_plan,
)
from voice_soundboard_plugin.speech.emotion.parser import parse_emotion_spans
from voice_soundboard_plugin.speech.emotion.types import EmotionSpan
from voice_soundboard_plugin.speech.roster import APPROVED_VOICES


class TestBuildEmotionPlan:
    def test_single_span(self):
        spans = [EmotionSpan(text="Hello!", emotion="joy")]
        plan = build_emotion_plan(spans)
        assert len(plan.chunks) == 1
        assert plan.chunks[0].voice in APPROVED_VOICES
        assert plan.chunks[0].emotion == "joy"
        assert plan.mode == "speak"

    def test_multi_span_distinct_voices(self):
        spans = [
            EmotionSpan(text="Happy!", emotion="joy"),
            EmotionSpan(text="Serious.", emotion="serious"),
        ]
        plan = build_emotion_plan(spans)
        assert len(plan.chunks) == 2
        # Different emotions should generally produce different voices
        # (joy=friendly preset, serious=narrator preset)

    def test_empty_spans_skipped(self):
        spans = [
            EmotionSpan(text="  ", emotion="joy"),
            EmotionSpan(text="Actual text", emotion="neutral"),
        ]
        plan = build_emotion_plan(spans)
        assert len(plan.chunks) == 1
        assert plan.chunks[0].text == "Actual text"

    def test_base_voice_override(self):
        spans = [EmotionSpan(text="Test", emotion="joy")]
        plan = build_emotion_plan(spans, base_voice="am_fenrir")
        assert plan.chunks[0].voice == "am_fenrir"

    def test_many_spans_warning(self):
        spans = [EmotionSpan(text=f"Span {i}", emotion="neutral")
                 for i in range(MANY_SPANS_THRESHOLD + 5)]
        plan = build_emotion_plan(spans)
        codes = [w.code for w in plan.warnings]
        assert "many_spans" in codes

    def test_trace_id_format(self):
        spans = [EmotionSpan(text="Test", emotion="neutral")]
        plan = build_emotion_plan(spans)
        assert len(plan.trace_id) == 12
        assert plan.trace_id.isalnum()


class TestFullPipeline:
    """End-to-end: parse markup -> build plan."""

    def test_parse_then_build(self):
        text = "{joy}Hello! {whisper}Secret.{/whisper} Bye!{/joy}"
        spans, warnings = parse_emotion_spans(text)
        plan = build_emotion_plan(spans)
        assert len(plan.chunks) == 3
        assert plan.chunks[0].emotion == "joy"
        assert plan.chunks[1].emotion == "whisper"
        assert plan.chunks[2].emotion == "joy"

    @pytest.mark.asyncio
    async def test_synthesize_emotion_plan(self, mock_engine, disabled_player, monkeypatch):
        """Full async pipeline: parse -> build -> synthesize."""
        from voice_soundboard_plugin.speech.orchestrator import synthesize_plan

        monkeypatch.setattr(
            "voice_soundboard_plugin.bridge.stdio_bridge._PLAYER", disabled_player
        )

        spans = [
            EmotionSpan(text="Happy!", emotion="joy"),
            EmotionSpan(text="Calm now.", emotion="calm"),
        ]
        plan = build_emotion_plan(spans)
        result = await synthesize_plan(plan, mock_engine, disabled_player, concat=True, concat_silence_ms=30)
        assert "error" not in result
        assert mock_engine.speak.call_count == 2
