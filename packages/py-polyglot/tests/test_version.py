"""Version alignment tests."""

import re
import subprocess
import sys
from pathlib import Path

import tomllib

import pypolyglot


def test_version_is_semver():
    assert re.match(r"^\d+\.\d+\.\d+", pypolyglot.__version__)


def test_version_at_least_1_0_0():
    major = int(pypolyglot.__version__.split(".")[0])
    assert major >= 1


def test_version_matches_pyproject():
    pyproject = Path(__file__).parent.parent / "pyproject.toml"
    with open(pyproject, "rb") as f:
        data = tomllib.load(f)
    assert pypolyglot.__version__ == data["project"]["version"]


def test_cli_version_flag():
    result = subprocess.run(
        [sys.executable, "-m", "pypolyglot", "--version"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    assert pypolyglot.__version__ in result.stdout
