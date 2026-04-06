"""Tests for the file scanner."""

from pathlib import Path

from zip_meta_map.scanner import scan_directory

FIXTURE_DIR = Path(__file__).parent / "fixtures" / "tiny_python_cli"


def test_scan_finds_all_files():
    files = scan_directory(FIXTURE_DIR, [])
    paths = {f.path for f in files}
    assert "README.md" in paths
    assert "pyproject.toml" in paths
    assert "src/tiny_cli/main.py" in paths
    assert "tests/test_main.py" in paths


def test_scan_ignores_globs():
    files = scan_directory(FIXTURE_DIR, ["tests/**"])
    paths = {f.path for f in files}
    assert "tests/test_main.py" not in paths
    assert "src/tiny_cli/main.py" in paths


def test_scan_computes_sha256():
    files = scan_directory(FIXTURE_DIR, [])
    for f in files:
        assert len(f.sha256) == 64
        assert all(c in "0123456789abcdef" for c in f.sha256)


def test_scan_computes_size():
    files = scan_directory(FIXTURE_DIR, [])
    readme = next(f for f in files if f.path == "README.md")
    assert readme.size_bytes > 0
