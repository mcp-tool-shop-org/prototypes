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

Feature-Reacher is a **local-first** Next.js web application for adoption risk analysis.

- **Data accessed:** User-pasted text (release notes, documentation), IndexedDB for audit history, localStorage for settings
- **Data NOT accessed:** No external analytics platforms. No external APIs. No authentication. No server-side storage
- **Permissions:** Browser-only. No file system access beyond standard web APIs. No network calls to external services
- **No telemetry** is collected or sent
