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

MCP File Forge is an **MCP server** providing sandboxed file operations for AI agents.

- **Data touched:** Files within explicitly allowed directories only. Config files, template directories, log files (optional)
- **Data NOT touched:** No cloud sync. No telemetry. No analytics. No data outside sandbox
- **Network:** stdio transport only — no network listeners. No egress
- **No secrets handling** — does not read, store, or transmit credentials
- **No telemetry** is collected or sent

### Security Model

- **Path sandboxing:** Every path is resolved to absolute and checked against `allowed_paths` before any I/O
- **Denied paths:** Glob patterns blocked even within allowed directories (e.g. `**/secrets/**`)
- **Symlink protection:** Symlinks not followed by default; denied if target resolves outside sandbox
- **Path traversal detection:** `..` sequences that escape the sandbox are rejected
- **Size limits:** Files larger than `max_file_size` are refused
- **Read-only mode:** Set `MCP_FILE_FORGE_READ_ONLY=true` to disable all write operations
- **Null-byte rejection:** Paths containing `\0` are refused
