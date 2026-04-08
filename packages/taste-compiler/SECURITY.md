# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| < 1.0   | No        |

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

Taste Compiler is a **local-only static analysis tool**. It reads source files and YAML configuration, then produces JSON/Markdown reports.

- **Data touched:** YAML taste source files, compiled JSON taste packs, TSX/JSX/CSS source files (read-only), violation reports (written to stdout or file)
- **Data NOT touched:** no network requests, no databases, no user credentials, no runtime application state
- **Permissions required:** filesystem read access to source files, write access for pack output and reports
- **No telemetry** is collected or sent
- **No secrets handling** — does not read, store, or transmit credentials
- **No network egress** — operates entirely offline
