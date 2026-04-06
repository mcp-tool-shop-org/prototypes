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

This plugin is a **Claude Code plugin** (agents + slash commands) that wraps an MCP server.

- **Data touched:** Plugin configuration files, slash command arguments, agent context
- **Data NOT touched:** No file system access beyond plugin config. No persistent storage. No user data collection
- **Network:** All network activity is handled by the underlying MCP server (`@mcptoolshop/ai-jam-session`), not this plugin
- **No secrets handling** — does not read, store, or transmit credentials
- **No telemetry** is collected or sent
