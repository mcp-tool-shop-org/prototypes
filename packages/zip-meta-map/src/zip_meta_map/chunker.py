"""Deterministic chunking for large text files."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass

# Files above this size get chunked
CHUNK_THRESHOLD_BYTES = 32 * 1024  # 32 KB
CHUNK_TARGET_LINES = 100  # Target lines per chunk

# Text extensions that are safe to chunk
_TEXT_EXTS = {
    ".py",
    ".ts",
    ".js",
    ".tsx",
    ".jsx",
    ".rs",
    ".go",
    ".java",
    ".cs",
    ".cpp",
    ".c",
    ".h",
    ".hpp",
    ".rb",
    ".php",
    ".swift",
    ".kt",
    ".scala",
    ".md",
    ".rst",
    ".txt",
    ".toml",
    ".yaml",
    ".yml",
    ".json",
    ".xml",
    ".sh",
    ".bash",
    ".zsh",
    ".ps1",
    ".cfg",
    ".ini",
    ".sql",
    ".html",
    ".css",
    ".scss",
    ".less",
    ".lua",
    ".ex",
    ".exs",
    ".zig",
    ".nim",
    ".graphql",
    ".gql",
    ".proto",
}

# Markdown heading pattern (# through ######)
_MD_HEADING_PREFIXES = ("# ", "## ", "### ", "#### ", "##### ", "###### ")


@dataclass(frozen=True)
class ChunkInfo:
    id: str
    start_line: int
    end_line: int
    byte_len: int
    heading: str | None = None

    def to_dict(self) -> dict:
        d: dict = {
            "id": self.id,
            "start_line": self.start_line,
            "end_line": self.end_line,
            "byte_len": self.byte_len,
        }
        if self.heading:
            d["heading"] = self.heading
        return d


def _stable_chunk_id(text: str, start_line: int) -> str:
    """Generate a stable chunk ID from normalized text content."""
    normalized = text.strip()
    h = hashlib.sha256(normalized.encode("utf-8", errors="replace")).hexdigest()[:12]
    return f"chunk_{start_line}_{h}"


def is_chunkable(path: str, size_bytes: int) -> bool:
    """Check if a file should be chunked."""
    if size_bytes < CHUNK_THRESHOLD_BYTES:
        return False
    ext = ""
    dot = path.rfind(".")
    if dot >= 0:
        ext = path[dot:].lower()
    return ext in _TEXT_EXTS


def chunk_text(content: str, strategy: str = "auto") -> list[ChunkInfo]:
    """Chunk text content into manageable pieces.

    Strategies:
      - "headings": split on markdown headings (for .md files)
      - "lines": split every CHUNK_TARGET_LINES lines
      - "auto": use headings if markdown-like, else lines
    """
    lines = content.splitlines(keepends=True)
    if not lines:
        return []

    if strategy == "auto":
        # Use heading-based chunking if we find markdown headings
        heading_count = sum(1 for line in lines if line.lstrip().startswith(_MD_HEADING_PREFIXES))
        strategy = "headings" if heading_count >= 2 else "lines"

    if strategy == "headings":
        return _chunk_by_headings(lines)
    return _chunk_by_lines(lines)


def _chunk_by_lines(lines: list[str]) -> list[ChunkInfo]:
    """Split into fixed-size line chunks."""
    chunks: list[ChunkInfo] = []
    total = len(lines)
    start = 0

    while start < total:
        end = min(start + CHUNK_TARGET_LINES, total)
        chunk_lines = lines[start:end]
        chunk_text = "".join(chunk_lines)
        chunk_id = _stable_chunk_id(chunk_text, start + 1)

        chunks.append(
            ChunkInfo(
                id=chunk_id,
                start_line=start + 1,
                end_line=end,
                byte_len=len(chunk_text.encode("utf-8", errors="replace")),
            )
        )
        start = end

    return chunks


def _chunk_by_headings(lines: list[str]) -> list[ChunkInfo]:
    """Split on markdown headings."""
    chunks: list[ChunkInfo] = []
    current_start = 0
    current_heading: str | None = None

    for i, line in enumerate(lines):
        stripped = line.lstrip()
        if stripped.startswith(_MD_HEADING_PREFIXES) and i > 0:
            # Emit previous chunk
            chunk_lines = lines[current_start:i]
            if chunk_lines:
                chunk_text = "".join(chunk_lines)
                chunk_id = _stable_chunk_id(chunk_text, current_start + 1)
                chunks.append(
                    ChunkInfo(
                        id=chunk_id,
                        start_line=current_start + 1,
                        end_line=i,
                        byte_len=len(chunk_text.encode("utf-8", errors="replace")),
                        heading=current_heading,
                    )
                )
            current_start = i
            current_heading = stripped.rstrip()

    # Final chunk
    if current_start < len(lines):
        chunk_lines = lines[current_start:]
        chunk_text = "".join(chunk_lines)
        chunk_id = _stable_chunk_id(chunk_text, current_start + 1)
        chunks.append(
            ChunkInfo(
                id=chunk_id,
                start_line=current_start + 1,
                end_line=len(lines),
                byte_len=len(chunk_text.encode("utf-8", errors="replace")),
                heading=current_heading,
            )
        )

    return chunks
