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
- **Data touched:** Local `.json` / `.jsonl` files in user-specified output directories; Ollama API on localhost for synthetic data generation
- **Data NOT touched:** No cloud APIs, no telemetry endpoints, no credential files, no system files
- **Network:** HTTP to local Ollama instance only (`http://localhost:11434`). No other network egress
- **No secrets handling** — does not read, store, or transmit credentials
- **No telemetry** is collected or sent
