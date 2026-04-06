"""Golden script tests — realistic dialogue scenarios with mock engine."""

from __future__ import annotations

import pytest

from voice_soundboard_plugin.bridge.stdio_bridge import _handle_dialogue
from voice_soundboard_plugin.speech.roster import APPROVED_VOICES


GOLDEN_SCRIPT_1 = """\
# A simple conversation between narrator, Alice, and Bob
Narrator: Once upon a time, in a land far away, there lived two friends.
[pause 500ms]
Alice: Do you think we'll ever find the treasure?
Bob: I'm sure of it. We just need to keep looking.
[pause 300ms]
Narrator: And so they continued their journey.
"""

GOLDEN_SCRIPT_2 = """\
# Dialogue with stage directions
Alice: (whisper) I think someone is following us.
[pause 200ms]
Bob: (excited) Are you sure? I don't see anyone!
Alice: (calm) Just stay quiet and keep walking.
Bob: (urgent) Wait, I hear something too!
[pause 500ms]
Narrator: (slow) The forest grew darker as the sun began to set.
"""

GOLDEN_SCRIPT_3_INVALID_CAST = """\
Alice: Hello!
Bob: Hi!
"""


@pytest.mark.asyncio
async def test_golden_narrator_alice_bob(mock_engine, disabled_player, monkeypatch):
    """Golden 1: Narrator + Alice + Bob with pauses, auto-cast."""
    monkeypatch.setattr(
        "voice_soundboard_plugin.bridge.stdio_bridge._PLAYER", disabled_player
    )
    result = await _handle_dialogue(mock_engine, {
        "script": GOLDEN_SCRIPT_1,
        "debug": True,
    })
    assert "error" not in result
    assert result["speaker_count"] == 3
    assert result["line_count"] == 4
    assert result["pause_count"] == 2

    # Auto-cast: Narrator → bm_george, Alice → bf_alice
    assert result["cast"]["Narrator"] == "bm_george"
    assert result["cast"]["Alice"] == "bf_alice"

    # All voices in cast are approved
    for voice in result["cast"].values():
        assert voice in APPROVED_VOICES, f"{voice} not approved"

    # Cue sheet has correct order
    cue = result["cue_sheet"]
    assert cue[0]["event_type"] == "line"
    assert cue[0]["speaker"] == "Narrator"


@pytest.mark.asyncio
async def test_golden_with_directions(mock_engine, disabled_player, monkeypatch):
    """Golden 2: 3 speakers with stage directions → speed varies per line."""
    monkeypatch.setattr(
        "voice_soundboard_plugin.bridge.stdio_bridge._PLAYER", disabled_player
    )
    result = await _handle_dialogue(mock_engine, {
        "script": GOLDEN_SCRIPT_2,
        "debug": True,
    })
    assert "error" not in result
    assert result["line_count"] == 5
    assert result["pause_count"] == 2

    # Check directions appear in cue sheet
    line_cues = [e for e in result["cue_sheet"] if e["event_type"] == "line"]

    # First line: Alice (whisper) → speed 0.9
    assert "whisper" in line_cues[0]["directions"]
    assert line_cues[0]["speed"] == 0.9

    # Second line: Bob (excited) → speed 1.1
    assert "excited" in line_cues[1]["directions"]
    assert line_cues[1]["speed"] == 1.1

    # Last line: Narrator (slow) → speed 0.85
    assert "slow" in line_cues[4]["directions"]
    assert line_cues[4]["speed"] == 0.85


@pytest.mark.asyncio
async def test_golden_invalid_cast_error(mock_engine, disabled_player, monkeypatch):
    """Golden 3: Deliberately invalid cast → clean error."""
    monkeypatch.setattr(
        "voice_soundboard_plugin.bridge.stdio_bridge._PLAYER", disabled_player
    )
    result = await _handle_dialogue(mock_engine, {
        "script": GOLDEN_SCRIPT_3_INVALID_CAST,
        "cast": {"Alice": "am_nonexistent"},
    })
    assert result["error"] == "Invalid cast"
    assert "approved_voices" in result


@pytest.mark.asyncio
async def test_golden_cue_sheet_matches_chunks(mock_engine, disabled_player, monkeypatch):
    """Cue sheet line count matches engine call count."""
    monkeypatch.setattr(
        "voice_soundboard_plugin.bridge.stdio_bridge._PLAYER", disabled_player
    )
    result = await _handle_dialogue(mock_engine, {
        "script": GOLDEN_SCRIPT_1,
        "debug": True,
    })
    line_cues = [e for e in result["cue_sheet"] if e["event_type"] == "line"]
    assert len(line_cues) == result["line_count"]
    assert mock_engine.speak.call_count == result["line_count"]


@pytest.mark.asyncio
async def test_golden_all_voices_approved(mock_engine, disabled_player, monkeypatch):
    """All voices used in golden scripts are from the approved roster."""
    monkeypatch.setattr(
        "voice_soundboard_plugin.bridge.stdio_bridge._PLAYER", disabled_player
    )
    for script in [GOLDEN_SCRIPT_1, GOLDEN_SCRIPT_2]:
        result = await _handle_dialogue(mock_engine, {"script": script})
        for voice in result["cast"].values():
            assert voice in APPROVED_VOICES, f"{voice} not in approved roster"
        # Reset mock for next iteration
        mock_engine.reset_mock()
