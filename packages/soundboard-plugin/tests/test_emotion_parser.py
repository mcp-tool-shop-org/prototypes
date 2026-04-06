"""Tests for emotion span parser — {emotion}text{/emotion} markup."""

from __future__ import annotations

import pytest

from voice_soundboard_plugin.speech.emotion.parser import (
    has_emotion_spans,
    parse_emotion_spans,
)
from voice_soundboard_plugin.speech.emotion.types import (
    EMOTION_NAMES,
    MAX_EMOTION_NESTING,
    EmotionSpan,
)


class TestHasEmotionSpans:
    def test_simple_tag(self):
        assert has_emotion_spans("{joy}Hello!{/joy}")

    def test_nested_tags(self):
        assert has_emotion_spans("{joy}outer {whisper}inner{/whisper}{/joy}")

    def test_with_intensity(self):
        assert has_emotion_spans("{serious:0.8}text{/serious}")

    def test_plain_text_no_match(self):
        assert not has_emotion_spans("Just plain text")

    def test_unclosed_tag_no_match(self):
        assert not has_emotion_spans("{joy}no close tag")

    def test_empty_string(self):
        assert not has_emotion_spans("")

    def test_curly_braces_not_emotion(self):
        assert not has_emotion_spans("dict = {key: value}")


class TestParseEmotionSpans:
    def test_single_emotion(self):
        spans, warnings = parse_emotion_spans("{joy}Hello world!{/joy}")
        assert len(spans) == 1
        assert spans[0].emotion == "joy"
        assert spans[0].text == "Hello world!"
        assert spans[0].intensity == 1.0
        assert len(warnings) == 0

    def test_multiple_emotions(self):
        text = "{joy}Happy! {/joy}{serious}Serious now.{/serious}"
        spans, warnings = parse_emotion_spans(text)
        assert len(spans) == 2
        assert spans[0].emotion == "joy"
        assert spans[1].emotion == "serious"

    def test_nested_emotions(self):
        text = "{joy}Hello {whisper}secret{/whisper} world{/joy}"
        spans, warnings = parse_emotion_spans(text)
        assert len(spans) == 3
        assert spans[0].emotion == "joy"
        assert spans[0].text == "Hello "
        assert spans[1].emotion == "whisper"
        assert spans[1].text == "secret"
        assert spans[2].emotion == "joy"
        assert spans[2].text == " world"

    def test_intensity_parsing(self):
        spans, warnings = parse_emotion_spans("{serious:0.7}Important.{/serious}")
        assert len(spans) == 1
        assert spans[0].intensity == 0.7

    def test_intensity_clamped_max(self):
        spans, _ = parse_emotion_spans("{joy:2.5}Over max{/joy}")
        assert spans[0].intensity == 1.0

    def test_intensity_clamped_min(self):
        """Intensity 0.0 is allowed (minimum)."""
        spans, _ = parse_emotion_spans("{joy:0.0}Minimum{/joy}")
        assert spans[0].intensity == 0.0

    def test_unknown_emotion_downgraded(self):
        spans, warnings = parse_emotion_spans("{happiness}text{/happiness}")
        assert len(spans) == 1
        assert spans[0].emotion == "neutral"
        codes = [w.code for w in warnings]
        assert "emotion_unsupported" in codes

    def test_all_known_emotions(self):
        """Every known emotion parses without warnings."""
        for name in EMOTION_NAMES:
            spans, warnings = parse_emotion_spans(f"{{{name}}}test text{{{'/'+name}}}")
            assert len(spans) == 1
            assert spans[0].emotion == name
            assert len(warnings) == 0, f"Unexpected warning for emotion '{name}'"

    def test_malformed_mismatched_tags(self):
        """Mismatched tags fall back to plain text with warning."""
        spans, warnings = parse_emotion_spans("{joy}text{/whisper}")
        assert len(spans) == 1
        assert spans[0].emotion == "neutral"
        assert any(w.code == "emotion_parse_failed" for w in warnings)

    def test_malformed_unclosed_tag(self):
        """Unclosed tag falls back to plain text with warning."""
        spans, warnings = parse_emotion_spans("{joy}text without close")
        assert len(spans) == 1
        assert spans[0].emotion == "neutral"
        assert any(w.code == "emotion_parse_failed" for w in warnings)

    def test_plain_text_returns_neutral(self):
        spans, warnings = parse_emotion_spans("Just plain text")
        assert len(spans) == 1
        assert spans[0].emotion == "neutral"
        assert spans[0].text == "Just plain text"
        assert len(warnings) == 0

    def test_empty_input(self):
        spans, warnings = parse_emotion_spans("")
        assert len(spans) == 1
        assert spans[0].emotion == "neutral"

    def test_mixed_plain_and_emotion(self):
        text = "Before {joy}happy{/joy} after"
        spans, warnings = parse_emotion_spans(text)
        assert len(spans) == 3
        assert spans[0].emotion == "neutral"
        assert spans[0].text == "Before "
        assert spans[1].emotion == "joy"
        assert spans[2].emotion == "neutral"
        assert spans[2].text == " after"
