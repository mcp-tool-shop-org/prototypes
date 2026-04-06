"""Tests for security scanner module."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from headless_wheel_builder.security.models import (
    ScanResult,
    ScanType,
    SecurityIssue,
    Severity,
    VulnerabilityInfo,
)
from headless_wheel_builder.security.scanner import ScannerConfig, SecurityScanner


class TestScannerConfig:
    """Test ScannerConfig defaults."""

    def test_defaults(self) -> None:
        config = ScannerConfig()
        assert config.fail_on_critical is True
        assert config.fail_on_high is False
        assert config.timeout == 300
        assert config.ignore_ids == []

    def test_custom_config(self) -> None:
        config = ScannerConfig(
            project_path="/my/project",
            fail_on_high=True,
            ignore_ids=["CVE-2024-0001"],
        )
        assert config.fail_on_high is True
        assert "CVE-2024-0001" in config.ignore_ids


class TestParsePipAuditOutput:
    """Test pip-audit JSON output parsing."""

    def test_empty_output(self) -> None:
        scanner = SecurityScanner()
        result = scanner._parse_pip_audit_output([])
        assert result == []

    def test_single_vulnerability(self) -> None:
        scanner = SecurityScanner()
        data = [
            {
                "name": "requests",
                "version": "2.28.0",
                "vulns": [
                    {
                        "id": "PYSEC-2023-001",
                        "fix_versions": ["2.31.0"],
                        "description": "Session fixation vulnerability",
                        "aliases": ["CVE-2023-32681"],
                    }
                ],
            }
        ]
        result = scanner._parse_pip_audit_output(data)
        assert len(result) == 1
        assert result[0].id == "PYSEC-2023-001"
        assert result[0].package == "requests"
        assert result[0].installed_version == "2.28.0"
        assert result[0].fixed_version == "2.31.0"

    def test_multiple_vulns_per_package(self) -> None:
        scanner = SecurityScanner()
        data = [
            {
                "name": "urllib3",
                "version": "1.26.0",
                "vulns": [
                    {"id": "PYSEC-2023-100", "fix_versions": ["1.26.5"]},
                    {"id": "PYSEC-2023-200", "fix_versions": []},
                ],
            }
        ]
        result = scanner._parse_pip_audit_output(data)
        assert len(result) == 2
        assert result[0].fixed_version == "1.26.5"
        assert result[1].fixed_version is None

    def test_no_vulns(self) -> None:
        scanner = SecurityScanner()
        data = [{"name": "click", "version": "8.1.7", "vulns": []}]
        result = scanner._parse_pip_audit_output(data)
        assert result == []


class TestParseBanditOutput:
    """Test bandit JSON output parsing."""

    def test_empty_output(self) -> None:
        scanner = SecurityScanner()
        result = scanner._parse_bandit_output({"results": []})
        assert result == []

    def test_single_issue(self) -> None:
        scanner = SecurityScanner()
        data = {
            "results": [
                {
                    "test_id": "B301",
                    "issue_severity": "HIGH",
                    "issue_text": "Use of pickle detected",
                    "filename": "src/utils.py",
                    "line_number": 42,
                    "code": "import pickle",
                    "issue_confidence": "HIGH",
                }
            ]
        }
        result = scanner._parse_bandit_output(data)
        assert len(result) == 1
        assert result[0].type == "B301"
        assert result[0].severity == Severity.HIGH
        assert result[0].message == "Use of pickle detected"
        assert result[0].file == "src/utils.py"
        assert result[0].line == 42

    def test_unknown_severity(self) -> None:
        scanner = SecurityScanner()
        data = {
            "results": [
                {
                    "test_id": "B999",
                    "issue_severity": "EXTREME",
                    "issue_text": "Something unusual",
                    "issue_confidence": "LOW",
                }
            ]
        }
        result = scanner._parse_bandit_output(data)
        assert len(result) == 1
        assert result[0].severity == Severity.UNKNOWN


class TestCountBySeverity:
    """Test severity counting."""

    def test_empty(self) -> None:
        scanner = SecurityScanner()
        assert scanner._count_by_severity([]) == {}

    def test_mixed_severities(self) -> None:
        scanner = SecurityScanner()
        vulns = [
            VulnerabilityInfo(id="1", package="a", installed_version="1.0", severity=Severity.HIGH),
            VulnerabilityInfo(id="2", package="b", installed_version="1.0", severity=Severity.HIGH),
            VulnerabilityInfo(id="3", package="c", installed_version="1.0", severity=Severity.LOW),
        ]
        counts = scanner._count_by_severity(vulns)
        assert counts == {"high": 2, "low": 1}

    def test_count_issues_by_severity(self) -> None:
        scanner = SecurityScanner()
        issues = [
            SecurityIssue(type="B301", severity=Severity.CRITICAL, message="x"),
            SecurityIssue(type="B302", severity=Severity.MEDIUM, message="y"),
        ]
        counts = scanner._count_issues_by_severity(issues)
        assert counts == {"critical": 1, "medium": 1}


class TestShouldFail:
    """Test build failure determination."""

    def test_no_results(self) -> None:
        scanner = SecurityScanner()
        assert scanner.should_fail([]) is False

    def test_critical_triggers_failure(self) -> None:
        config = ScannerConfig(fail_on_critical=True)
        scanner = SecurityScanner(config)
        result = ScanResult(
            scan_type=ScanType.VULNERABILITY,
            success=True,
            vulnerabilities=[
                VulnerabilityInfo(
                    id="1", package="a", installed_version="1.0", severity=Severity.CRITICAL
                ),
            ],
        )
        assert scanner.should_fail([result]) is True

    def test_high_doesnt_fail_by_default(self) -> None:
        scanner = SecurityScanner()
        result = ScanResult(
            scan_type=ScanType.VULNERABILITY,
            success=True,
            vulnerabilities=[
                VulnerabilityInfo(
                    id="1", package="a", installed_version="1.0", severity=Severity.HIGH
                ),
            ],
        )
        assert scanner.should_fail([result]) is False

    def test_high_fails_when_configured(self) -> None:
        config = ScannerConfig(fail_on_high=True)
        scanner = SecurityScanner(config)
        result = ScanResult(
            scan_type=ScanType.VULNERABILITY,
            success=True,
            vulnerabilities=[
                VulnerabilityInfo(
                    id="1", package="a", installed_version="1.0", severity=Severity.HIGH
                ),
            ],
        )
        assert scanner.should_fail([result]) is True

    def test_low_never_fails(self) -> None:
        config = ScannerConfig(fail_on_critical=True, fail_on_high=True)
        scanner = SecurityScanner(config)
        result = ScanResult(
            scan_type=ScanType.VULNERABILITY,
            success=True,
            vulnerabilities=[
                VulnerabilityInfo(
                    id="1", package="a", installed_version="1.0", severity=Severity.LOW
                ),
            ],
        )
        assert scanner.should_fail([result]) is False

    def test_code_issues_trigger_failure(self) -> None:
        config = ScannerConfig(fail_on_critical=True)
        scanner = SecurityScanner(config)
        result = ScanResult(
            scan_type=ScanType.CODE_SECURITY,
            success=True,
            issues=[
                SecurityIssue(type="B301", severity=Severity.CRITICAL, message="pickle"),
            ],
        )
        assert scanner.should_fail([result]) is True


class TestScanVulnerabilities:
    """Test vulnerability scanning with mocked subprocesses."""

    @pytest.mark.asyncio
    async def test_pip_audit_not_found(self) -> None:
        scanner = SecurityScanner()
        with patch("headless_wheel_builder.security.scanner.shutil.which", return_value=None):
            result = await scanner.scan_vulnerabilities()
        assert result.success is False
        assert "pip-audit not found" in result.error

    @pytest.mark.asyncio
    async def test_bandit_not_found(self) -> None:
        scanner = SecurityScanner()
        with patch("headless_wheel_builder.security.scanner.shutil.which", return_value=None):
            result = await scanner.scan_code_security()
        assert result.success is False
        assert "bandit not found" in result.error

    @pytest.mark.asyncio
    async def test_ignore_ids_filters_results(self) -> None:
        config = ScannerConfig(ignore_ids=["PYSEC-2023-001"])
        scanner = SecurityScanner(config)

        mock_process = AsyncMock()
        mock_process.communicate = AsyncMock(
            return_value=(
                b'[{"name": "pkg", "version": "1.0", "vulns": [{"id": "PYSEC-2023-001", "fix_versions": []}, {"id": "PYSEC-2023-002", "fix_versions": []}]}]',
                b"",
            )
        )
        mock_process.returncode = 0

        with (
            patch(
                "headless_wheel_builder.security.scanner.shutil.which",
                return_value="/usr/bin/pip-audit",
            ),
            patch("asyncio.create_subprocess_exec", return_value=mock_process),
            patch("asyncio.wait_for", return_value=mock_process.communicate.return_value),
        ):
            result = await scanner.scan_vulnerabilities()

        assert result.success is True
        assert len(result.vulnerabilities) == 1
        assert result.vulnerabilities[0].id == "PYSEC-2023-002"


class TestScanResultModel:
    """Test ScanResult model properties."""

    def test_has_critical_vuln(self) -> None:
        result = ScanResult(
            scan_type=ScanType.VULNERABILITY,
            success=True,
            vulnerabilities=[
                VulnerabilityInfo(
                    id="1", package="a", installed_version="1.0", severity=Severity.CRITICAL
                ),
            ],
        )
        assert result.has_critical is True
        assert result.has_high is True

    def test_has_critical_issue(self) -> None:
        result = ScanResult(
            scan_type=ScanType.CODE_SECURITY,
            success=True,
            issues=[SecurityIssue(type="B301", severity=Severity.CRITICAL, message="x")],
        )
        assert result.has_critical is True

    def test_no_critical(self) -> None:
        result = ScanResult(
            scan_type=ScanType.VULNERABILITY,
            success=True,
            vulnerabilities=[
                VulnerabilityInfo(
                    id="1", package="a", installed_version="1.0", severity=Severity.MEDIUM
                ),
            ],
        )
        assert result.has_critical is False
        assert result.has_high is False

    def test_total_issues(self) -> None:
        result = ScanResult(
            scan_type=ScanType.ALL,
            success=True,
            vulnerabilities=[
                VulnerabilityInfo(id="1", package="a", installed_version="1.0"),
                VulnerabilityInfo(id="2", package="b", installed_version="1.0"),
            ],
            issues=[SecurityIssue(type="B1", severity=Severity.LOW, message="x")],
        )
        assert result.total_issues == 3

    def test_severity_counts(self) -> None:
        result = ScanResult(
            scan_type=ScanType.ALL,
            success=True,
            vulnerabilities=[
                VulnerabilityInfo(
                    id="1", package="a", installed_version="1.0", severity=Severity.HIGH
                ),
            ],
            issues=[
                SecurityIssue(type="B1", severity=Severity.LOW, message="x"),
                SecurityIssue(type="B2", severity=Severity.LOW, message="y"),
            ],
        )
        counts = result.get_severity_counts()
        assert counts["high"] == 1
        assert counts["low"] == 2
        assert counts["critical"] == 0

    def test_to_dict(self) -> None:
        result = ScanResult(
            scan_type=ScanType.VULNERABILITY,
            success=True,
            duration_seconds=1.5,
        )
        d = result.to_dict()
        assert d["scan_type"] == "vulnerability"
        assert d["success"] is True
        assert d["total_issues"] == 0
        assert d["duration_seconds"] == 1.5


class TestSeverityFromCvss:
    """Test CVSS score to severity mapping."""

    def test_critical(self) -> None:
        assert Severity.from_cvss(9.5) == Severity.CRITICAL

    def test_high(self) -> None:
        assert Severity.from_cvss(7.5) == Severity.HIGH

    def test_medium(self) -> None:
        assert Severity.from_cvss(5.0) == Severity.MEDIUM

    def test_low(self) -> None:
        assert Severity.from_cvss(2.0) == Severity.LOW

    def test_zero(self) -> None:
        assert Severity.from_cvss(0.0) == Severity.UNKNOWN
