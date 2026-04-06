# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.1.x   | Yes       |

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

MouseTrainer is a **.NET MAUI desktop app** for deterministic mouse dexterity training.

- **Data touched:** Local replay files (`.mtr` binary format). User settings in app data directory. Audio assets (bundled)
- **Data NOT touched:** No network. No telemetry. No analytics. No cloud sync. No user accounts
- **Network:** None — fully offline desktop application
- **Permissions:** Read/write: local app data directory only
- **No telemetry** is collected or sent

### Security Model

- **Fully offline:** No network access, no listeners, no egress
- **Deterministic simulation:** xorshift32 RNG, FNV-1a hashing — no platform-dependent randomness
- **Replay verification:** Binary replay format with hash verification prevents tampering
- **Modular monolith:** Enforced one-way dependencies, no platform leakage into domain libraries
