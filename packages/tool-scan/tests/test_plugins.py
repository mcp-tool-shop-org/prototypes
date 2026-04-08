"""Tests for the plugin system (Issue #7)."""

from __future__ import annotations

import os
import tempfile
from typing import Any

import pytest

from tool_scan.compliance_checker import ComplianceLevel, ComplianceStatus
from tool_scan.grader import MCPToolGrader
from tool_scan.plugins import (
    ComplianceCheckSpec,
    ComplianceRulePlugin,
    PluginRegistry,
    QualityCheckSpec,
    QualityRulePlugin,
    SecurityRulePlugin,
    ThreatPatternSpec,
)
from tool_scan.security_scanner import SecurityScanner, ThreatCategory, ThreatSeverity

# =============================================================================
# Test plugin implementations
# =============================================================================


class MockSecurityPlugin(SecurityRulePlugin):
    @property
    def name(self) -> str:
        return "mock-security"

    @property
    def version(self) -> str:
        return "1.0.0"

    @property
    def description(self) -> str:
        return "Mock security rules for testing"

    def get_threat_patterns(self) -> list[ThreatPatternSpec]:
        return [
            ThreatPatternSpec(
                pattern=r"internal\.corp\.example",
                category=ThreatCategory.DATA_EXFILTRATION,
                severity=ThreatSeverity.HIGH,
                title="Internal domain reference",
                description="Tool references internal corporate domain",
                mitigation="Remove internal domain references",
            ),
        ]


class MockCompliancePlugin(ComplianceRulePlugin):
    @property
    def name(self) -> str:
        return "mock-compliance"

    @property
    def version(self) -> str:
        return "1.0.0"

    def get_compliance_checks(self) -> list[ComplianceCheckSpec]:
        def check_org_prefix(tool: dict[str, Any]) -> tuple[ComplianceStatus, str, str | None]:
            name = tool.get("name", "")
            if name.startswith("org_"):
                return ComplianceStatus.PASS, "Tool has org prefix", None
            return ComplianceStatus.FAIL, "Tool must have 'org_' prefix", "Add 'org_' prefix to name"

        return [
            ComplianceCheckSpec(
                id="ORG-001",
                name="Organization naming convention",
                level=ComplianceLevel.RECOMMENDED,
                check_fn=check_org_prefix,
            ),
        ]


class MockQualityPlugin(QualityRulePlugin):
    @property
    def name(self) -> str:
        return "mock-quality"

    @property
    def version(self) -> str:
        return "1.0.0"

    def get_quality_checks(self) -> list[QualityCheckSpec]:
        def check_short_name(tool: dict[str, Any]) -> tuple[float, str | None]:
            name = tool.get("name", "")
            if len(name) > 30:
                return 5.0, f"Tool name '{name}' is too long (>{30} chars)"
            return 0.0, None

        return [
            QualityCheckSpec(
                id="QUAL-ORG-001",
                name="Name length check",
                check_fn=check_short_name,
                description="Checks tool name isn't too long",
            ),
        ]


# =============================================================================
# PluginRegistry tests
# =============================================================================


class TestPluginRegistry:
    def test_register_security_plugin(self):
        registry = PluginRegistry()
        plugin = MockSecurityPlugin()
        registry.register(plugin)

        assert len(registry.plugins) == 1
        assert registry.plugins[0].name == "mock-security"
        assert registry.plugins[0].plugin_type == "security"
        assert len(registry.security_plugins) == 1

    def test_register_compliance_plugin(self):
        registry = PluginRegistry()
        plugin = MockCompliancePlugin()
        registry.register(plugin)

        assert len(registry.compliance_plugins) == 1
        assert registry.plugins[0].plugin_type == "compliance"

    def test_register_quality_plugin(self):
        registry = PluginRegistry()
        plugin = MockQualityPlugin()
        registry.register(plugin)

        assert len(registry.quality_plugins) == 1
        assert registry.plugins[0].plugin_type == "quality"

    def test_register_invalid_type(self):
        registry = PluginRegistry()
        with pytest.raises(TypeError, match="must be SecurityRulePlugin"):
            registry.register("not a plugin")  # type: ignore[arg-type]

    def test_get_all_threat_patterns(self):
        registry = PluginRegistry()
        registry.register(MockSecurityPlugin())

        patterns = registry.get_all_threat_patterns()
        assert len(patterns) == 1
        assert patterns[0].title == "Internal domain reference"

    def test_get_all_compliance_checks(self):
        registry = PluginRegistry()
        registry.register(MockCompliancePlugin())

        checks = registry.get_all_compliance_checks()
        assert len(checks) == 1
        assert checks[0].id == "ORG-001"

    def test_get_all_quality_checks(self):
        registry = PluginRegistry()
        registry.register(MockQualityPlugin())

        checks = registry.get_all_quality_checks()
        assert len(checks) == 1
        assert checks[0].id == "QUAL-ORG-001"

    def test_clear(self):
        registry = PluginRegistry()
        registry.register(MockSecurityPlugin())
        registry.register(MockCompliancePlugin())
        registry.register(MockQualityPlugin())

        assert len(registry.plugins) == 3
        registry.clear()
        assert len(registry.plugins) == 0

    def test_discover_entry_points_no_crash(self):
        """Entry point discovery should not crash even with no plugins installed."""
        registry = PluginRegistry()
        loaded = registry.discover_entry_points()
        assert loaded >= 0  # May be 0 in test environment

    def test_load_directory_nonexistent(self):
        registry = PluginRegistry()
        loaded = registry.load_directory("/nonexistent/path")
        assert loaded == 0

    def test_load_directory_with_plugin(self):
        """Test loading plugins from a directory."""
        plugin_code = '''
from tool_scan.plugins import SecurityRulePlugin, ThreatPatternSpec
from tool_scan.security_scanner import ThreatCategory, ThreatSeverity

class TestDirPlugin(SecurityRulePlugin):
    @property
    def name(self):
        return "dir-plugin"

    @property
    def version(self):
        return "0.1.0"

    def get_threat_patterns(self):
        return [
            ThreatPatternSpec(
                pattern=r"forbidden_word",
                category=ThreatCategory.TOOL_POISONING,
                severity=ThreatSeverity.MEDIUM,
                title="Forbidden word detected",
                description="Test pattern from directory plugin",
            ),
        ]
'''
        with tempfile.TemporaryDirectory() as tmpdir:
            plugin_file = os.path.join(tmpdir, "my_rule.py")
            with open(plugin_file, "w") as f:
                f.write(plugin_code)

            registry = PluginRegistry()
            loaded = registry.load_directory(tmpdir)

            assert loaded == 1
            assert registry.plugins[0].name == "dir-plugin"
            assert registry.plugins[0].source == "directory"

    def test_load_directory_skips_underscore_files(self):
        """Files starting with _ should be skipped."""
        with tempfile.TemporaryDirectory() as tmpdir:
            with open(os.path.join(tmpdir, "_private.py"), "w") as f:
                f.write("# private file")
            with open(os.path.join(tmpdir, "__init__.py"), "w") as f:
                f.write("")

            registry = PluginRegistry()
            loaded = registry.load_directory(tmpdir)
            assert loaded == 0

    def test_multiple_plugins_registered(self):
        registry = PluginRegistry()
        registry.register(MockSecurityPlugin())
        registry.register(MockCompliancePlugin())
        registry.register(MockQualityPlugin())

        assert len(registry.plugins) == 3
        assert len(registry.security_plugins) == 1
        assert len(registry.compliance_plugins) == 1
        assert len(registry.quality_plugins) == 1


# =============================================================================
# Plugin integration with SecurityScanner
# =============================================================================


class TestSecurityPluginIntegration:
    def test_plugin_pattern_detected(self):
        """Plugin threat patterns should be detected during scanning."""
        patterns = MockSecurityPlugin().get_threat_patterns()
        scanner = SecurityScanner(plugin_patterns=patterns)

        tool = {
            "name": "test_tool",
            "description": "Sends data to internal.corp.example for processing",
            "inputSchema": {"type": "object"},
        }

        result = scanner.scan(tool)
        titles = [t.title for t in result.threats]
        assert "Internal domain reference" in titles

    def test_plugin_pattern_not_false_positive(self):
        """Plugin patterns should not trigger on clean tools."""
        patterns = MockSecurityPlugin().get_threat_patterns()
        scanner = SecurityScanner(plugin_patterns=patterns)

        tool = {
            "name": "safe_tool",
            "description": "A perfectly safe tool for data processing",
            "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
        }

        result = scanner.scan(tool)
        plugin_threats = [t for t in result.threats if t.title == "Internal domain reference"]
        assert len(plugin_threats) == 0


# =============================================================================
# Plugin integration with Grader
# =============================================================================


class TestGraderPluginIntegration:
    def test_grader_with_security_plugin(self):
        """Grader should use security plugin patterns."""
        registry = PluginRegistry()
        registry.register(MockSecurityPlugin())

        grader = MCPToolGrader(strict_security=False, plugin_registry=registry)

        tool = {
            "name": "corp_tool",
            "description": "Connects to internal.corp.example endpoint",
            "inputSchema": {"type": "object"},
        }

        report = grader.grade(tool)
        remark_titles = [r.title for r in report.remarks]
        assert any("Internal domain" in t for t in remark_titles)

    def test_grader_with_compliance_plugin(self):
        """Grader should run compliance plugin checks."""
        registry = PluginRegistry()
        registry.register(MockCompliancePlugin())

        grader = MCPToolGrader(strict_security=False, plugin_registry=registry)

        # Tool without org_ prefix should fail plugin check
        tool = {
            "name": "my_tool",
            "description": "A tool without org prefix for testing compliance plugin",
            "inputSchema": {"type": "object"},
        }

        report = grader.grade(tool)
        # The compliance check should appear in remarks
        compliance_remarks = [r for r in report.remarks if "ORG-001" in r.title]
        assert len(compliance_remarks) > 0

    def test_grader_with_quality_plugin(self):
        """Grader should run quality plugin checks."""
        registry = PluginRegistry()
        registry.register(MockQualityPlugin())

        grader = MCPToolGrader(strict_security=False, plugin_registry=registry)

        tool = {
            "name": "a_very_long_tool_name_that_exceeds_thirty_characters",
            "description": "Tests quality plugin integration for tool name length check",
            "inputSchema": {"type": "object"},
        }

        report = grader.grade(tool)
        quality_remarks = [r for r in report.remarks if "QUAL-ORG-001" in str(r)]
        assert len(quality_remarks) > 0

    def test_grader_without_plugins(self):
        """Grader should work normally without any plugins."""
        grader = MCPToolGrader(strict_security=False)

        tool = {
            "name": "normal_tool",
            "description": "A normal tool that works without plugins",
            "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
        }

        report = grader.grade(tool)
        assert report.score > 0
        assert report.tool_name == "normal_tool"
