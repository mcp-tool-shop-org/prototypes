# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| < 1.0   | No        |

## Scope

mcpt-link-fresh is a **drift-fixing automation tool** that syncs mutable listings back to canonical truth.

- **Data touched:** GitHub repo metadata (via GitHub API), README files (read/write), marketing site data files
- **Data NOT touched:** No user credentials stored, no databases, no telemetry
- **Permissions:** GitHub token required for API access (read repos, write metadata). Token is read from environment, never stored.
- **Network:** GitHub API only — no other external services
- **Telemetry:** None collected or sent

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
