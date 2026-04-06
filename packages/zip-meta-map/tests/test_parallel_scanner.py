"""Tests for parallel directory scanning."""

from pathlib import Path

from zip_meta_map.scanner import scan_directory, scan_directory_parallel

FIXTURE_DIR = Path(__file__).parent / "fixtures" / "tiny_python_cli"


def test_parallel_matches_sequential():
    """Parallel scan should produce identical results to sequential scan."""
    ignore = [".git/**", "__pycache__/**"]
    seq = scan_directory(FIXTURE_DIR, ignore, retain_content=False)
    par = scan_directory_parallel(FIXTURE_DIR, ignore, retain_content=False)

    # Same file count
    assert len(par) == len(seq)

    # Same paths (sorted)
    seq_paths = sorted(f.path for f in seq)
    par_paths = sorted(f.path for f in par)
    assert seq_paths == par_paths

    # Same hashes
    seq_hashes = {f.path: f.sha256 for f in seq}
    par_hashes = {f.path: f.sha256 for f in par}
    assert seq_hashes == par_hashes


def test_parallel_with_content():
    """Parallel scan with retain_content should preserve file bytes."""
    ignore = [".git/**", "__pycache__/**"]
    par = scan_directory_parallel(FIXTURE_DIR, ignore, retain_content=True)

    for f in par:
        assert f.content is not None
        assert len(f.content) == f.size_bytes


def test_parallel_respects_ignores():
    """Parallel scan should respect ignore globs."""
    ignore = [".git/**", "__pycache__/**", "tests/**"]
    par = scan_directory_parallel(FIXTURE_DIR, ignore, retain_content=False)

    for f in par:
        assert not f.path.startswith("tests/")


def test_parallel_deterministic_order():
    """Parallel scan should produce deterministic file order."""
    ignore = [".git/**"]
    run1 = scan_directory_parallel(FIXTURE_DIR, ignore)
    run2 = scan_directory_parallel(FIXTURE_DIR, ignore)
    assert [f.path for f in run1] == [f.path for f in run2]
