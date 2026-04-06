# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | :white_check_mark: Current |

## Reporting a Vulnerability

**Email:** 64996768+mcp-tool-shop@users.noreply.github.com

1. **Do NOT** open a public issue for security vulnerabilities
2. Email the address above with a detailed description
3. Include steps to reproduce if applicable

### Response timeline

| Action | Target |
|--------|--------|
| Acknowledge report | 48 hours |
| Assess severity | 7 days |
| Release fix | 30 days |

## Scope

Game Dev MCP is an MCP server that bridges LLMs to game engine editors (Unreal Engine 5).

- **Data accessed:** Game engine Remote Control API responses (localhost only), level/actor/property data from the running editor
- **Data NOT accessed:** No cloud sync. No telemetry. No analytics. No authentication
- **Permissions:** Localhost network only (127.0.0.1 by default). Communicates with game engine's Remote Control API on configurable port. No file system access beyond standard Node.js
- **No telemetry** is collected or sent
