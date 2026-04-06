"""Version alignment tests."""

import re
from pathlib import Path

import zip_meta_map


def _pyproject_version() -> str:
    pyproject = Path(__file__).resolve().parent.parent / "pyproject.toml"
    for line in pyproject.read_text().splitlines():
        if line.startswith("version"):
            return line.split('"')[1]
    raise RuntimeError("version not found in pyproject.toml")


def test_init_version_matches_pyproject():
    assert zip_meta_map.__version__ == _pyproject_version()


def test_version_is_valid_semver():
    assert re.match(r"^\d+\.\d+\.\d+$", zip_meta_map.__version__)


def test_changelog_mentions_version():
    changelog = Path(__file__).resolve().parent.parent / "CHANGELOG.md"
    assert f"[{zip_meta_map.__version__}]" in changelog.read_text()
