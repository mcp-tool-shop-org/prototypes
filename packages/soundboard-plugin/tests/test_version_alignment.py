"""Tests for version alignment between __init__.py and pyproject.toml."""

from pathlib import Path

from voice_soundboard_plugin import __version__


class TestVersionAlignment:
    """Ensure version consistency across package metadata."""

    def test_init_version_exists(self):
        assert __version__, "__version__ must be set"

    def test_init_matches_pyproject(self):
        pyproject = Path(__file__).resolve().parents[1] / "pyproject.toml"
        for line in pyproject.read_text().splitlines():
            stripped = line.strip()
            if stripped.startswith("version"):
                pyproject_version = stripped.split("=", 1)[1].strip().strip('"')
                assert __version__ == pyproject_version, (
                    f"__init__.py ({__version__}) != pyproject.toml ({pyproject_version})"
                )
                return
        raise AssertionError("version not found in pyproject.toml")

    def test_version_is_semver(self):
        parts = __version__.split(".")
        assert len(parts) == 3, f"version {__version__} is not semver (expected X.Y.Z)"
        for part in parts:
            assert part.isdigit(), f"version part '{part}' is not numeric"
