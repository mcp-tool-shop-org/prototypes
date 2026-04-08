"""
SARIF Output Formatter
======================

Generates Static Analysis Results Interchange Format (SARIF) v2.1.0 output
for integration with security scanning ecosystems.

SARIF is the standard format consumed by:
- GitHub Code Scanning / Security tab
- Azure DevOps
- VS Code SARIF Viewer
- OWASP DefectDojo
- Many CI/CD security dashboards

References:
- https://sarifweb.azurewebsites.net/
- https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html
"""

from __future__ import annotations

from importlib.metadata import version as _pkg_version
from typing import Any

from .grader import GradeReport, RemarkCategory


def grade_reports_to_sarif(
    reports: dict[str, GradeReport],
    tool_version: str | None = None,
) -> dict[str, Any]:
    """Convert grade reports to SARIF v2.1.0 format.

    Args:
        reports: Map of tool names to grade reports
        tool_version: Override for tool-scan version string

    Returns:
        SARIF v2.1.0 JSON-serializable dict
    """
    if tool_version is None:
        try:
            tool_version = _pkg_version("tool-scan")
        except Exception:
            tool_version = "0.0.0"

    # Collect unique rules from all reports
    rules: dict[str, dict[str, Any]] = {}
    results: list[dict[str, Any]] = []

    for tool_name, report in reports.items():
        # Security threats → SARIF results
        if report.security_result:
            for threat in report.security_result.threats:
                rule_id = f"TOOL-SCAN/{threat.category.name}"

                if rule_id not in rules:
                    rules[rule_id] = {
                        "id": rule_id,
                        "name": threat.category.name,
                        "shortDescription": {
                            "text": f"{threat.category.name.replace('_', ' ').title()} Detection",
                        },
                        "helpUri": "https://github.com/mcp-tool-shop-org/tool-scan#readme",
                        "properties": {
                            "tags": ["security", "mcp"],
                        },
                    }

                    # Add CWE/OWASP tags if available
                    if threat.cwe_id:
                        rules[rule_id]["properties"]["tags"].append(threat.cwe_id)
                    if threat.owasp_id:
                        rules[rule_id]["properties"]["tags"].append(threat.owasp_id)

                result_entry: dict[str, Any] = {
                    "ruleId": rule_id,
                    "level": _severity_to_sarif_level(threat.severity.name),
                    "message": {
                        "text": f"[{tool_name}] {threat.title}: {threat.description}",
                    },
                    "locations": [
                        {
                            "logicalLocations": [
                                {
                                    "name": tool_name,
                                    "kind": "module",
                                    "fullyQualifiedName": f"{tool_name}.{threat.location}",
                                }
                            ],
                        }
                    ],
                    "properties": {
                        "toolName": tool_name,
                        "location": threat.location,
                        "severity": threat.severity.name,
                    },
                }

                if threat.mitigation:
                    result_entry["fixes"] = [
                        {
                            "description": {"text": threat.mitigation},
                        }
                    ]

                results.append(result_entry)

        # Compliance failures → SARIF results
        if report.compliance_result:
            for check in report.compliance_result.checks:
                if check.status.name not in ("FAIL", "WARN"):
                    continue

                rule_id = f"TOOL-SCAN/{check.id}"
                if rule_id not in rules:
                    rules[rule_id] = {
                        "id": rule_id,
                        "name": check.name,
                        "shortDescription": {"text": check.name},
                        "helpUri": check.spec_reference
                        or "https://github.com/mcp-tool-shop-org/tool-scan#readme",
                        "properties": {
                            "tags": ["compliance", "mcp"],
                        },
                    }

                level = "warning" if check.status.name == "WARN" else "error"
                result_entry = {
                    "ruleId": rule_id,
                    "level": level,
                    "message": {
                        "text": f"[{tool_name}] {check.message}",
                    },
                    "locations": [
                        {
                            "logicalLocations": [
                                {
                                    "name": tool_name,
                                    "kind": "module",
                                }
                            ],
                        }
                    ],
                    "properties": {
                        "toolName": tool_name,
                        "complianceLevel": check.level.name,
                    },
                }

                if check.details:
                    result_entry["fixes"] = [
                        {"description": {"text": check.details}}
                    ]

                results.append(result_entry)

        # Remarks (quality/best-practice) → SARIF results
        for remark in report.remarks:
            if remark.category in (RemarkCategory.CRITICAL, RemarkCategory.SECURITY):
                continue  # Already covered by security threats above

            rule_id = f"TOOL-SCAN/QUALITY/{remark.category.name}"
            if rule_id not in rules:
                rules[rule_id] = {
                    "id": rule_id,
                    "name": remark.category.name,
                    "shortDescription": {
                        "text": f"Quality: {remark.category.value}",
                    },
                    "properties": {"tags": ["quality", "mcp"]},
                }

            result_entry = {
                "ruleId": rule_id,
                "level": "note",
                "message": {
                    "text": f"[{tool_name}] {remark.title}: {remark.description}",
                },
                "locations": [
                    {
                        "logicalLocations": [
                            {"name": tool_name, "kind": "module"}
                        ],
                    }
                ],
                "properties": {"toolName": tool_name},
            }

            if remark.action:
                result_entry["fixes"] = [
                    {"description": {"text": remark.action}}
                ]

            results.append(result_entry)

    # Build SARIF envelope
    sarif: dict[str, Any] = {
        "$schema": "https://docs.oasis-open.org/sarif/sarif/v2.1.0/errata01/os/schemas/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [
            {
                "tool": {
                    "driver": {
                        "name": "tool-scan",
                        "semanticVersion": tool_version,
                        "informationUri": "https://github.com/mcp-tool-shop-org/tool-scan",
                        "rules": list(rules.values()),
                    },
                },
                "results": results,
                "invocations": [
                    {
                        "executionSuccessful": True,
                        "toolExecutionNotifications": [],
                    }
                ],
            }
        ],
    }

    return sarif


def _severity_to_sarif_level(severity: str) -> str:
    """Map tool-scan severity to SARIF level."""
    mapping = {
        "CRITICAL": "error",
        "HIGH": "error",
        "MEDIUM": "warning",
        "LOW": "note",
    }
    return mapping.get(severity, "note")
