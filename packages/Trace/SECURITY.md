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

Trace is a **deterministic desktop game** built on .NET MAUI.

- **Data touched** | Game state (in-memory), high scores (local only), simulation parameters
- **Data NOT touched** | No telemetry, no analytics, no network calls, no cloud sync, no credentials
- **Permissions** | Input: mouse/keyboard. Display: GPU rendering. No filesystem writes except user settings
- **No telemetry** is collected or sent
