"""Tests for SFX tag parser — [tag] tokenization."""

from __future__ import annotations

import pytest

from voice_soundboard_plugin.audio.sfx import MAX_SFX_PER_REQUEST, SFX_CATALOG
from voice_soundboard_plugin.speech.sfx_parser import (
    SfxMarker,
    TextSegment,
    has_sfx_tags,
    parse_sfx_tags,
)


class TestHasSfxTags:
    def test_known_tag(self):
        assert has_sfx_tags("Hello [ding] world")

    def test_unknown_tag_still_matches(self):
        assert has_sfx_tags("Hello [xyz] world")

    def test_plain_text(self):
        assert not has_sfx_tags("Just plain text")

    def test_empty(self):
        assert not has_sfx_tags("")

    def test_brackets_with_word(self):
        # \w+ matches digits too, so [0] matches
        assert has_sfx_tags("array[abc]")
        assert has_sfx_tags("[ding] hello")


class TestParseSfxTags:
    def test_single_known_tag(self):
        tokens, warnings = parse_sfx_tags("Hello [ding] world")
        assert len(tokens) == 3
        assert isinstance(tokens[0], TextSegment)
        assert isinstance(tokens[1], SfxMarker)
        assert tokens[1].tag == "ding"
        assert isinstance(tokens[2], TextSegment)
        assert len(warnings) == 0

    def test_all_catalog_tags(self):
        """All catalog entries are parsed as SfxMarker."""
        for tag_name in SFX_CATALOG:
            tokens, warnings = parse_sfx_tags(f"Before [{tag_name}] after")
            sfx_tokens = [t for t in tokens if isinstance(t, SfxMarker)]
            assert len(sfx_tokens) == 1, f"Tag [{tag_name}] not parsed as SfxMarker"
            assert sfx_tokens[0].tag == tag_name

    def test_unknown_tag_as_literal(self):
        tokens, warnings = parse_sfx_tags("Hello [unknown_sfx] world")
        sfx_tokens = [t for t in tokens if isinstance(t, SfxMarker)]
        assert len(sfx_tokens) == 0
        assert any(w.code == "sfx_unknown_tag" for w in warnings)

    def test_multiple_tags(self):
        tokens, warnings = parse_sfx_tags("[ding] text [chime] more [click]")
        sfx_tokens = [t for t in tokens if isinstance(t, SfxMarker)]
        assert len(sfx_tokens) == 3

    def test_max_sfx_enforced(self):
        tags = " ".join(f"[ding]" for _ in range(MAX_SFX_PER_REQUEST + 5))
        tokens, warnings = parse_sfx_tags(f"Start {tags} end")
        sfx_tokens = [t for t in tokens if isinstance(t, SfxMarker)]
        assert len(sfx_tokens) == MAX_SFX_PER_REQUEST
        assert any(w.code == "sfx_limit" for w in warnings)

    def test_empty_input(self):
        tokens, warnings = parse_sfx_tags("")
        assert len(tokens) == 1
        assert isinstance(tokens[0], TextSegment)

    def test_text_only(self):
        tokens, warnings = parse_sfx_tags("No tags here")
        assert len(tokens) == 1
        assert isinstance(tokens[0], TextSegment)
        assert tokens[0].text == "No tags here"

    def test_adjacent_tags(self):
        tokens, warnings = parse_sfx_tags("[ding][chime]")
        sfx_tokens = [t for t in tokens if isinstance(t, SfxMarker)]
        assert len(sfx_tokens) == 2
