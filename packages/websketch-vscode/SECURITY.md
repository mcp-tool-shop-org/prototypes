# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| 0.2.x   | No        |

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

WebSketch is a VS Code extension that captures web pages as structured IR using a local browser.

- **Data touched:** URLs entered by the user (navigated via puppeteer-core using local Chrome/Edge), captured page content converted to IR tree, exports written to workspace files or clipboard
- **Data NOT touched:** no files outside the workspace, no OS credentials, no login sessions (uses headless browser with no profile)
- **Network:** navigates to user-specified URLs only — no other outbound requests
- **No telemetry** is collected or sent
- **No secrets** in source or diagnostics output
