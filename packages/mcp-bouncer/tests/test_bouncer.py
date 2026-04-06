"""Tests for mcp_bouncer.bouncer core functions."""

import sys
from pathlib import Path
from unittest.mock import patch

import pytest

from mcp_bouncer.bouncer import _resolve_command, health_check, cli


class TestResolveCommand:
    """Tests for _resolve_command."""

    def test_resolves_system_command(self):
        # python should be on PATH
        result = _resolve_command("python")
        assert result is not None

    def test_returns_none_for_missing_command(self):
        result = _resolve_command("definitely-not-a-real-command-xyz123")
        assert result is None

    def test_resolves_absolute_path_that_exists(self):
        python_path = sys.executable
        result = _resolve_command(python_path)
        assert result == python_path

    def test_returns_none_for_absolute_path_not_found(self):
        result = _resolve_command("/nonexistent/path/to/binary")
        assert result is None


class TestHealthCheck:
    """Tests for health_check function."""

    def test_unhealthy_when_command_not_found(self):
        result = health_check("test-server", {"command": "no-such-binary-xyz123"})
        assert result["name"] == "test-server"
        assert result["healthy"] is False
        assert "not found" in result["reason"].lower()

    def test_result_has_required_keys(self):
        result = health_check("my-server", {"command": "no-such-binary-xyz123"})
        assert "name" in result
        assert "healthy" in result
        assert "reason" in result

    def test_healthy_returns_none_reason(self):
        # A long-running command (python sleeping) should be healthy
        result = health_check("sleeper", {
            "command": "python",
            "args": ["-c", "import time; time.sleep(10)"],
        })
        assert result["healthy"] is True
        assert result["reason"] is None

    def test_unhealthy_when_process_exits_immediately(self):
        result = health_check("crasher", {
            "command": "python",
            "args": ["-c", "import sys; sys.exit(1)"],
        })
        assert result["healthy"] is False

    def test_respects_env_overrides(self):
        result = health_check("env-test", {
            "command": "python",
            "args": ["-c", "import os, time; assert os.environ.get('TEST_VAR') == 'hello'; time.sleep(10)"],
            "env": {"TEST_VAR": "hello"},
        })
        assert result["healthy"] is True


class TestCli:
    """Tests for cli entry point."""

    def test_unknown_command_exits_with_1(self):
        with patch.object(sys, "argv", ["mcp-bouncer", "nonexistent-command"]):
            with pytest.raises(SystemExit) as exc_info:
                cli()
            assert exc_info.value.code == 1

    def test_status_on_missing_file(self, capsys):
        with patch.object(sys, "argv", ["mcp-bouncer", "status", "/tmp/nonexistent-mcp.json"]):
            cli()
        captured = capsys.readouterr()
        assert "No servers configured" in captured.out


class TestVersionAlignment:
    """Ensure __init__.py and pyproject.toml versions match."""

    def test_versions_match(self):
        from mcp_bouncer import __version__

        pyproject = Path(__file__).resolve().parents[1] / "pyproject.toml"
        for line in pyproject.read_text().splitlines():
            stripped = line.strip()
            if stripped.startswith("version"):
                pyproject_version = stripped.split("=", 1)[1].strip().strip('"')
                assert __version__ == pyproject_version, (
                    f"__init__.py ({__version__}) != pyproject.toml ({pyproject_version})"
                )
                return
        raise AssertionError("version not found in pyproject.toml")
