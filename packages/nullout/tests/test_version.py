"""Version consistency tests."""

import re
import subprocess
import sys
from pathlib import Path

import nullout


def _repo_root() -> Path:
    return Path(__file__).parent.parent


def _pyproject_version() -> str:
    text = (_repo_root() / "pyproject.toml").read_text()
    m = re.search(r'^version\s*=\s*"(.+?)"', text, re.MULTILINE)
    assert m, "Could not find version in pyproject.toml"
    return m.group(1)


def test_version_is_semver():
    """__version__ looks like a valid semver string."""
    assert re.match(r"^\d+\.\d+\.\d+", nullout.__version__)


def test_version_at_least_1():
    """Package is at least v1.0.0."""
    major = int(nullout.__version__.split(".")[0])
    assert major >= 1, f"Expected major >= 1, got {major}"


def test_version_matches_pyproject():
    """__version__ matches pyproject.toml."""
    assert nullout.__version__ == _pyproject_version()


def test_changelog_mentions_version():
    """CHANGELOG.md references the current version."""
    changelog = (_repo_root() / "CHANGELOG.md").read_text()
    expected = _pyproject_version()
    assert f"[{expected}]" in changelog, f"CHANGELOG missing [{expected}]"


def test_version_flag():
    """--version flag prints version and exits."""
    result = subprocess.run(
        [sys.executable, "-m", "nullout.server", "--version"],
        capture_output=True, text=True, timeout=10,
    )
    assert result.returncode == 0
    assert _pyproject_version() in result.stdout
