---
title: Plugins
description: Extend Tool-Scan with custom security rules, compliance checks, and quality validators.
sidebar:
  order: 3.1
---

Tool-Scan's plugin system lets you add custom rules without modifying the core scanner. Plugins can add security threat patterns, compliance checks, and quality validators.

## Plugin types

| Type | Base class | What it adds |
|------|-----------|--------------|
| Security | `SecurityRulePlugin` | Custom threat detection patterns |
| Compliance | `ComplianceRulePlugin` | Custom compliance checks |
| Quality | `QualityRulePlugin` | Custom quality validators |

## Writing a security plugin

Security plugins add regex patterns that are checked alongside built-in threat detection:

```python
from tool_scan.plugins import SecurityRulePlugin, ThreatPatternSpec
from tool_scan.security_scanner import ThreatCategory, ThreatSeverity

class OrgSecurityRules(SecurityRulePlugin):
    @property
    def name(self):
        return "org-security"

    @property
    def version(self):
        return "1.0.0"

    def get_threat_patterns(self):
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
```

## Writing a compliance plugin

Compliance plugins add checks that validate tool definitions against custom requirements:

```python
from tool_scan.plugins import ComplianceRulePlugin, ComplianceCheckSpec
from tool_scan.compliance_checker import ComplianceLevel, ComplianceStatus

class OrgComplianceRules(ComplianceRulePlugin):
    @property
    def name(self):
        return "org-compliance"

    @property
    def version(self):
        return "1.0.0"

    def get_compliance_checks(self):
        def check_org_prefix(tool):
            name = tool.get("name", "")
            if name.startswith("org_"):
                return ComplianceStatus.PASS, "Tool has org prefix", None
            return ComplianceStatus.FAIL, "Tool must have 'org_' prefix", "Add 'org_' prefix"

        return [
            ComplianceCheckSpec(
                id="ORG-001",
                name="Organization naming convention",
                level=ComplianceLevel.RECOMMENDED,
                check_fn=check_org_prefix,
            ),
        ]
```

## Writing a quality plugin

Quality plugins add checks that deduct points from the quality score:

```python
from tool_scan.plugins import QualityRulePlugin, QualityCheckSpec

class OrgQualityRules(QualityRulePlugin):
    @property
    def name(self):
        return "org-quality"

    @property
    def version(self):
        return "1.0.0"

    def get_quality_checks(self):
        def check_name_length(tool):
            name = tool.get("name", "")
            if len(name) > 30:
                return 5.0, f"Tool name '{name}' is too long (>30 chars)"
            return 0.0, None

        return [
            QualityCheckSpec(
                id="QUAL-ORG-001",
                name="Name length check",
                check_fn=check_name_length,
                description="Tool names should be 30 characters or fewer",
            ),
        ]
```

## Loading plugins

### CLI: `--plugin-dir`

Place `.py` files in a directory and pass it to the CLI:

```bash
tool-scan --plugin-dir ./my_rules tools/*.json
```

All `.py` files in the directory (except those starting with `_`) are loaded automatically. Plugin classes are discovered by checking for subclasses of the base plugin types.

### Programmatic: `PluginRegistry`

```python
from tool_scan.plugins import PluginRegistry

registry = PluginRegistry()

# Load .py files from a directory
registry.load_directory("./my_rules")

# Discover pip-installed plugins via entry points
registry.discover_entry_points()

# Register a plugin instance directly
registry.register(OrgSecurityRules())
```

### Entry points (pip packages)

Distribute plugins as pip packages using the `tool_scan.plugins` entry point group:

```toml
# pyproject.toml
[project.entry-points."tool_scan.plugins"]
org-security = "my_package:OrgSecurityRules"
```

Once installed, plugins are discovered automatically by `registry.discover_entry_points()` and by the CLI.

## Using plugins with the grader

```python
from tool_scan import MCPToolGrader
from tool_scan.plugins import PluginRegistry

registry = PluginRegistry()
registry.load_directory("./my_rules")

grader = MCPToolGrader(plugin_registry=registry)
report = grader.grade(tool)
```

Plugin security patterns, compliance checks, and quality checks all integrate seamlessly with the grading system. Plugin findings appear in the `GradeReport.remarks` list alongside built-in findings.
