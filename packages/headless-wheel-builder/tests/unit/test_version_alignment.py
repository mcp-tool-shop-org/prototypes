"""Tests for version alignment between __init__.py and pyproject.toml."""

from __future__ import annotations

from pathlib import Path

import headless_wheel_builder


def _read_pyproject_version() -> str:
    """Read version from pyproject.toml without tomli dependency."""
    pyproject = Path(__file__).resolve().parents[2] / "pyproject.toml"
    for line in pyproject.read_text().splitlines():
        stripped = line.strip()
        if stripped.startswith("version"):
            return stripped.split("=", 1)[1].strip().strip('"')
    msg = "version not found in pyproject.toml"
    raise RuntimeError(msg)


class TestVersionAlignment:
    """Ensure version constants stay in sync."""

    def test_init_version_exists(self):
        assert hasattr(headless_wheel_builder, "__version__")
        assert headless_wheel_builder.__version__

    def test_init_matches_pyproject(self):
        pyproject_ver = _read_pyproject_version()
        assert headless_wheel_builder.__version__ == pyproject_ver, (
            f"__init__.py ({headless_wheel_builder.__version__}) != "
            f"pyproject.toml ({pyproject_ver})"
        )

    def test_version_is_semver(self):
        parts = headless_wheel_builder.__version__.split(".")
        assert len(parts) == 3, f"Expected 3-part semver, got {headless_wheel_builder.__version__}"
        for part in parts:
            assert part.isdigit(), f"Non-numeric version part: {part}"
