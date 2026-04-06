# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |

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

This tool operates **locally only** and is **read-only**.

- **Data touched:** Claude Code settings files (`~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, `~/.claude/managed-settings.json`). Read-only — never modifies any file.
- **Data NOT touched:** No API keys, tokens, env var values, or credentials are read or logged. The `env` block in settings is ignored entirely.
- **No network egress.** Zero API calls, zero telemetry, zero phone-home.
- **No secrets handling.** Does not read, store, or transmit credentials.
- **No telemetry** is collected or sent.
