"""Tests for git-aware version-next CLI command."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path  # noqa: TC003

import pytest
from click.testing import CliRunner

from headless_wheel_builder.cli.main import cli


def _git(repo: Path, *args: str) -> subprocess.CompletedProcess:
    """Run a git command in the given repo."""
    return subprocess.run(
        ["git", *args],
        cwd=repo,
        capture_output=True,
        text=True,
        check=True,
    )


def _init_repo(tmp_path: Path, tag: str = "v1.0.0") -> Path:
    """Create a git repo with an initial tagged commit."""
    repo = tmp_path / "repo"
    repo.mkdir()
    _git(repo, "init")
    _git(repo, "config", "user.email", "test@example.com")
    _git(repo, "config", "user.name", "Test")
    (repo / "README.md").write_text("# test")
    _git(repo, "add", ".")
    _git(repo, "commit", "-m", "chore: initial commit")
    _git(repo, "tag", "-a", tag, "-m", f"Release {tag}")
    return repo


class TestVersionNextGitAware:
    """Test git-aware version-next command."""

    @pytest.fixture
    def runner(self) -> CliRunner:
        return CliRunner()

    def test_feat_triggers_minor_bump(self, runner: CliRunner, tmp_path: Path) -> None:
        """feat: commit should suggest minor bump."""
        repo = _init_repo(tmp_path)
        (repo / "feature.py").write_text("# new")
        _git(repo, "add", ".")
        _git(repo, "commit", "-m", "feat: add new feature")

        result = runner.invoke(cli, ["version-next", "--path", str(repo)])
        assert result.exit_code == 0
        assert "1.1.0" in result.output

    def test_fix_triggers_patch_bump(self, runner: CliRunner, tmp_path: Path) -> None:
        """fix: commit should suggest patch bump."""
        repo = _init_repo(tmp_path)
        (repo / "bugfix.py").write_text("# fix")
        _git(repo, "add", ".")
        _git(repo, "commit", "-m", "fix: resolve crash on startup")

        result = runner.invoke(cli, ["version-next", "--path", str(repo)])
        assert result.exit_code == 0
        assert "1.0.1" in result.output

    def test_breaking_change_triggers_major_bump(self, runner: CliRunner, tmp_path: Path) -> None:
        """Breaking change should suggest major bump."""
        repo = _init_repo(tmp_path)
        (repo / "breaking.py").write_text("# break")
        _git(repo, "add", ".")
        _git(repo, "commit", "-m", "feat!: redesign API")

        result = runner.invoke(cli, ["version-next", "--path", str(repo)])
        assert result.exit_code == 0
        assert "2.0.0" in result.output

    def test_feat_beats_fix(self, runner: CliRunner, tmp_path: Path) -> None:
        """When both feat and fix exist, minor wins."""
        repo = _init_repo(tmp_path)
        (repo / "a.py").write_text("# a")
        _git(repo, "add", ".")
        _git(repo, "commit", "-m", "fix: small bug")
        (repo / "b.py").write_text("# b")
        _git(repo, "add", ".")
        _git(repo, "commit", "-m", "feat: new endpoint")

        result = runner.invoke(cli, ["version-next", "--path", str(repo)])
        assert result.exit_code == 0
        assert "1.1.0" in result.output

    def test_no_conventional_commits(self, runner: CliRunner, tmp_path: Path) -> None:
        """Non-conventional commits should suggest no bump."""
        repo = _init_repo(tmp_path)
        (repo / "misc.py").write_text("# misc")
        _git(repo, "add", ".")
        _git(repo, "commit", "-m", "updated stuff")

        result = runner.invoke(cli, ["version-next", "--path", str(repo)])
        assert result.exit_code == 0
        assert "No bump needed" in result.output

    def test_no_commits_since_tag(self, runner: CliRunner, tmp_path: Path) -> None:
        """No commits since tag should exit cleanly."""
        repo = _init_repo(tmp_path)

        result = runner.invoke(cli, ["version-next", "--path", str(repo)])
        assert result.exit_code == 0
        assert "No commits" in result.output

    def test_no_tags(self, runner: CliRunner, tmp_path: Path) -> None:
        """Repo with no tags should error with hint."""
        repo = tmp_path / "notags"
        repo.mkdir()
        _git(repo, "init")
        _git(repo, "config", "user.email", "test@example.com")
        _git(repo, "config", "user.name", "Test")
        (repo / "README.md").write_text("# test")
        _git(repo, "add", ".")
        _git(repo, "commit", "-m", "init")

        result = runner.invoke(cli, ["version-next", "--path", str(repo)])
        assert result.exit_code != 0

    def test_dry_run_shows_details(self, runner: CliRunner, tmp_path: Path) -> None:
        """--dry-run should show commit details."""
        repo = _init_repo(tmp_path)
        (repo / "f.py").write_text("# f")
        _git(repo, "add", ".")
        _git(repo, "commit", "-m", "feat(api): add endpoint")

        result = runner.invoke(cli, ["version-next", "--path", str(repo), "--dry-run"])
        assert result.exit_code == 0
        assert "1.1.0" in result.output
        assert "minor" in result.output.lower()
        assert "feat" in result.output

    def test_json_output(self, runner: CliRunner, tmp_path: Path) -> None:
        """--json should return structured output."""
        repo = _init_repo(tmp_path)
        (repo / "f.py").write_text("# f")
        _git(repo, "add", ".")
        _git(repo, "commit", "-m", "feat: something new")

        result = runner.invoke(cli, ["version-next", "--path", str(repo), "--json"])
        assert result.exit_code == 0
        data = json.loads(result.output)
        assert data["current"] == "1.0.0"
        assert data["next"] == "1.1.0"
        assert data["bump"] == "minor"
        assert data["commits"] == 1

    def test_manual_mode_still_works(self, runner: CliRunner) -> None:
        """Manual mode (positional arg) should still work."""
        result = runner.invoke(cli, ["version-next", "2.3.4", "--part", "minor"])
        assert result.exit_code == 0
        assert "2.4.0" in result.output

    def test_manual_mode_defaults_to_patch(self, runner: CliRunner) -> None:
        """Manual mode without --part should default to patch."""
        result = runner.invoke(cli, ["version-next", "1.0.0"])
        assert result.exit_code == 0
        assert "1.0.1" in result.output

    def test_no_args_shows_error(self, runner: CliRunner) -> None:
        """No args at all should error."""
        result = runner.invoke(cli, ["version-next"])
        assert result.exit_code != 0

    def test_breaking_footer(self, runner: CliRunner, tmp_path: Path) -> None:
        """BREAKING CHANGE footer should trigger major bump."""
        repo = _init_repo(tmp_path)
        (repo / "api.py").write_text("# api")
        _git(repo, "add", ".")
        _git(
            repo,
            "commit",
            "-m",
            "feat: new auth\n\nBREAKING CHANGE: removed old token format",
        )

        result = runner.invoke(cli, ["version-next", "--path", str(repo)])
        assert result.exit_code == 0
        assert "2.0.0" in result.output

    def test_v_prefix_tag(self, runner: CliRunner, tmp_path: Path) -> None:
        """Should work with v-prefixed tags (standard convention)."""
        repo = _init_repo(tmp_path, tag="v2.5.0")
        (repo / "f.py").write_text("# f")
        _git(repo, "add", ".")
        _git(repo, "commit", "-m", "fix: resolve edge case")

        result = runner.invoke(cli, ["version-next", "--path", str(repo)])
        assert result.exit_code == 0
        assert "2.5.1" in result.output
