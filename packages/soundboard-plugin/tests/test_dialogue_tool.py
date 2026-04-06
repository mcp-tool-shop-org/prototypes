"""Tests for voice.dialogue MCP tool handler — end-to-end with mock engine."""

from __future__ import annotations

import json

import pytest

from voice_soundboard_plugin.bridge.stdio_bridge import _handle_dialogue


@pytest.mark.asyncio
async def test_simple_two_speaker(mock_engine, disabled_player, monkeypatch):
    """Two speakers → synthesized with distinct voices."""
    monkeypatch.setattr(
        "voice_soundboard_plugin.bridge.stdio_bridge._PLAYER", disabled_player
    )
    result = await _handle_dialogue(mock_engine, {
        "script": "Alice: Hello!\nBob: Hi there!",
    })
    assert "error" not in result
    assert result["speaker_count"] == 2
    assert result["line_count"] == 2
    assert "bf_alice" in result["cast"].values()  # Alice auto-cast
    # Bob doesn't match a pattern → default voice
    assert mock_engine.speak.call_count == 2


@pytest.mark.asyncio
async def test_explicit_cast_override(mock_engine, disabled_player, monkeypatch):
    """Explicit cast overrides auto-cast."""
    monkeypatch.setattr(
        "voice_soundboard_plugin.bridge.stdio_bridge._PLAYER", disabled_player
    )
    result = await _handle_dialogue(mock_engine, {
        "script": "Alice: Hello!\nBob: Hi!",
        "cast": {"Alice": "am_fenrir", "Bob": "bf_emma"},
    })
    assert result["cast"]["Alice"] == "am_fenrir"
    assert result["cast"]["Bob"] == "bf_emma"


@pytest.mark.asyncio
async def test_auto_cast_mode(mock_engine, disabled_player, monkeypatch):
    """Auto-cast resolves known names."""
    monkeypatch.setattr(
        "voice_soundboard_plugin.bridge.stdio_bridge._PLAYER", disabled_player
    )
    result = await _handle_dialogue(mock_engine, {
        "script": "Emma: Hello!\nGeorge: Greetings!",
    })
    assert result["cast"]["Emma"] == "bf_emma"
    assert result["cast"]["George"] == "bm_george"


@pytest.mark.asyncio
async def test_parse_error_response(mock_engine, disabled_player, monkeypatch):
    """Invalid script → structured error response with line number."""
    monkeypatch.setattr(
        "voice_soundboard_plugin.bridge.stdio_bridge._PLAYER", disabled_player
    )
    result = await _handle_dialogue(mock_engine, {
        "script": "Alice: Hello\nBAD LINE NO COLON",
    })
    assert result["error"] == "Dialogue parse error"
    assert result["line_number"] == 2


@pytest.mark.asyncio
async def test_invalid_cast_error(mock_engine, disabled_player, monkeypatch):
    """Invalid voice in cast → structured error."""
    monkeypatch.setattr(
        "voice_soundboard_plugin.bridge.stdio_bridge._PLAYER", disabled_player
    )
    result = await _handle_dialogue(mock_engine, {
        "script": "Alice: Hello!",
        "cast": {"Alice": "am_nonexistent"},
    })
    assert result["error"] == "Invalid cast"
    assert len(result["details"]) == 1


@pytest.mark.asyncio
async def test_debug_cue_sheet(mock_engine, disabled_player, monkeypatch):
    """debug=True → cue_sheet in response."""
    monkeypatch.setattr(
        "voice_soundboard_plugin.bridge.stdio_bridge._PLAYER", disabled_player
    )
    result = await _handle_dialogue(mock_engine, {
        "script": "Alice: Hello!\n[pause 300ms]\nBob: Hi!",
        "debug": True,
    })
    assert "cue_sheet" in result
    events = [e["event_type"] for e in result["cue_sheet"]]
    assert "pause" in events
    assert "line" in events
    assert result["pause_count"] == 1


@pytest.mark.asyncio
async def test_concat_off(mock_engine, disabled_player, monkeypatch):
    """concat=False → each chunk played separately."""
    monkeypatch.setattr(
        "voice_soundboard_plugin.bridge.stdio_bridge._PLAYER", disabled_player
    )
    result = await _handle_dialogue(mock_engine, {
        "script": "Alice: First.\nBob: Second.",
        "concat": False,
    })
    assert result["line_count"] == 2
    # Without concat, each chunk is played individually
    assert disabled_player.play.call_count == 2


@pytest.mark.asyncio
async def test_stage_directions_in_tool(mock_engine, disabled_player, monkeypatch):
    """Stage directions adjust speed and appear in debug cue sheet."""
    monkeypatch.setattr(
        "voice_soundboard_plugin.bridge.stdio_bridge._PLAYER", disabled_player
    )
    result = await _handle_dialogue(mock_engine, {
        "script": "Alice: (whisper) Secret message.\nBob: (excited) Wow!",
        "debug": True,
    })
    # Check cue sheet has directions
    line_cues = [e for e in result["cue_sheet"] if e["event_type"] == "line"]
    alice_cue = line_cues[0]
    assert "directions" in alice_cue
    assert "whisper" in alice_cue["directions"]
    assert alice_cue["speed"] == 0.9  # whisper = 0.9x
