# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | :white_check_mark: Current |

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

FlexiFlow is a **local-first** async component engine library.

- **Data accessed:** In-process state machine data, optional SQLite persistence for state history, event bus messages (in-memory)
- **Data NOT accessed:** No cloud sync. No telemetry. No analytics. No network calls. No authentication
- **Permissions:** File system write only for optional SQLite persistence. No elevated permissions required
- **No telemetry** is collected or sent
