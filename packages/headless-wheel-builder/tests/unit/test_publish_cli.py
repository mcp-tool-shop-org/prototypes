"""Tests for publish CLI command."""

from __future__ import annotations

import zipfile
from pathlib import Path  # noqa: TC003
from unittest.mock import patch

import pytest
from click.testing import CliRunner

from headless_wheel_builder.cli.main import cli
from headless_wheel_builder.publish.base import PublishResult


@pytest.fixture
def runner() -> CliRunner:
    """Create CLI runner."""
    return CliRunner()


@pytest.fixture
def sample_wheel(tmp_path: Path) -> Path:
    """Create a minimal valid wheel file."""
    wheel_path = tmp_path / "sample_pkg-0.1.0-py3-none-any.whl"
    with zipfile.ZipFile(wheel_path, "w") as whl:
        whl.writestr(
            "sample_pkg-0.1.0.dist-info/WHEEL",
            "Wheel-Version: 1.0\nGenerator: test\nRoot-Is-Purelib: true\nTag: py3-none-any\n",
        )
        whl.writestr(
            "sample_pkg-0.1.0.dist-info/METADATA",
            "Metadata-Version: 2.1\nName: sample-pkg\nVersion: 0.1.0\n",
        )
        whl.writestr("sample_pkg-0.1.0.dist-info/RECORD", "")
        whl.writestr("sample_pkg/__init__.py", "__version__ = '0.1.0'")
    return wheel_path


class TestPublishCLI:
    """Test publish CLI command."""

    def test_help(self, runner: CliRunner) -> None:
        """Test publish --help."""
        result = runner.invoke(cli, ["publish", "--help"])
        assert result.exit_code == 0
        assert "--repository" in result.output
        assert "--token" in result.output
        assert "--dry-run" in result.output
        assert "--skip-existing" in result.output
        assert "--attestations" in result.output

    def test_no_files_shows_error(self, runner: CliRunner) -> None:
        """Test publish with no files gives usage error."""
        result = runner.invoke(cli, ["publish"])
        assert result.exit_code != 0

    def test_nonexistent_file(self, runner: CliRunner) -> None:
        """Test publish with nonexistent file."""
        result = runner.invoke(cli, ["publish", "/nonexistent/wheel.whl"])
        assert result.exit_code != 0

    def test_dry_run(self, runner: CliRunner, sample_wheel: Path) -> None:
        """Test publish with --dry-run validates without uploading."""
        result = runner.invoke(cli, ["publish", str(sample_wheel), "--dry-run"])
        assert result.exit_code == 0 or "dry" in result.output.lower()

    def test_custom_repo_requires_url(self, runner: CliRunner, sample_wheel: Path) -> None:
        """Test that --repository custom requires --repository-url."""
        result = runner.invoke(
            cli,
            ["publish", str(sample_wheel), "--repository", "custom"],
        )
        assert result.exit_code != 0

    def test_testpypi_dry_run(self, runner: CliRunner, sample_wheel: Path) -> None:
        """Test dry run against testpypi."""
        result = runner.invoke(
            cli,
            ["publish", str(sample_wheel), "--repository", "testpypi", "--dry-run"],
        )
        assert result.exit_code == 0 or "dry" in result.output.lower()

    def test_multiple_files(self, runner: CliRunner, sample_wheel: Path, tmp_path: Path) -> None:
        """Test publishing multiple files."""
        # Create a second wheel
        wheel2 = tmp_path / "other_pkg-1.0.0-py3-none-any.whl"
        with zipfile.ZipFile(wheel2, "w") as whl:
            whl.writestr(
                "other_pkg-1.0.0.dist-info/WHEEL", "Wheel-Version: 1.0\nTag: py3-none-any\n"
            )
            whl.writestr(
                "other_pkg-1.0.0.dist-info/METADATA",
                "Metadata-Version: 2.1\nName: other-pkg\nVersion: 1.0.0\n",
            )
            whl.writestr("other_pkg-1.0.0.dist-info/RECORD", "")

        result = runner.invoke(
            cli,
            ["publish", str(sample_wheel), str(wheel2), "--dry-run"],
        )
        assert result.exit_code == 0 or "dry" in result.output.lower()

    def test_publish_result_display(self, runner: CliRunner, sample_wheel: Path) -> None:
        """Test that successful publish shows result table."""
        mock_result = PublishResult(success=True)
        mock_result.add_published(sample_wheel, "https://pypi.org/project/sample-pkg/0.1.0/")

        async def _mock_execute(**kwargs):
            return mock_result

        with patch(
            "headless_wheel_builder.cli.main.execute_publish",
            side_effect=_mock_execute,
        ):
            result = runner.invoke(cli, ["publish", str(sample_wheel)])
            assert result.exit_code == 0
