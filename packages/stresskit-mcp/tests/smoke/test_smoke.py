#!/usr/bin/env python3
"""
Smoke tests for StressKit CLI.

Verifies:
1. stdout is pure JSON in --json mode
2. Report schema is correct
3. Exit codes match status
4. Profile listing works
"""

import json
import subprocess
import sys
from pathlib import Path

import pytest

TEST_ROOT = Path(__file__).parent
SUITE_ROOT = TEST_ROOT.parent.parent
CLI_ROOT = SUITE_ROOT / "engines" / "stresskit-cli"


def run_cli(command: str, args: list[str]) -> tuple[str, str, int]:
    """Run the CLI and return stdout, stderr, exit code."""
    cmd = [
        sys.executable,
        "-m", "stresskit_cli",
        command,
        *args,
    ]

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        cwd=str(CLI_ROOT),
        timeout=30,
    )

    return result.stdout, result.stderr, result.returncode


class TestVersionCommand:
    """Version command tests."""

    def test_version_returns_json(self):
        stdout, stderr, code = run_cli("version", ["--json"])
        assert code == 0

        data = json.loads(stdout)
        assert "cli_version" in data
        assert "schema_version" in data
        assert data["schema_version"] == "0.1"

    def test_version_human_readable(self):
        stdout, stderr, code = run_cli("version", [])
        assert code == 0
        assert "stresskit" in stdout.lower()
        assert "0.1" in stdout


class TestProfilesCommand:
    """Profiles command tests."""

    def test_profiles_lists_all(self):
        stdout, stderr, code = run_cli("profiles", ["--json"])
        assert code == 0

        data = json.loads(stdout)
        assert "profiles" in data

        profile_ids = [p["profile_id"] for p in data["profiles"]]
        assert "mcp-core" in profile_ids
        assert "mcp-ops" in profile_ids
        assert "mcp-secure" in profile_ids
        assert "mcp-trust" in profile_ids

    def test_profiles_have_checks(self):
        stdout, stderr, code = run_cli("profiles", ["--json"])
        data = json.loads(stdout)

        for profile in data["profiles"]:
            assert profile["check_count"] > 0, f"{profile['profile_id']} should have checks"


class TestCheckCommand:
    """Check command tests.

    Note: --dry-run is used to avoid spawning actual processes during tests.
    """

    def test_check_produces_report(self):
        stdout, stderr, code = run_cli("check", ["echo", "hello", "--json", "--dry-run"])

        data = json.loads(stdout)
        assert "schema_version" in data
        assert data["schema_version"] == "0.1"
        assert "run_id" in data
        assert "targets" in data
        assert "profiles" in data
        assert "summary" in data
        assert "runs" in data
        assert "findings" in data

    def test_check_summary_structure(self):
        stdout, _, _ = run_cli("check", ["echo", "hello", "--json", "--dry-run"])
        data = json.loads(stdout)

        summary = data["summary"]
        assert "status" in summary
        assert summary["status"] in ["PASS", "WARN", "FAIL", "ERROR"]
        assert "totals" in summary
        assert "severity_counts" in summary

        totals = summary["totals"]
        assert "runs" in totals
        assert "checks" in totals
        assert "passed" in totals
        assert "failed" in totals
        assert "skipped" in totals

    def test_check_target_structure(self):
        stdout, _, _ = run_cli("check", ["node", "server.js", "--json", "--dry-run"])
        data = json.loads(stdout)

        assert len(data["targets"]) == 1
        target = data["targets"][0]
        assert "target_id" in target
        assert "display_name" in target
        assert "transport" in target
        assert "identity" in target
        assert target["transport"]["kind"] == "stdio"
        assert target["transport"]["command"] == "node"
        assert target["transport"]["args"] == ["server.js"]
        assert "server_name" in target["identity"]

    def test_check_metrics_structure(self):
        stdout, _, _ = run_cli("check", ["echo", "test", "--json", "--dry-run"])
        data = json.loads(stdout)

        assert "metrics" in data
        metrics = data["metrics"]
        assert "latency_ms" in metrics
        assert "throughput_rps" in metrics
        assert "reliability" in metrics
        assert "overall" in metrics["latency_ms"]
        assert "p50" in metrics["latency_ms"]["overall"]

    def test_check_with_profile(self):
        stdout, _, _ = run_cli("check", ["echo", "test", "--json", "-p", "mcp-ops", "--dry-run"])
        data = json.loads(stdout)

        profile_ids = [p["profile_id"] for p in data["profiles"]]
        assert "mcp-ops" in profile_ids

    def test_check_with_multiple_profiles(self):
        stdout, _, _ = run_cli("check", ["echo", "test", "--json", "-p", "mcp-core", "-p", "mcp-secure", "--dry-run"])
        data = json.loads(stdout)

        profile_ids = [p["profile_id"] for p in data["profiles"]]
        assert "mcp-core" in profile_ids
        assert "mcp-secure" in profile_ids


class TestExitCodes:
    """Exit code semantics tests."""

    def test_pass_exits_0(self):
        _, _, code = run_cli("check", ["echo", "hello", "--json", "--dry-run"])
        # With placeholder checks that skip, should be PASS
        assert code == 0

    def test_version_exits_0(self):
        _, _, code = run_cli("version", ["--json"])
        assert code == 0

    def test_profiles_exits_0(self):
        _, _, code = run_cli("profiles", ["--json"])
        assert code == 0

    def test_targets_exits_0(self):
        _, _, code = run_cli("targets", ["--json"])
        assert code == 0


class TestTargetsCommand:
    """Targets command tests."""

    def test_targets_lists_configured(self):
        stdout, stderr, code = run_cli("targets", ["--json"])
        assert code == 0

        data = json.loads(stdout)
        assert "targets" in data
        # Should have targets from stresskit.targets.json
        assert len(data["targets"]) > 0

    def test_targets_have_fingerprints(self):
        stdout, _, _ = run_cli("targets", ["--json"])
        data = json.loads(stdout)

        for target in data["targets"]:
            assert "fingerprint" in target
            assert len(target["fingerprint"]) == 16  # 16 hex chars

    def test_targets_have_fixture_info(self):
        stdout, _, _ = run_cli("targets", ["--json"])
        data = json.loads(stdout)

        for target in data["targets"]:
            assert "has_fixtures" in target
            assert "invoke_smoke" in target["has_fixtures"]


class TestValidateCommand:
    """Validate command tests."""

    def test_validate_valid_report(self, tmp_path):
        # First generate a report
        stdout, _, _ = run_cli("check", ["echo", "test", "--json", "--dry-run"])
        report = json.loads(stdout)

        # Save to file
        report_file = tmp_path / "report.json"
        report_file.write_text(json.dumps(report))

        # Validate it
        stdout, _, code = run_cli("validate", [str(report_file), "--json"])
        assert code == 0

        data = json.loads(stdout)
        assert data["valid"] is True

    def test_validate_invalid_json(self, tmp_path):
        report_file = tmp_path / "bad.json"
        report_file.write_text("not json")

        _, stderr, code = run_cli("validate", [str(report_file)])
        assert code == 1
        assert "Invalid JSON" in stderr

    def test_validate_missing_fields(self, tmp_path):
        report_file = tmp_path / "incomplete.json"
        report_file.write_text('{"schema_version": "0.1"}')

        _, stderr, code = run_cli("validate", [str(report_file)])
        assert code == 1
        assert "Missing required fields" in stderr


class TestReportContract:
    """Report contract invariants."""

    def test_runs_reference_valid_targets(self):
        stdout, _, _ = run_cli("check", ["echo", "test", "--json", "--dry-run"])
        data = json.loads(stdout)

        target_ids = {t["target_id"] for t in data["targets"]}
        for run in data["runs"]:
            assert run["target_id"] in target_ids

    def test_findings_reference_valid_runs(self):
        stdout, _, _ = run_cli("check", ["echo", "test", "--json", "-p", "mcp-core", "--dry-run"])
        data = json.loads(stdout)

        run_ids = {r["run_id"] for r in data["runs"]}
        run_ids.add(data["run_id"])  # Include main run_id

        for finding in data["findings"]:
            # Finding run_id should match main run_id (prefix)
            assert finding["run_id"].startswith(data["run_id"].split("-")[0])

    def test_summary_totals_match_runs(self):
        stdout, _, _ = run_cli("check", ["echo", "test", "--json", "--dry-run"])
        data = json.loads(stdout)

        summary = data["summary"]
        assert summary["totals"]["runs"] == len(data["runs"])

    def test_severity_counts_match_findings(self):
        stdout, _, _ = run_cli("check", ["echo", "test", "--json", "--dry-run"])
        data = json.loads(stdout)

        severity_counts = data["summary"]["severity_counts"]
        findings = data["findings"]

        assert severity_counts["critical"] == sum(1 for f in findings if f["severity"] == "critical")
        assert severity_counts["high"] == sum(1 for f in findings if f["severity"] == "high")
        assert severity_counts["medium"] == sum(1 for f in findings if f["severity"] == "medium")
        assert severity_counts["low"] == sum(1 for f in findings if f["severity"] == "low")
        assert severity_counts["info"] == sum(1 for f in findings if f["severity"] == "info")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
