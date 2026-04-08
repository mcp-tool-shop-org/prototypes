---
title: API Reference
description: Python API for Tool-Scan — grade_tool, MCPToolGrader, SecurityScanner, ComplianceChecker.
sidebar:
  order: 4
---

Tool-Scan provides three main classes, a plugin registry, and a convenience function for programmatic use.

## grade_tool()

The simplest way to scan a single tool:

```python
from tool_scan import grade_tool

report = grade_tool(tool, strict=True)
```

**Parameters:**
- `tool` — Dict containing the tool definition
- `strict` — Fail on any security issues (default: `True`)

**Returns:** `GradeReport` with:
- `score` — 0–100 numeric score
- `grade` — Letter grade (A+ to F)
- `is_safe` — Boolean safety status
- `is_compliant` — MCP spec compliance
- `remarks` — List of actionable recommendations

## MCPToolGrader

For batch scanning or custom configuration:

```python
from tool_scan import MCPToolGrader
from tool_scan.plugins import PluginRegistry

registry = PluginRegistry()
registry.load_directory("./my_rules")

grader = MCPToolGrader(
    strict_security=True,
    include_optional_checks=False,
    plugin_registry=registry,  # optional
)

report = grader.grade(tool)
reports = grader.grade_batch([tool1, tool2, tool3])
```

`grade_batch()` returns a `dict[str, GradeReport]` mapping tool names to reports. The `plugin_registry` parameter is optional — when provided, plugin security patterns, compliance checks, and quality checks are applied alongside built-in rules.

## SecurityScanner

For security-only scanning without grading:

```python
from tool_scan import SecurityScanner

scanner = SecurityScanner(
    enable_injection_scan=True,
    enable_command_scan=True,
    enable_sql_scan=True,
    enable_xss_scan=True,
    enable_ssrf_scan=True,
    fail_on_medium=False,
    plugin_patterns=patterns,  # optional
)

result = scanner.scan(tool)
print(result.is_safe)
print(result.threats)
```

Each `enable_*` flag controls a specific threat category. Set `fail_on_medium=True` to treat medium-severity findings as failures. The `plugin_patterns` parameter accepts a list of `ThreatPatternSpec` objects from security plugins.

## PluginRegistry

Central registry for loading and managing rule plugins:

```python
from tool_scan.plugins import PluginRegistry

registry = PluginRegistry()

# Load from a directory of .py files
registry.load_directory("./my_rules")

# Discover pip-installed plugins via entry points
registry.discover_entry_points()

# Programmatic registration
registry.register(MySecurityPlugin())

# Access loaded patterns and checks
patterns = registry.get_all_threat_patterns()
compliance_checks = registry.get_all_compliance_checks()
quality_checks = registry.get_all_quality_checks()

# List loaded plugins
for info in registry.plugins:
    print(f"{info.name} v{info.version} ({info.plugin_type})")
```

See the [Plugins handbook page](/tool-scan/handbook/plugins/) for full details on writing custom rules.

## ComplianceChecker

For MCP spec compliance checking without security scanning:

```python
from tool_scan import ComplianceChecker

checker = ComplianceChecker(
    check_required=True,
    check_recommended=True,
    check_optional=False,
)

report = checker.check(tool)
print(report.is_compliant)
print(report.compliance_score)
```

The three check levels correspond to the MCP spec's requirement tiers: required fields are mandatory, recommended fields improve quality, and optional fields are nice-to-have.
