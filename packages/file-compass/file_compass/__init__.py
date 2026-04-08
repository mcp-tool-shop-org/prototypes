"""
File Compass - HNSW-based semantic file search for AI workstations.

Provides fast semantic search across code, documentation, and config files
using HNSW indexing with nomic-embed-text embeddings via Ollama.
"""

from importlib.metadata import version as _pkg_version

__version__ = _pkg_version("file-compass")
__author__ = "mcp-tool-shop"

from pathlib import Path

# Default paths
DEFAULT_DB_PATH = Path(__file__).parent / "db"
DEFAULT_INDEX_PATH = DEFAULT_DB_PATH / "file_compass.hnsw"
DEFAULT_SQLITE_PATH = DEFAULT_DB_PATH / "files.db"

# Ensure db directory exists
DEFAULT_DB_PATH.mkdir(parents=True, exist_ok=True)
