---
title: Reference
description: Quick reference for Tool-Scan CLI flags and Python API.
sidebar:
  order: 6
---

## CLI flags

| Flag | Description |
|------|-------------|
| `--strict` / `-s` | Fail on any security issue |
| `--min-score N` | Set minimum passing score (default: 70) |
| `--json` / `-j` | Output results as JSON |
| `--format {text,json,sarif}` | Output format (default: text) |
| `--compact-json` | Emit single-line JSON (~50% smaller) |
| `--stream` | Stream JSON incrementally (low memory) |
| `--jobs N` | Number of parallel scanning threads (default: 1) |
| `--plugin-dir DIR` | Load custom rule plugins from directory |
| `--output-schema` | Print the JSON output schema and exit |
| `--verbose` / `-v` | Show all remarks and details |
| `--no-color` | Disable colored output |
| `--include-optional` | Include optional enterprise checks |
| (positional) | One or more tool definition files, globs, or `-` for stdin |

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | All tools passed |
| 1 | One or more tools failed |
| 2 | Error loading files |

## Python imports

| Import | Purpose |
|--------|---------|
| `from tool_scan import grade_tool` | Quick single-tool grading |
| `from tool_scan import MCPToolGrader` | Batch grading with custom config |
| `from tool_scan import SecurityScanner` | Security-only scanning |
| `from tool_scan import ComplianceChecker` | MCP spec compliance checking |
| `from tool_scan import PluginRegistry` | Plugin loading and management |
| `from tool_scan.plugins import SecurityRulePlugin` | Base class for security rules |
| `from tool_scan.plugins import ComplianceRulePlugin` | Base class for compliance rules |
| `from tool_scan.plugins import QualityRulePlugin` | Base class for quality validators |
| `from tool_scan.sarif import grade_reports_to_sarif` | SARIF output generation |

## Score weights

| Component | Weight |
|-----------|--------|
| Security | 40% |
| Compliance | 35% |
| Quality | 25% |

## Severity levels

| Level | Color | Action |
|-------|-------|--------|
| Critical | Red | Blocks in strict mode, caps grade at F |
| High | Orange | Blocks in strict mode |
| Medium | Yellow | Blocks only with `fail_on_medium=True` |
| Low | Blue | Informational, minor deduction (5 points) |

## Links

- [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
- [GitHub Repository](https://github.com/mcp-tool-shop-org/tool-scan)
- [PyPI Package](https://pypi.org/project/tool-scan/)
