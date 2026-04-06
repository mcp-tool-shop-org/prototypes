"""Tests for --version flag."""

from click.testing import CliRunner

from llm_sync_drive import __version__
from llm_sync_drive.__main__ import cli


def test_version_flag():
    """--version prints version and exits 0."""
    runner = CliRunner()
    result = runner.invoke(cli, ["--version"])
    assert result.exit_code == 0
    assert __version__ in result.output


def test_version_short_flag():
    """-V prints version and exits 0."""
    runner = CliRunner()
    result = runner.invoke(cli, ["-V"])
    assert result.exit_code == 0
    assert __version__ in result.output


def test_version_contains_prog_name():
    """Version output includes program name."""
    runner = CliRunner()
    result = runner.invoke(cli, ["--version"])
    assert "llm-sync-drive" in result.output
