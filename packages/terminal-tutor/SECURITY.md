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

This tool operates **locally only**.

- **Data touched:** Temporary workspace directories (created in OS temp dir), lesson progress file (`~/.terminal-tutor/progress.json`), scaffold files from lesson specs
- **Data NOT touched:** No user projects, no home directory files, no system configs, no browser data, no credentials
- **No network egress** — shell and venv runtimes make no network calls. Docker runtime pulls images only during first setup.
- **No secrets handling** — does not read, store, or transmit credentials or API keys
- **No telemetry** is collected or sent
- **Workspace isolation** — all practice files are created in isolated temp directories and cleaned up on session end
