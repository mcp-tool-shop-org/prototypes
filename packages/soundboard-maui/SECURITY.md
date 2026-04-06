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

Soundboard MAUI is a **desktop client + .NET SDK** for voice synthesis engines.

- **Data touched:** WebSocket connections to local voice engine, audio playback, engine configuration
- **Data NOT touched:** No telemetry, no analytics, no cloud sync, no credentials stored
- **Permissions:** Network: WebSocket to configurable engine URL (default localhost). Audio: playback device access
- **No telemetry** is collected or sent
