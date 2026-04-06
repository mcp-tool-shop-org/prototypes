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

WebSketch MCP is an **MCP server** exposing WebSketch IR tools for LLM agents via stdio transport.

- **Data touched:** WebSketch IR JSON captures received via MCP protocol (in-memory processing only)
- **Data NOT touched:** No telemetry, no analytics, no persistent storage, no credential storage
- **Permissions:** stdio transport only — no network egress, no filesystem writes
- **Network:** No outbound network connections — server communicates only via stdin/stdout
- **No telemetry** is collected or sent
