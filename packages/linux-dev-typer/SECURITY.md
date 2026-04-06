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

Linux Dev Typer is a **fully offline** Avalonia desktop typing practice app.

- **Data touched:** Local state file (`~/.config/linux-dev-typer/state.json`), user snippet packs, `.ldtpack` import/export files
- **Data NOT touched:** No cloud sync. No telemetry. No analytics. No accounts. No network calls
- **Permissions:** Local file system for state persistence and content packs only
- **No secrets handling** — does not read, store, or transmit credentials
- **No telemetry** is collected or sent
