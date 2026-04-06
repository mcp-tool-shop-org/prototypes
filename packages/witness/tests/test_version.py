"""Version consistency tests for witness."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
PYPROJECT = ROOT / "pyproject.toml"
CHANGELOG = ROOT / "CHANGELOG.md"


def _read_pyproject_version() -> str:
    match = re.search(
        r'^version\s*=\s*"([^"]+)"',
        PYPROJECT.read_text(encoding="utf-8"),
        re.MULTILINE,
    )
    assert match, "No version found in pyproject.toml"
    return match.group(1)


def test_version_is_semver():
    version = _read_pyproject_version()
    assert re.match(r"^\d+\.\d+\.\d+", version), f"Not semver: {version}"


def test_version_at_least_1():
    version = _read_pyproject_version()
    major = int(version.split(".")[0])
    assert major >= 1, f"Pre-release version: {version}"


def test_changelog_mentions_version():
    version = _read_pyproject_version()
    changelog = CHANGELOG.read_text(encoding="utf-8")
    assert version in changelog, f"CHANGELOG missing version {version}"


def test_license_file_exists():
    assert (ROOT / "LICENSE").exists(), "LICENSE file missing"
