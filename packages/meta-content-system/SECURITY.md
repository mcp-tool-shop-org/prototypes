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

Meta Content System is a **.NET library** for typing-practice content pipelines.

- **Data touched:** Source code files (read-only for content extraction). Generated `library.index.json` output
- **Data NOT touched:** No network. No telemetry. No analytics. No user data. No credentials
- **Network:** None — pure computation library, fully offline
- **Permissions:** Read: source files for content extraction. Write: library index output only
- **No telemetry** is collected or sent

### Security Model

- **Pure computation:** Deterministic pipeline from source files to indexed content library
- **SHA-256 content addressing:** Content IDs derived from normalized content, preventing injection
- **No external dependencies at runtime** — built entirely on .NET BCL
