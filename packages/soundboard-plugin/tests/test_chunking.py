"""Tests for speech.chunking — smart text chunker."""

from __future__ import annotations

import pytest

from voice_soundboard_plugin.speech.chunking import (
    DEFAULT_MAX_CHUNK_CHARS,
    MIN_CHUNK_CHARS,
    chunk_text,
)
from voice_soundboard_plugin.speech.limits import MAX_CHUNKS


def test_short_text_single_chunk():
    """Text shorter than max → single chunk, no warnings."""
    chunks, warnings = chunk_text("Hello world")
    assert chunks == ["Hello world"]
    assert len(warnings) == 0


def test_empty_text():
    """Empty string → empty list."""
    chunks, warnings = chunk_text("")
    assert chunks == []


def test_strategy_off():
    """strategy='off' → single chunk regardless of length."""
    long = "x" * 1000
    chunks, warnings = chunk_text(long, strategy="off")
    assert len(chunks) == 1
    assert chunks[0] == long


def test_paragraph_split():
    """Paragraphs separated by blank lines → separate chunks."""
    p1 = "First paragraph with enough text to exceed the minimum chunk size."
    p2 = "Second paragraph also containing sufficient text for a standalone chunk."
    p3 = "Third paragraph is similarly sized to avoid merging with neighbors."
    text = f"{p1}\n\n{p2}\n\n{p3}"
    chunks, warnings = chunk_text(text, max_chunk_chars=100)
    assert len(chunks) == 3
    assert chunks[0] == p1
    assert chunks[1] == p2
    assert chunks[2] == p3


def test_sentence_split():
    """Long paragraph splits at sentence boundaries."""
    sentences = ["This is sentence number %d." % i for i in range(20)]
    text = " ".join(sentences)
    chunks, _ = chunk_text(text, max_chunk_chars=150)
    assert len(chunks) > 1
    # Each chunk should be under the limit (with some tolerance for merging)
    for chunk in chunks:
        assert len(chunk) <= 200  # some tolerance from merge


def test_long_sentence_split():
    """A single very long sentence splits at punctuation, then words."""
    text = ", ".join(["word" * 10] * 20)  # long comma-separated text
    chunks, _ = chunk_text(text, max_chunk_chars=100)
    assert len(chunks) > 1


def test_max_chunks_enforced():
    """Exceeding MAX_CHUNKS → truncated + text_truncated warning."""
    # Create more paragraphs than MAX_CHUNKS, each long enough to avoid merging
    paragraphs = [
        f"This is paragraph number {i} with enough text to exceed the minimum chunk size easily."
        for i in range(MAX_CHUNKS + 20)
    ]
    text = "\n\n".join(paragraphs)
    chunks, warnings = chunk_text(text, max_chunk_chars=100)
    assert len(chunks) <= MAX_CHUNKS
    codes = [w.code for w in warnings]
    assert "text_truncated" in codes


def test_tiny_chunks_merged():
    """Chunks smaller than MIN_CHUNK_CHARS get merged with neighbors."""
    text = "Hi.\n\nOk.\n\nThis is a longer paragraph that should stay intact."
    chunks, _ = chunk_text(text, max_chunk_chars=500)
    # "Hi." and "Ok." are tiny, should be merged
    for chunk in chunks:
        assert len(chunk) >= MIN_CHUNK_CHARS or len(chunks) == 1


def test_chunked_text_warning():
    """Multi-chunk result → chunked_text warning."""
    text = "First paragraph is fairly long.\n\nSecond paragraph is also long enough."
    chunks, warnings = chunk_text(text, max_chunk_chars=40)
    if len(chunks) > 1:
        codes = [w.code for w in warnings]
        assert "chunked_text" in codes


def test_whitespace_only():
    """Whitespace-only text → returned as-is."""
    chunks, warnings = chunk_text("   ")
    assert chunks == ["   "]
