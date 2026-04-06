"""Tests for speech.dialogue.parser — script parsing into AST."""

from __future__ import annotations

import pytest

from voice_soundboard_plugin.speech.dialogue import (
    DialogueLine,
    DialoguePause,
    DialogueParseError,
    DialogueScript,
    parse_dialogue,
)
from voice_soundboard_plugin.speech.dialogue.types import (
    MAX_DIALOGUE_LINES,
    MAX_LINE_CHARS,
    MAX_PAUSES,
    MAX_PAUSE_MS,
    MIN_PAUSE_MS,
)


def test_single_line():
    """Single speaker line → one DialogueLine."""
    script = parse_dialogue("Alice: Hello world")
    assert len(script.lines) == 1
    assert script.lines[0].speaker == "Alice"
    assert script.lines[0].text == "Hello world"
    assert script.lines[0].line_index == 0


def test_multi_line():
    """Multiple lines → multiple DialogueLines with incrementing index."""
    script = parse_dialogue("Alice: Hello\nBob: Hi there")
    assert len(script.lines) == 2
    assert script.lines[0].speaker == "Alice"
    assert script.lines[1].speaker == "Bob"
    assert script.lines[0].line_index == 0
    assert script.lines[1].line_index == 1


def test_multi_speaker():
    """Three speakers → all parsed with correct text."""
    script = parse_dialogue(
        "Alice: First line\nBob: Second line\nCharlie: Third line"
    )
    assert len(script.lines) == 3
    speakers = [line.speaker for line in script.lines]
    assert speakers == ["Alice", "Bob", "Charlie"]


def test_speaker_normalization_whitespace():
    """Speaker with extra whitespace → collapsed."""
    script = parse_dialogue("  Alice   B  : Hello")
    assert script.lines[0].speaker == "Alice B"
    assert script.lines[0].original_speaker == "Alice   B"


def test_speaker_preserves_case():
    """Speaker case is preserved."""
    script = parse_dialogue("Dr. Alice Smith: Hello")
    assert script.lines[0].speaker == "Dr. Alice Smith"


def test_pause_ms():
    """[pause 350ms] → DialoguePause with 350ms."""
    script = parse_dialogue("Alice: Hello\n[pause 350ms]\nBob: Hi")
    assert len(script.pauses) == 1
    assert script.pauses[0].duration_ms == 350


def test_pause_seconds():
    """[pause 1.5s] → 1500ms."""
    script = parse_dialogue("Alice: Hello\n[pause 1.5s]\nBob: Hi")
    assert script.pauses[0].duration_ms == 1500


def test_pause_break_alias():
    """[break 500ms] also works."""
    script = parse_dialogue("Alice: Hello\n[break 500ms]\nBob: Hi")
    assert script.pauses[0].duration_ms == 500


def test_pause_clamped_low():
    """Pause below MIN_PAUSE_MS → clamped + warning."""
    script = parse_dialogue("Alice: Hello\n[pause 10ms]\nBob: Hi")
    assert script.pauses[0].duration_ms == MIN_PAUSE_MS
    assert any("clamped" in w for w in script.warnings)


def test_pause_clamped_high():
    """Pause above MAX_PAUSE_MS → clamped + warning."""
    script = parse_dialogue("Alice: Hello\n[pause 5000ms]\nBob: Hi")
    assert script.pauses[0].duration_ms == MAX_PAUSE_MS
    assert any("clamped" in w for w in script.warnings)


def test_comments_ignored():
    """# comments are ignored."""
    script = parse_dialogue("# This is a comment\nAlice: Hello")
    assert len(script.lines) == 1
    assert script.lines[0].text == "Hello"


def test_blank_lines_ignored():
    """Blank lines between dialogue lines are ignored."""
    script = parse_dialogue("Alice: Hello\n\n\nBob: Hi")
    assert len(script.lines) == 2


def test_max_lines_exceeded():
    """Exceeding MAX_DIALOGUE_LINES → DialogueParseError."""
    lines = "\n".join(f"Speaker{i}: Line {i}" for i in range(MAX_DIALOGUE_LINES + 1))
    with pytest.raises(DialogueParseError) as exc_info:
        parse_dialogue(lines)
    assert "Too many dialogue lines" in str(exc_info.value)


def test_max_pauses_exceeded():
    """Exceeding MAX_PAUSES → DialogueParseError."""
    parts = ["Alice: Start"]
    for _ in range(MAX_PAUSES + 1):
        parts.append("[pause 200ms]")
    parts.append("Alice: End")
    with pytest.raises(DialogueParseError) as exc_info:
        parse_dialogue("\n".join(parts))
    assert "Too many pauses" in str(exc_info.value)


def test_text_truncation():
    """Line text exceeding MAX_LINE_CHARS → truncated + warning."""
    long_text = "x" * (MAX_LINE_CHARS + 100)
    script = parse_dialogue(f"Alice: {long_text}")
    assert len(script.lines[0].text) == MAX_LINE_CHARS
    assert any("truncated" in w for w in script.warnings)


def test_invalid_syntax_raises():
    """Invalid line (no colon) → DialogueParseError with line number."""
    with pytest.raises(DialogueParseError) as exc_info:
        parse_dialogue("Alice: Hello\nThis has no speaker prefix\nBob: Hi")
    assert exc_info.value.line_number == 2


def test_empty_script_raises():
    """Empty string → DialogueParseError."""
    with pytest.raises(DialogueParseError) as exc_info:
        parse_dialogue("")
    assert "Empty dialogue script" in str(exc_info.value)


def test_only_comments_raises():
    """Script with only comments → DialogueParseError."""
    with pytest.raises(DialogueParseError):
        parse_dialogue("# Just a comment\n# Another comment")


# --- Stage direction tests ---

def test_stage_direction_extracted():
    """(whisper) is extracted from text."""
    script = parse_dialogue("Alice: (whisper) I have a secret.")
    line = script.lines[0]
    assert line.directions == ["whisper"]
    assert line.text == "I have a secret."
    assert line.original_text == "(whisper) I have a secret."


def test_multiple_directions():
    """Multiple stage directions → all captured."""
    script = parse_dialogue("Alice: (whisper)(slow) Careful now.")
    line = script.lines[0]
    assert "whisper" in line.directions
    assert "slow" in line.directions
    assert line.text == "Careful now."


def test_unknown_direction_warning():
    """Unknown direction → warning, not error."""
    script = parse_dialogue("Alice: (yelling) HELLO")
    assert script.lines[0].text == "HELLO"
    assert any("Unknown stage direction" in w for w in script.warnings)


def test_no_directions_no_original_text():
    """Lines without directions → empty original_text."""
    script = parse_dialogue("Alice: Normal line.")
    assert script.lines[0].directions == []
    assert script.lines[0].original_text == ""


def test_direction_case_insensitive():
    """Stage directions are case-insensitive."""
    script = parse_dialogue("Alice: (WHISPER) Shh.")
    assert script.lines[0].directions == ["whisper"]
    assert script.lines[0].text == "Shh."
