"""Tests for incremental scanning with hash cache."""

import json
from pathlib import Path

from zip_meta_map.scanner import load_hash_cache, save_hash_cache, scan_directory_incremental

FIXTURE_DIR = Path(__file__).parent / "fixtures" / "tiny_python_cli"


def test_incremental_first_scan(tmp_path):
    """First scan should hash all files and create cache."""
    cache_path = tmp_path / "cache.json"
    files = scan_directory_incremental(FIXTURE_DIR, [".git/**"], cache_path)
    assert len(files) > 0
    assert cache_path.exists()

    cache = load_hash_cache(cache_path)
    assert len(cache) == len(files)


def test_incremental_cache_hit(tmp_path):
    """Second scan should use cache for unchanged files."""
    cache_path = tmp_path / "cache.json"

    files1 = scan_directory_incremental(FIXTURE_DIR, [".git/**"], cache_path)
    files2 = scan_directory_incremental(FIXTURE_DIR, [".git/**"], cache_path)

    # Same results
    assert len(files1) == len(files2)
    for f1, f2 in zip(files1, files2):
        assert f1.path == f2.path
        assert f1.sha256 == f2.sha256
        assert f1.size_bytes == f2.size_bytes


def test_incremental_retain_content(tmp_path):
    """retain_content should work with incremental scanning."""
    cache_path = tmp_path / "cache.json"
    files = scan_directory_incremental(FIXTURE_DIR, [".git/**"], cache_path, retain_content=True)
    readme = next(f for f in files if f.path == "README.md")
    assert readme.content is not None
    assert len(readme.content) > 0


def test_hash_cache_round_trip(tmp_path):
    cache_path = tmp_path / "cache.json"
    entries = {
        "main.py": {"sha256": "a" * 64, "size": 100, "mtime": 1234567890.0},
        "utils.py": {"sha256": "b" * 64, "size": 200, "mtime": 1234567891.0},
    }
    save_hash_cache(cache_path, entries)
    loaded = load_hash_cache(cache_path)
    assert loaded == entries


def test_hash_cache_invalid_version(tmp_path):
    cache_path = tmp_path / "cache.json"
    cache_path.write_text(json.dumps({"version": 999, "entries": {}}))
    assert load_hash_cache(cache_path) == {}


def test_hash_cache_corrupt_json(tmp_path):
    cache_path = tmp_path / "cache.json"
    cache_path.write_text("not json at all")
    assert load_hash_cache(cache_path) == {}


def test_hash_cache_missing_file(tmp_path):
    cache_path = tmp_path / "nonexistent" / "cache.json"
    assert load_hash_cache(cache_path) == {}
