# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| 0.x     | No        |

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

Venvkit is an npm CLI + library that scans Python virtual environments and generates diagnostic reports.

- **Data touched:** reads Python executables and pyvenv.cfg files on disk (read-only), spawns Python subprocesses for health checks, writes diagnostic reports to `.venvkit/` directory
- **Data NOT touched:** no modification of Python environments, no OS credentials, no user files outside `.venvkit/`
- **Network:** optional `--httpsProbe` flag tests SSL certificate verification — no other outbound requests
- **Subprocesses:** spawns `python` with controlled arguments only — no shell execution
- **No telemetry** is collected or sent
- **No secrets** in source or diagnostics output
