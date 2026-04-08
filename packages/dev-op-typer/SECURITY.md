# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.1.x   | :white_check_mark: Current |

## Reporting a Vulnerability

**Email:** 64996768+mcp-tool-shop@users.noreply.github.com

1. **Do NOT** open a public issue for security vulnerabilities
2. Email the address above with a detailed description
3. Include steps to reproduce if applicable

### Response timeline

| Action | Target |
|--------|--------|
| Acknowledge report | 48 hours |
| Assess severity | 7 days |
| Release fix | 30 days |

## Scope

Dev-Op-Typer is a **local-first** WinUI 3 desktop application for developer typing practice.

- **Data accessed:** User typing input (real-time during practice), profile data and session history in `%LOCALAPPDATA%/DevOpTyper/`, user-authored snippet packs (JSON), community content bundles (.ldtpack)
- **Data NOT accessed:** No cloud sync. No telemetry. No analytics. No network calls. No authentication required
- **Permissions:** File system read/write for local user data directory. No elevated permissions required
- **No telemetry** is collected or sent
