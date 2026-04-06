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

mcp-aside is an **MCP server** with an in-memory interjection inbox.

- **Data touched:** In-memory inbox only — no database, no files, no persistence
- **Data NOT touched:** No cloud sync. No telemetry. No file system access
- **Network:** stdio transport only — no network listeners. No egress
- **No secrets handling** — does not read, store, or transmit credentials
- **No telemetry** is collected or sent
- **Ephemeral by design:** Restart = clean slate. No data survives server stop
