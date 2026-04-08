# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |
| < 1.0   | No        |

## Scope

Registrum is a **structural registrar library**. It validates state transitions against invariants and maintains deterministic, replayable history.

- **Data touched:** In-memory state transitions, optional JSON snapshots to local filesystem
- **Data NOT touched:** No network requests, no external APIs, no databases, no user credentials
- **Permissions:** Read/write only to user-specified snapshot paths (when persistence is used)
- **Network:** None — fully offline library
- **Telemetry:** None collected or sent
- **Code execution:** None — validates data structures only, never executes user code

The optional external attestation feature (XRPL) is disabled by default and requires explicit configuration.

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
