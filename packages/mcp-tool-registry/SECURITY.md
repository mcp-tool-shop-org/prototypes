# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |
| < 1.0   | No        |

## Reporting a Vulnerability

Email: **64996768+mcp-tool-shop@users.noreply.github.com**

Include:

- Description of the vulnerability
- Steps to reproduce
- Version affected
- Potential impact

### Response timeline

| Action             | Target   |
| ------------------ | -------- |
| Acknowledge report | 48 hours |
| Assess severity    | 7 days   |
| Release fix        | 30 days  |

## Scope

MCP Tool Registry is a metadata-only npm package containing JSON tool descriptions, schemas, and pre-built search indices.

- **Data touched:** `registry.json` (tool metadata — names, descriptions, tags, repo URLs), JSON Schema validation, derived search indices and bundle files written to `dist/`
- **Data NOT touched:** no user files, no OS credentials, no network requests at runtime (it's a static data package)
- **Network:** build scripts read local files only — no outbound requests. CI fetches npm dependencies only
- **No telemetry** is collected or sent
- **No secrets** in source or diagnostics output
- **No executable code** ships in the package — consumers import JSON data only
