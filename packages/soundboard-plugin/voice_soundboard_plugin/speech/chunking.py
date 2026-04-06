"""Smart text chunker — split long text for synthesis at natural boundaries."""

from __future__ import annotations

import re
from typing import Literal

from voice_soundboard_plugin.speech.limits import MAX_CHUNKS
from voice_soundboard_plugin.speech.types import SpeechWarning

DEFAULT_MAX_CHUNK_CHARS = 500
MIN_CHUNK_CHARS = 50

ChunkStrategy = Literal["auto", "off"]


def chunk_text(
    text: str,
    max_chunk_chars: int = DEFAULT_MAX_CHUNK_CHARS,
    strategy: ChunkStrategy = "auto",
) -> tuple[list[str], list[SpeechWarning]]:
    """Split text into synthesis-friendly chunks.

    Chunking rules (priority):
        1. Paragraph breaks (\\n\\n)
        2. Sentence boundaries (. ! ?)
        3. Mid-sentence punctuation (, ; :)
        4. Word boundaries (last resort)

    Returns:
        (chunks, warnings)
    """
    warnings: list[SpeechWarning] = []

    if not text or not text.strip():
        return [text] if text else [], warnings

    # Short text or strategy off → single chunk
    if strategy == "off" or len(text) <= max_chunk_chars:
        return [text], warnings

    # Split into paragraphs first
    paragraphs = re.split(r"\n\s*\n", text)
    chunks: list[str] = []

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        if len(para) <= max_chunk_chars:
            chunks.append(para)
        else:
            # Split by sentences
            chunks.extend(_chunk_paragraph(para, max_chunk_chars))

    # Merge tiny chunks with neighbors
    chunks = _merge_tiny_chunks(chunks, MIN_CHUNK_CHARS)

    # Filter empty
    chunks = [c for c in chunks if c.strip()]

    # Enforce MAX_CHUNKS
    if len(chunks) > MAX_CHUNKS:
        chunks = chunks[:MAX_CHUNKS]
        warnings.append(SpeechWarning(
            code="text_truncated",
            message=f"Text exceeded {MAX_CHUNKS} chunks, later chunks discarded",
            original=len(chunks),
            resolved=MAX_CHUNKS,
        ))

    # Emit chunking warning if we actually chunked
    if len(chunks) > 1:
        warnings.append(SpeechWarning(
            code="chunked_text",
            message=f"Text split into {len(chunks)} chunks for synthesis",
            original=1,
            resolved=len(chunks),
        ))

    return chunks, warnings


def _chunk_paragraph(text: str, max_chars: int) -> list[str]:
    """Split a paragraph that exceeds max_chars at sentence boundaries."""
    sentences = _split_sentences(text)
    chunks: list[str] = []
    current = ""

    for sentence in sentences:
        if current and len(current) + len(sentence) + 1 > max_chars:
            chunks.append(current.strip())
            current = sentence
        else:
            current = f"{current} {sentence}".strip() if current else sentence

        # If current chunk alone exceeds max, split it further
        if len(current) > max_chars:
            sub = _split_long_sentence(current, max_chars)
            chunks.extend(sub[:-1])
            current = sub[-1] if sub else ""

    if current.strip():
        chunks.append(current.strip())

    return chunks


def _split_sentences(text: str) -> list[str]:
    """Split text at sentence boundaries, keeping delimiters attached."""
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in parts if s.strip()]


def _split_long_sentence(text: str, max_chars: int) -> list[str]:
    """Split a long sentence at punctuation, then word boundaries."""
    # Try mid-sentence punctuation first
    parts = re.split(r"(?<=[,;:])\s+", text)
    chunks: list[str] = []
    current = ""

    for part in parts:
        if current and len(current) + len(part) + 1 > max_chars:
            chunks.append(current.strip())
            current = part
        else:
            current = f"{current} {part}".strip() if current else part

    if current.strip():
        chunks.append(current.strip())

    # If any chunk still too long, split at word boundaries
    final: list[str] = []
    for chunk in chunks:
        if len(chunk) <= max_chars:
            final.append(chunk)
        else:
            final.extend(_split_at_words(chunk, max_chars))

    return final


def _split_at_words(text: str, max_chars: int) -> list[str]:
    """Hard split at word boundaries."""
    words = text.split()
    chunks: list[str] = []
    current = ""

    for word in words:
        if current and len(current) + len(word) + 1 > max_chars:
            chunks.append(current.strip())
            current = word
        else:
            current = f"{current} {word}".strip() if current else word

    if current.strip():
        chunks.append(current.strip())

    return chunks


def _merge_tiny_chunks(chunks: list[str], min_size: int) -> list[str]:
    """Merge chunks smaller than min_size with the next neighbor."""
    if len(chunks) <= 1:
        return chunks

    merged: list[str] = []
    carry = ""

    for chunk in chunks:
        if carry:
            chunk = f"{carry} {chunk}"
            carry = ""

        if len(chunk) < min_size:
            carry = chunk
        else:
            merged.append(chunk)

    # Leftover carry merges with last chunk
    if carry:
        if merged:
            merged[-1] = f"{merged[-1]} {carry}"
        else:
            merged.append(carry)

    return merged
