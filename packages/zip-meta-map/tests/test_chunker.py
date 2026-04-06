"""Tests for the deterministic chunker."""

from zip_meta_map.chunker import CHUNK_THRESHOLD_BYTES, ChunkInfo, chunk_text, is_chunkable


def test_is_chunkable_large_py():
    assert is_chunkable("src/main.py", CHUNK_THRESHOLD_BYTES + 1) is True


def test_is_chunkable_small_file():
    assert is_chunkable("src/main.py", 100) is False


def test_is_chunkable_binary_ext():
    assert is_chunkable("app.exe", CHUNK_THRESHOLD_BYTES + 1) is False


def test_is_chunkable_no_ext():
    assert is_chunkable("Makefile", CHUNK_THRESHOLD_BYTES + 1) is False


def test_chunk_text_empty():
    assert chunk_text("") == []


def test_chunk_by_lines_basic():
    """100+ lines should produce at least 2 chunks."""
    content = "\n".join(f"line {i}" for i in range(250))
    chunks = chunk_text(content, strategy="lines")
    assert len(chunks) >= 2
    # First chunk starts at line 1
    assert chunks[0].start_line == 1
    # Chunks are contiguous
    for i in range(1, len(chunks)):
        assert chunks[i].start_line == chunks[i - 1].end_line + 1


def test_chunk_by_lines_stable_ids():
    """Same content should produce same chunk IDs."""
    content = "\n".join(f"line {i}" for i in range(200))
    c1 = chunk_text(content, strategy="lines")
    c2 = chunk_text(content, strategy="lines")
    assert [c.id for c in c1] == [c.id for c in c2]


def test_chunk_by_headings():
    """Markdown headings should create heading-aware chunks."""
    content = """# Introduction

Some intro text here.
More intro text.

## Methods

Method description goes here.

## Results

Results section with data.
"""
    chunks = chunk_text(content, strategy="headings")
    assert len(chunks) >= 2
    # First chunk should have None heading (before first heading, or the first heading itself)
    # Later chunks should capture headings
    headings = [c.heading for c in chunks if c.heading]
    assert any("Methods" in h for h in headings) or any("Results" in h for h in headings)


def test_chunk_auto_detects_markdown():
    """Auto strategy should use headings for markdown-like content."""
    content = """# Title

Paragraph.

## Section A

Content A.

## Section B

Content B.
"""
    chunks = chunk_text(content, strategy="auto")
    # Should detect headings and use heading strategy
    assert len(chunks) >= 2


def test_chunk_auto_detects_plain():
    """Auto strategy should use lines for non-markdown content."""
    content = "\n".join(f"print('line {i}')" for i in range(200))
    chunks = chunk_text(content, strategy="auto")
    assert len(chunks) >= 2


def test_chunk_to_dict():
    chunk = ChunkInfo(id="chunk_1_abc", start_line=1, end_line=100, byte_len=5000, heading="# Intro")
    d = chunk.to_dict()
    assert d["id"] == "chunk_1_abc"
    assert d["start_line"] == 1
    assert d["end_line"] == 100
    assert d["byte_len"] == 5000
    assert d["heading"] == "# Intro"


def test_chunk_to_dict_no_heading():
    chunk = ChunkInfo(id="chunk_1_abc", start_line=1, end_line=100, byte_len=5000)
    d = chunk.to_dict()
    assert "heading" not in d


def test_chunk_byte_len_accurate():
    """byte_len should match actual encoded size."""
    content = "\n".join(f"line {i}" for i in range(150))
    chunks = chunk_text(content, strategy="lines")
    total_bytes = sum(c.byte_len for c in chunks)
    actual_bytes = len(content.encode("utf-8"))
    assert total_bytes == actual_bytes
