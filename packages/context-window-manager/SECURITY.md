# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| < 1.0   | No        |

## Reporting a Vulnerability

**Email:** 64996768+mcp-tool-shop@users.noreply.github.com

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

**Response timeline:**
- Acknowledgment: within 48 hours
- Assessment: within 7 days
- Fix (if confirmed): within 30 days

## Scope

Context Window Manager is an **MCP server** for LLM context restoration via KV cache persistence.
- **Data accessed:** Reads/writes KV cache snapshots to local SQLite database. Communicates with local vLLM server for cache operations. All context data stays on-machine.
- **Data NOT accessed:** No telemetry. No cloud services. No credential storage. KV cache data is never transmitted externally.
- **Permissions required:** File system read/write for SQLite database. Network access to local vLLM server only. No elevated permissions required.
