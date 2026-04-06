"""Tests for speech.ssml_lite — SSML parser and flattener."""

from __future__ import annotations

import pytest

from voice_soundboard_plugin.speech.ssml_lite import (
    MAX_BREAK_DURATION_MS,
    MAX_SSML_INPUT_CHARS,
    MAX_SSML_NODES,
    BreakNode,
    EmphasisSpan,
    ProsodySpan,
    SayAsNode,
    SubstitutionNode,
    TextNode,
    nodes_to_plain_text,
    parse_ssml,
)


def test_plain_text_passthrough():
    """Plain text with no tags → single TextNode."""
    nodes, warnings = parse_ssml("Hello world")
    assert len(nodes) == 1
    assert isinstance(nodes[0], TextNode)
    assert nodes[0].text == "Hello world"
    assert len(warnings) == 0


def test_speak_wrapper():
    """Text already wrapped in <speak> → parsed correctly."""
    nodes, warnings = parse_ssml("<speak>Hello</speak>")
    assert len(nodes) == 1
    assert isinstance(nodes[0], TextNode)
    assert nodes[0].text == "Hello"


def test_break_with_time():
    """<break time='500ms'/> → BreakNode with time_ms=500."""
    nodes, _ = parse_ssml("Before<break time='500ms'/>After")
    assert len(nodes) == 3
    assert isinstance(nodes[1], BreakNode)
    assert nodes[1].time_ms == 500


def test_break_with_seconds():
    """<break time='1.5s'/> → 1500ms."""
    nodes, _ = parse_ssml("<break time='1.5s'/>")
    assert isinstance(nodes[0], BreakNode)
    assert nodes[0].time_ms == 1500


def test_break_with_strength():
    """<break strength='strong'/> → 500ms."""
    nodes, _ = parse_ssml("<break strength='strong'/>")
    assert isinstance(nodes[0], BreakNode)
    assert nodes[0].time_ms == 500
    assert nodes[0].strength == "strong"


def test_break_max_clamped():
    """Break duration exceeding MAX_BREAK_DURATION_MS gets clamped."""
    nodes, _ = parse_ssml("<break time='5000ms'/>")
    assert isinstance(nodes[0], BreakNode)
    assert nodes[0].time_ms == MAX_BREAK_DURATION_MS


def test_prosody_rate():
    """<prosody rate='slow'>text</prosody> → ProsodySpan with rate."""
    nodes, _ = parse_ssml("<prosody rate='slow'>Hello</prosody>")
    assert len(nodes) == 1
    assert isinstance(nodes[0], ProsodySpan)
    assert nodes[0].rate == "slow"
    assert len(nodes[0].children) == 1
    assert isinstance(nodes[0].children[0], TextNode)


def test_emphasis():
    """<emphasis level='strong'>text</emphasis> → EmphasisSpan."""
    nodes, _ = parse_ssml("<emphasis level='strong'>Important</emphasis>")
    assert isinstance(nodes[0], EmphasisSpan)
    assert nodes[0].level == "strong"


def test_emphasis_default_level():
    """<emphasis> without level → default 'moderate'."""
    nodes, _ = parse_ssml("<emphasis>text</emphasis>")
    assert isinstance(nodes[0], EmphasisSpan)
    assert nodes[0].level == "moderate"


def test_sub_alias():
    """<sub alias='World Wide Web'>WWW</sub> → SubstitutionNode."""
    nodes, _ = parse_ssml("<sub alias='World Wide Web'>WWW</sub>")
    assert isinstance(nodes[0], SubstitutionNode)
    assert nodes[0].original == "WWW"
    assert nodes[0].alias == "World Wide Web"


def test_say_as():
    """<say-as interpret-as='characters'>ABC</say-as> → SayAsNode."""
    nodes, _ = parse_ssml("<say-as interpret-as='characters'>ABC</say-as>")
    assert isinstance(nodes[0], SayAsNode)
    assert nodes[0].text == "ABC"
    assert nodes[0].interpret_as == "characters"


def test_malformed_xml_fallback():
    """Malformed XML → fallback to plain text + ssml_parse_failed warning."""
    nodes, warnings = parse_ssml("<speak><break>unclosed")
    assert len(nodes) == 1
    assert isinstance(nodes[0], TextNode)
    codes = [w.code for w in warnings]
    assert "ssml_parse_failed" in codes


def test_unknown_tag_warning():
    """Unknown tag → ssml_tag_ignored warning, tag skipped."""
    nodes, warnings = parse_ssml("<voice name='test'>Hello</voice>")
    codes = [w.code for w in warnings]
    assert "ssml_tag_ignored" in codes


def test_node_limit():
    """Exceeding MAX_SSML_NODES → raises (caught as fallback)."""
    many_breaks = "<break/>" * (MAX_SSML_NODES + 10)
    nodes, warnings = parse_ssml(f"<speak>{many_breaks}</speak>")
    # Should fall back to plain text
    codes = [w.code for w in warnings]
    assert "ssml_parse_failed" in codes


def test_input_truncation():
    """Input exceeding MAX_SSML_INPUT_CHARS → truncated + warning."""
    long_text = "x" * (MAX_SSML_INPUT_CHARS + 100)
    _, warnings = parse_ssml(long_text)
    codes = [w.code for w in warnings]
    assert "ssml_truncated" in codes


def test_nodes_to_plain_text_basic():
    """TextNode → plain text."""
    result = nodes_to_plain_text([TextNode(text="Hello"), TextNode(text=" world")])
    assert result == "Hello world"


def test_nodes_to_plain_text_break():
    """BreakNode → space."""
    result = nodes_to_plain_text([TextNode(text="A"), BreakNode(), TextNode(text="B")])
    assert result == "A B"


def test_nodes_to_plain_text_sub():
    """SubstitutionNode → alias text."""
    result = nodes_to_plain_text([SubstitutionNode(original="WWW", alias="World Wide Web")])
    assert result == "World Wide Web"


def test_nodes_to_plain_text_nested():
    """ProsodySpan with children → flattened text."""
    result = nodes_to_plain_text([
        ProsodySpan(children=[TextNode(text="Hello")], rate="slow"),
    ])
    assert result == "Hello"
