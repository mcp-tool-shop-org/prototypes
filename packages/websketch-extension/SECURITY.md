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

WebSketch Extension is a **Chrome browser extension** for capturing web pages as WebSketch IR.

- **Data touched:** Current tab DOM (read-only), captured WebSketch IR JSON (clipboard/download)
- **Data NOT touched:** No telemetry, no analytics, no remote servers, no credential storage
- **Permissions** | Chrome: activeTab (current page DOM). No persistent storage, no background network
- **No telemetry** is collected or sent
