"""Tests for CLI commands."""

from typer.testing import CliRunner

from edgepacks.cli import app

runner = CliRunner()


class TestCLI:
    def test_version(self):
        result = runner.invoke(app, ["--version"])
        assert result.exit_code == 0
        assert "edgepacks" in result.output

    def test_list(self):
        result = runner.invoke(app, ["list-packs"])
        assert result.exit_code == 0
        assert "tool-routing" in result.output
        assert "error-triage" in result.output
        assert "structured" in result.output  # Rich may truncate long names

    def test_info(self):
        result = runner.invoke(app, ["info", "tool-routing"])
        assert result.exit_code == 0
        assert "tool-routing" in result.output
        assert "classification" in result.output

    def test_info_not_found(self):
        result = runner.invoke(app, ["info", "nonexistent"])
        assert result.exit_code == 1

    def test_preview(self):
        result = runner.invoke(app, ["preview", "tool-routing", "--n", "2"])
        assert result.exit_code == 0
        assert "Example 1" in result.output
        assert "Example 2" in result.output

    def test_validate(self):
        result = runner.invoke(app, ["validate", "tool-routing"])
        assert result.exit_code == 0

    def test_stats(self):
        result = runner.invoke(app, ["stats", "tool-routing"])
        assert result.exit_code == 0

    def test_check_leakage(self):
        result = runner.invoke(app, ["check-leakage", "tool-routing"])
        assert result.exit_code == 0
        assert "No leakage" in result.output

    def test_export_jsonl(self, tmp_path):
        result = runner.invoke(app, [
            "export", "tool-routing",
            "--format", "jsonl",
            "--output", str(tmp_path),
        ])
        assert result.exit_code == 0
        assert "Exported" in result.output
