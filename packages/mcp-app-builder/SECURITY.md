# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |
| < 1.0.0 | No        |

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

This is a VS Code extension that runs entirely within the editor.

- **Data touched:** workspace files (mcp.json, mcp-tools.json, generated TypeScript files), VS Code settings, extension output channels, webview HTML (dashboard)
- **Data NOT touched:** source code content beyond MCP config files, git history, network, user credentials, environment variables
- **Network:** connects to MCP servers on localhost only (for test harness, user-configured port). No external network calls.
- **File writes:** scaffolded project files (user-initiated), generated type files (user-initiated). All writes are to the user's workspace directory.
- **No telemetry** is collected or sent
- **No secrets handling** — does not read, store, or transmit credentials
