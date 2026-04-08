# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |

## Reporting a Vulnerability

Email: **64996768+mcp-tool-shop@users.noreply.github.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Version affected
- Potential impact

### Response timeline

| Action | Target |
|--------|--------|
| Acknowledge report | 48 hours |
| Assess severity | 7 days |
| Release fix | 30 days |

## Scope

StressKit MCP is a **health and security testing toolkit** for MCP servers.

- **Data touched:** MCP server connections (stdio/SSE), test results, JSON reports written to disk
- **Data NOT touched:** No telemetry, no analytics, no credential storage, no cloud sync
- **Permissions:** Network: connects to target MCP servers only. Disk: writes JSON reports to output directory
- **No telemetry** is collected or sent
