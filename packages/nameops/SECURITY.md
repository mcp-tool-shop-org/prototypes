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

NameOps is a **CLI orchestrator** for batch name clearance runs.

- **Data touched:** Name lists (`data/names.txt`). Profile config (`data/profile.json`). Clearance result artifacts. PR body generation
- **Data NOT touched:** No telemetry. No analytics. No credentials stored beyond COE CLI config
- **Network:** Delegates to clearance-opinion-engine CLI for external lookups
- **Permissions:** Read: name lists, profile config. Write: result artifacts, PR body output
- **No telemetry** is collected or sent
