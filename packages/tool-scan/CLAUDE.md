# Tool Scan

## What This Does

Security and dependency scanning for mcp-tool-shop repositories.
Audits tools for vulnerabilities, licensing issues, and metadata completeness.

## MCP Tools Available

| Tool | Purpose |
|------|---------|
| `scan_repo` | Audit repository for security/compliance |
| `check_deps` | Scan dependencies for vulnerabilities |
| `verify_metadata` | Validate tool metadata completeness |
| `generate_report` | Create audit report for repository |

## Scanning Coverage

- Dependency vulnerability scanning (pip-audit, npm audit)
- License compliance checking
- Metadata validation (README, CHANGELOG, CLAUDE.md)
- GitHub Actions workflow analysis
- Security hardening recommendations

## Architecture

- Multi-language dependency scanning
- Pluggable security scanner backends
- Configurable audit policies
- Report generation and export

## Dependencies

- Python >= 3.11
- mcp >= 1.0.0
- pip-audit
- safety

## Key Notes

- Scans local and remote repositories
- Integrates with GitHub Actions
- Generates audit scoreboard
- Supports custom scanning policies
