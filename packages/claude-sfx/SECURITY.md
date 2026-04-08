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

This tool operates **locally only**.
- **Data touched:** `~/.claude-sfx/config.json` (user preferences), `.claude/settings.json` (hook registration in project directory), WAV audio buffers in memory
- **Data NOT touched:** source code, git history, network, credentials, environment variables
- **No network egress** — all audio is synthesized locally from math, no audio files downloaded
- **No secrets handling** — does not read, store, or transmit credentials
- **No telemetry** is collected or sent
- **Permissions required:** filesystem read/write for config and hook registration, OS audio playback (PowerShell/afplay/aplay)
