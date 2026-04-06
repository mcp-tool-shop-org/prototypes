"""Tests for cts config validate command."""

from __future__ import annotations

import json
import os
import tempfile
import textwrap

import pytest

from cts.cli import main


class TestConfigValidate:
    """Test the config validate subcommand."""

    def test_validate_text_output(self, monkeypatch, capsys):
        """Config validate produces text output with check results."""
        monkeypatch.chdir(tempfile.mkdtemp())
        main(["config", "validate"])
        out = capsys.readouterr().out
        assert "config validate" in out

    def test_validate_json_output(self, monkeypatch, capsys):
        """Config validate --format json produces valid JSON array."""
        monkeypatch.chdir(tempfile.mkdtemp())
        main(["config", "validate", "--format", "json"])
        out = capsys.readouterr().out
        data = json.loads(out)
        assert isinstance(data, list)
        assert all("check" in item and "status" in item for item in data)

    def test_validate_with_valid_repos_yaml(self, monkeypatch, capsys, tmp_path):
        """Config validate passes with a well-formed repos.yaml."""
        repos_yaml = tmp_path / "repos.yaml"
        repos_yaml.write_text(textwrap.dedent("""\
            repos:
              myorg/frontend:
                url: https://github.com/myorg/frontend.git
                preset: node
        """))
        monkeypatch.chdir(tmp_path)
        main(["config", "validate"])
        out = capsys.readouterr().out
        assert "1 repo" in out
        assert "PASS" in out

    def test_validate_detects_bad_preset(self, monkeypatch, capsys, tmp_path):
        """Config validate warns on unknown preset values."""
        repos_yaml = tmp_path / "repos.yaml"
        repos_yaml.write_text(textwrap.dedent("""\
            repos:
              myorg/app:
                url: https://github.com/myorg/app.git
                preset: cobol
        """))
        monkeypatch.chdir(tmp_path)
        main(["config", "validate"])
        out = capsys.readouterr().out
        assert "unknown presets" in out

    def test_validate_detects_missing_url(self, monkeypatch, capsys, tmp_path):
        """Config validate warns when a repo has no url field."""
        repos_yaml = tmp_path / "repos.yaml"
        repos_yaml.write_text(textwrap.dedent("""\
            repos:
              myorg/thing:
                preset: python
        """))
        monkeypatch.chdir(tmp_path)
        main(["config", "validate"])
        out = capsys.readouterr().out
        assert "missing url" in out

    def test_validate_repos_yaml_not_found(self, monkeypatch, capsys):
        """Config validate warns when repos.yaml is missing."""
        monkeypatch.chdir(tempfile.mkdtemp())
        main(["config", "validate"])
        out = capsys.readouterr().out
        assert "Not found" in out

    def test_validate_with_compose_yaml(self, monkeypatch, capsys, tmp_path):
        """Config validate checks compose.yaml when present."""
        compose = tmp_path / "compose.yaml"
        compose.write_text(textwrap.dedent("""\
            services:
              gateway:
                image: gateway:latest
              worker:
                image: worker:latest
        """))
        monkeypatch.chdir(tmp_path)
        main(["config", "validate"])
        out = capsys.readouterr().out
        assert "2 services" in out

    def test_validate_env_var_detection(self, monkeypatch, capsys):
        """Config validate reports on env var presence."""
        monkeypatch.chdir(tempfile.mkdtemp())
        monkeypatch.setenv("CLAUDE_TOOLSTACK_API_KEY", "test-key-12345")
        main(["config", "validate"])
        out = capsys.readouterr().out
        assert "test..." in out  # Masked value

    def test_validate_fail_on_malformed_yaml(self, monkeypatch, capsys, tmp_path):
        """Config validate exits 1 when repos.yaml has invalid YAML."""
        repos_yaml = tmp_path / "repos.yaml"
        repos_yaml.write_text("{{{{ not valid yaml ::::")
        monkeypatch.chdir(tmp_path)
        with pytest.raises(SystemExit) as exc_info:
            main(["config", "validate"])
        assert exc_info.value.code == 1

    def test_validate_no_action_shows_usage(self, capsys):
        """Config without subcommand shows usage hint."""
        main(["config"])
        out = capsys.readouterr().out
        assert "validate" in out
