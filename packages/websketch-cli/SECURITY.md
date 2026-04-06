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

WebSketch CLI is a **command-line tool** for rendering, diffing, and fingerprinting WebSketch IR captures.

- **Data touched:** WebSketch IR JSON files (read), rendered output (write to stdout/files)
- **Data NOT touched:** No telemetry, no analytics, no network calls, no credential storage
- **Permissions:** Read: input JSON files. Write: output files to user-specified paths
- **No telemetry** is collected or sent
