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

prov-engine-js is a **zero-dependency provenance engine** for canonical JSON digests and MCP envelope wrapping.

- **Data touched:** JSON files read from disk for digest computation and envelope wrapping. SHA-256 hashes computed in-memory
- **Data NOT touched:** No telemetry. No analytics. No credential storage. No network calls. No state persistence
- **Permissions:** Read: JSON files specified as CLI arguments. Write: stdout only (all output is JSON to stdout)
- **Network:** None — fully offline, zero-dependency (uses only Node.js built-ins: `node:fs`, `node:crypto`, `node:process`)
- **Telemetry:** None collected or sent
