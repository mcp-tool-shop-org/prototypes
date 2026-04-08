"""Version alignment tests for tool-scan."""

import re
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parent.parent


def _read_pyproject_version() -> str:
    text = (ROOT / "pyproject.toml").read_text(encoding="utf-8")
    m = re.search(r'^version\s*=\s*"([^"]+)"', text, re.MULTILINE)
    assert m, "version not found in pyproject.toml"
    return m.group(1)


class TestVersionAlignment:
    def test_pyproject_version_is_semver(self) -> None:
        version = _read_pyproject_version()
        parts = version.split(".")
        assert len(parts) == 3, f"expected semver, got {version}"
        for part in parts:
            assert part.isdigit(), f"non-numeric version part: {part}"

    def test_runtime_version_matches_pyproject(self) -> None:
        from tool_scan import __version__

        assert __version__ == _read_pyproject_version(), (
            f"runtime {__version__} != pyproject {_read_pyproject_version()}"
        )

    def test_changelog_mentions_current_version(self) -> None:
        version = _read_pyproject_version()
        changelog = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")
        assert version in changelog, f"CHANGELOG missing version {version}"
