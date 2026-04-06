"""Malicious input battery — adversarial test cases for Phase S security.

Every test verifies that adversarial inputs are handled gracefully:
no crashes, no path escapes, no resource exhaustion. All limits should
produce warnings or fallback behavior, never exceptions.
"""

from __future__ import annotations

import pytest

from voice_soundboard_plugin.speech.limits import MAX_TEXT_LENGTH, truncate_text
from voice_soundboard_plugin.speech.ssml_lite import MAX_SSML_INPUT_CHARS, parse_ssml
from voice_soundboard_plugin.speech.emotion.parser import parse_emotion_spans
from voice_soundboard_plugin.speech.emotion.types import MAX_EMOTION_SPANS
from voice_soundboard_plugin.speech.dialogue.parser import parse_dialogue
from voice_soundboard_plugin.speech.dialogue.types import (
    DialogueParseError,
    MAX_DIALOGUE_LINES,
    MAX_LINE_CHARS,
    MAX_PAUSES,
)
from voice_soundboard_plugin.audio.sfx import MAX_SFX_PER_REQUEST
from voice_soundboard_plugin.speech.sfx_parser import SfxMarker, parse_sfx_tags
from voice_soundboard_plugin.security.fs_sandbox import safe_path
from voice_soundboard_plugin.security.guardrails import ErrorCode, make_error
from voice_soundboard_plugin.security.wav_validator import validate_wav


# ---------------------------------------------------------------------------
# T1: Input overflow
# ---------------------------------------------------------------------------


class TestOversizedText:
    """Mega text inputs are truncated, not crashed on."""

    def test_100k_chars_truncated(self):
        text = "A" * 100_000
        result, warning = truncate_text(text)
        assert len(result) == MAX_TEXT_LENGTH
        assert warning is not None
        assert warning.code == "text_truncated"

    def test_mega_ssml_truncated(self):
        ssml = "<speak>" + "Hello " * 50_000 + "</speak>"
        nodes, warnings = parse_ssml(ssml)
        assert nodes  # at least one node produced
        codes = {w.code for w in warnings}
        assert "ssml_truncated" in codes or "ssml_parse_failed" in codes


# ---------------------------------------------------------------------------
# T1: SSML bombs
# ---------------------------------------------------------------------------


class TestSSMLBombs:
    """Deeply nested or pathological SSML inputs."""

    def test_deeply_nested_prosody(self):
        """20 levels deep exceeds MAX_NESTING_DEPTH (10) -> fallback."""
        text = "<prosody rate='slow'>" * 20 + "text" + "</prosody>" * 20
        nodes, warnings = parse_ssml(text)
        assert nodes  # should produce at least plain text

    def test_many_break_nodes(self):
        """500 break nodes exceeds MAX_SSML_NODES (200) -> fallback."""
        text = "<break time='1ms'/>" * 500
        nodes, warnings = parse_ssml(text)
        assert nodes

    def test_unsupported_script_tag(self):
        """<script> is not in SSML allowlist -> warned or stripped."""
        text = "<script>alert(1)</script>Hello"
        nodes, warnings = parse_ssml(text)
        assert nodes

    def test_xxe_entity_rejected(self):
        """XML external entity -> parse failure -> fallback."""
        text = '<!DOCTYPE foo [<!ENTITY xxe "pwned">]><speak>&xxe;</speak>'
        nodes, warnings = parse_ssml(text)
        codes = {w.code for w in warnings}
        assert "ssml_parse_failed" in codes


# ---------------------------------------------------------------------------
# T1: Emotion bombs
# ---------------------------------------------------------------------------


class TestEmotionBombs:
    """Abusive emotion markup."""

    def test_deep_nesting(self):
        """Exceed MAX_EMOTION_NESTING (4) -> fallback."""
        text = "{joy}" * 10 + "text" + "{/joy}" * 10
        spans, warnings = parse_emotion_spans(text)
        assert spans  # should produce at least one span
        # Either falls back or warns
        assert len(spans) >= 1

    def test_many_spans(self):
        """Exceed MAX_EMOTION_SPANS (100) -> capped."""
        text = "".join(f"{{joy}}word{i}{{/joy}} " for i in range(200))
        spans, warnings = parse_emotion_spans(text)
        # Capped at MAX + possible overflow span
        assert len(spans) <= MAX_EMOTION_SPANS + 2

    def test_unclosed_tags_fallback(self):
        """Unclosed emotion tags -> fallback to plain text."""
        text = "{joy}this is never closed"
        spans, warnings = parse_emotion_spans(text)
        assert spans
        # Should produce plain text fallback
        assert any("parse" in w.code for w in warnings)

    def test_mismatched_tags_fallback(self):
        """Mismatched open/close tags -> fallback."""
        text = "{joy}hello{/whisper}"
        spans, warnings = parse_emotion_spans(text)
        assert spans
        assert any("parse" in w.code for w in warnings)


# ---------------------------------------------------------------------------
# T1: Dialogue bombs
# ---------------------------------------------------------------------------


class TestDialogueBombs:
    """Abusive dialogue scripts."""

    def test_too_many_lines(self):
        """200 lines exceeds MAX_DIALOGUE_LINES (100) -> error or truncate."""
        lines = "\n".join(f"Speaker{i}: Line {i}" for i in range(200))
        try:
            script = parse_dialogue(lines)
            assert len(script.lines) <= MAX_DIALOGUE_LINES
        except DialogueParseError:
            pass  # also acceptable

    def test_very_long_line(self):
        """5000-char line exceeds MAX_LINE_CHARS (1000) -> truncated."""
        script_text = f"Alice: {'A' * 5000}"
        try:
            script = parse_dialogue(script_text)
            assert len(script.lines[0].text) <= MAX_LINE_CHARS
        except DialogueParseError:
            pass

    def test_many_pauses(self):
        """100 pauses exceeds MAX_PAUSES (50) -> error."""
        parts = []
        for i in range(100):
            parts.append("[pause 100ms]")
            parts.append(f"A: line {i}")
        try:
            script = parse_dialogue("\n".join(parts))
            assert len(script.pauses) <= MAX_PAUSES
        except DialogueParseError:
            pass  # error on too many pauses is fine


# ---------------------------------------------------------------------------
# T1: SFX spam
# ---------------------------------------------------------------------------


class TestSfxSpam:
    """SFX tag flooding."""

    def test_100_ding_tags_capped(self):
        """100 [ding] tags -> capped at MAX_SFX_PER_REQUEST (30)."""
        text = " ".join("[ding]" for _ in range(100))
        tokens, warnings = parse_sfx_tags(text)
        sfx_count = sum(1 for t in tokens if isinstance(t, SfxMarker))
        assert sfx_count <= MAX_SFX_PER_REQUEST
        assert any(w.code == "sfx_limit" for w in warnings)


# ---------------------------------------------------------------------------
# T2: Path traversal
# ---------------------------------------------------------------------------


class TestPathTraversal:
    """Path escape attempts against the filesystem sandbox."""

    def test_dotdot_etc_passwd(self, tmp_path, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_OUTPUT_ROOT", str(tmp_path))
        with pytest.raises(ValueError, match="outside output root"):
            safe_path("../../etc/passwd")

    def test_dotdot_single(self, tmp_path, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_OUTPUT_ROOT", str(tmp_path))
        with pytest.raises(ValueError, match="outside output root"):
            safe_path("../outside.wav")

    def test_normal_filename_allowed(self, tmp_path, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_OUTPUT_ROOT", str(tmp_path))
        path = safe_path("test_output.wav")
        assert str(tmp_path) in str(path)


# ---------------------------------------------------------------------------
# T7: Corrupt engine output
# ---------------------------------------------------------------------------


class TestCorruptOutput:
    """Non-WAV or truncated files are rejected by the validator."""

    def test_non_wav_rejected(self, tmp_path):
        bad = tmp_path / "not_a_wav.wav"
        bad.write_bytes(b"this is definitely not a WAV file at all nope")
        valid, reason = validate_wav(bad)
        assert not valid
        assert "RIFF" in reason

    def test_truncated_wav_rejected(self, tmp_path):
        bad = tmp_path / "short.wav"
        bad.write_bytes(b"RIFF")
        valid, reason = validate_wav(bad)
        assert not valid


# ---------------------------------------------------------------------------
# Structured errors
# ---------------------------------------------------------------------------


class TestStructuredErrors:
    """Error format consistency."""

    def test_ok_false(self):
        err = make_error(ErrorCode.LIMIT_EXCEEDED, "Too long", "abc123")
        assert err["ok"] is False

    def test_nested_fields(self):
        err = make_error(ErrorCode.BUSY, "Synthesis busy", "def456")
        assert err["error"]["code"] == "BUSY"
        assert err["error"]["message"] == "Synthesis busy"
        assert err["error"]["trace_id"] == "def456"

    def test_all_error_codes_usable(self):
        """Every ErrorCode produces a valid make_error dict."""
        for code in [
            ErrorCode.INTERNAL_ERROR,
            ErrorCode.ENGINE_UNAVAILABLE,
            ErrorCode.VOICE_REJECTED,
            ErrorCode.LIMIT_EXCEEDED,
            ErrorCode.RATE_LIMITED,
            ErrorCode.CAST_ERROR,
            ErrorCode.PARSE_ERROR,
            ErrorCode.PATH_NOT_ALLOWED,
            ErrorCode.BUSY,
        ]:
            err = make_error(code, "test", "trace")
            assert err["ok"] is False
            assert err["error"]["code"] == code
