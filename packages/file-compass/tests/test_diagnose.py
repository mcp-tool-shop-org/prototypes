"""Tests for the diagnose command."""

import json
import subprocess
import sys


def run_cli(*args: str) -> subprocess.CompletedProcess:
    """Run file_compass CLI as subprocess."""
    return subprocess.run(
        [sys.executable, "-m", "file_compass", *args],
        capture_output=True,
        text=True,
        timeout=15,
    )


class TestDiagnoseCommand:
    """Tests for cmd_diagnose."""

    def test_diagnose_help(self):
        """diagnose appears in help output."""
        result = run_cli("--help")
        assert "diagnose" in result.stdout

    def test_diagnose_json_output_structure(self):
        """--json output has correct structure."""
        result = run_cli("diagnose", "--json")
        data = json.loads(result.stdout)
        assert "version" in data
        assert "status" in data
        assert "checks" in data
        assert "passed" in data
        assert "total" in data
        assert isinstance(data["checks"], list)
        assert data["status"] in ("ok", "degraded")

    def test_diagnose_json_checks_have_required_fields(self):
        """Each check has name, passed, and message fields."""
        result = run_cli("diagnose", "--json")
        data = json.loads(result.stdout)
        for check in data["checks"]:
            assert "name" in check
            assert "passed" in check
            assert "message" in check
            assert isinstance(check["passed"], bool)

    def test_diagnose_text_output(self):
        """Text output includes version and status line."""
        result = run_cli("diagnose")
        assert "File Compass" in result.stdout
        assert "Diagnostics" in result.stdout
        assert "Status:" in result.stdout

    def test_diagnose_checks_ollama(self):
        """Diagnose checks for Ollama connectivity."""
        result = run_cli("diagnose", "--json")
        data = json.loads(result.stdout)
        check_names = [c["name"] for c in data["checks"]]
        assert "ollama_reachable" in check_names

    def test_diagnose_checks_index(self):
        """Diagnose checks for HNSW index and SQLite DB."""
        result = run_cli("diagnose", "--json")
        data = json.loads(result.stdout)
        check_names = [c["name"] for c in data["checks"]]
        assert "hnsw_index" in check_names
        assert "sqlite_db" in check_names
