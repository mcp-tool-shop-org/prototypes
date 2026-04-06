"""Tests for module (directory-level) summary generation."""

from zip_meta_map.modules import build_modules


def _make_entry(path: str, role: str, size: int = 100) -> dict:
    return {"path": path, "role": role, "size_bytes": size, "sha256": "a" * 64, "confidence": 0.8}


def test_build_modules_groups_by_dir():
    entries = [
        _make_entry("src/app/main.py", "entrypoint"),
        _make_entry("src/app/utils.py", "source"),
        _make_entry("src/app/config.py", "config"),
    ]
    modules = build_modules(entries)
    paths = [m["path"] for m in modules]
    assert "src/app" in paths


def test_build_modules_min_files():
    """Directories with fewer than min_files should be excluded."""
    entries = [_make_entry("solo/only.py", "source")]
    modules = build_modules(entries, min_files=2)
    assert len(modules) == 0


def test_build_modules_primary_roles():
    entries = [
        _make_entry("tests/test_a.py", "test"),
        _make_entry("tests/test_b.py", "test"),
        _make_entry("tests/conftest.py", "test"),
    ]
    modules = build_modules(entries)
    test_mod = next(m for m in modules if m["path"] == "tests")
    assert "test" in test_mod["primary_roles"]


def test_build_modules_key_files():
    entries = [
        _make_entry("src/lib/main.py", "entrypoint"),
        _make_entry("src/lib/helper.py", "source"),
        _make_entry("src/lib/README.md", "doc"),
    ]
    modules = build_modules(entries)
    mod = next(m for m in modules if m["path"] == "src/lib")
    assert "src/lib/main.py" in mod.get("key_files", [])


def test_build_modules_total_bytes():
    entries = [
        _make_entry("pkg/a.py", "source", size=200),
        _make_entry("pkg/b.py", "source", size=300),
    ]
    modules = build_modules(entries)
    mod = next(m for m in modules if m["path"] == "pkg")
    assert mod["total_bytes"] == 500


def test_build_modules_summary_present():
    entries = [
        _make_entry("src/core/engine.py", "source"),
        _make_entry("src/core/types.py", "source"),
    ]
    modules = build_modules(entries)
    mod = next(m for m in modules if m["path"] == "src/core")
    assert mod.get("summary")


def test_build_modules_root_files():
    """Root-level files (no directory) should group under '.'."""
    entries = [
        _make_entry("README.md", "doc"),
        _make_entry("pyproject.toml", "config"),
        _make_entry("LICENSE", "doc"),
    ]
    modules = build_modules(entries)
    root_mod = next(m for m in modules if m["path"] == ".")
    assert root_mod["file_count"] == 3


def test_build_modules_excludes_unknown_from_primary():
    entries = [
        _make_entry("misc/a.bin", "unknown"),
        _make_entry("misc/b.bin", "unknown"),
        _make_entry("misc/c.py", "source"),
    ]
    modules = build_modules(entries)
    mod = next(m for m in modules if m["path"] == "misc")
    assert "unknown" not in mod["primary_roles"]
