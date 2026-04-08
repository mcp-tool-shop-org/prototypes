"""Version consistency tests for stresskit-mcp."""

import re
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).parent.parent
CLI_ROOT = ROOT / "engines" / "stresskit-cli"
CHANGELOG = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")


def get_cli_version() -> str:
    """Read __version__ from stresskit_cli.py."""
    cli_file = CLI_ROOT / "stresskit_cli.py"
    for line in cli_file.read_text(encoding="utf-8").splitlines():
        if line.startswith("__version__"):
            return line.split("=")[1].strip().strip('"').strip("'")
    raise RuntimeError("__version__ not found in stresskit_cli.py")


class TestVersionConsistency:
    """Version consistency tests."""

    def test_version_is_semver(self):
        version = get_cli_version()
        assert re.match(r"^\d+\.\d+\.\d+", version), f"Not semver: {version}"

    def test_version_gte_1(self):
        version = get_cli_version()
        major = int(version.split(".")[0])
        assert major >= 1, f"Expected major >= 1, got {major}"

    def test_changelog_mentions_version(self):
        version = get_cli_version()
        assert version in CHANGELOG, f"CHANGELOG missing {version}"

    def test_version_command_matches(self):
        version = get_cli_version()
        result = subprocess.run(
            [sys.executable, "-m", "stresskit_cli", "version", "--json"],
            capture_output=True,
            text=True,
            cwd=str(CLI_ROOT),
            timeout=10,
        )
        assert result.returncode == 0
        import json
        data = json.loads(result.stdout)
        assert data["cli_version"] == version
