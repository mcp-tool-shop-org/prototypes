---
title: Reference
description: Architecture, transport modes, error codes, and development guide.
sidebar:
  order: 6
---

## Architecture

MCP File Forge runs as an MCP server. Every incoming tool call passes through the security layer before reaching the tool implementation.

```
Client (Claude Desktop, CLI, remote agent)
  |
  v
MCP Server
  |
  v
Security Layer
  ├─ Sandbox (path validation, allowed/denied paths)
  ├─ Symlink check (optional)
  └─ Read-only gate (blocks write tools when enabled)
  |
  v
Tool Implementation (read, write, search, metadata, scaffold)
  |
  v
File System
```

### Source layout

| Directory | Purpose |
|-----------|---------|
| `src/index.ts` | Entry point, process error handlers |
| `src/server.ts` | Server creation, stdio and HTTP transport setup |
| `src/config/` | Configuration loading and merging |
| `src/security/` | Sandbox enforcement, read-only mode |
| `src/tools/` | Tool implementations (read, write, search, metadata, scaffold) |
| `src/utils/` | Logger, error formatting, path validation |
| `src/types.ts` | Zod schemas for all inputs, config, and error codes |
| `src/version.ts` | Reads version from package.json at runtime |

## Transport modes

MCP File Forge supports two transport modes, selected automatically at startup.

### Stdio (default)

When no `PORT` environment variable is set, the server uses **stdio transport**. Communication happens through stdin/stdout using the MCP JSON-RPC protocol. This is the standard mode for Claude Desktop and local CLI usage.

### HTTP (remote deployment)

When the `PORT` environment variable is set, the server starts an **HTTP server** using `StreamableHTTPServerTransport` with stateful sessions. Each client gets its own MCP server instance. This mode is designed for deployment on platforms like Fly.io.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/mcp` | POST | MCP protocol requests (creates sessions on first call) |
| `/mcp` | GET | SSE streams for existing sessions |
| `/mcp` | DELETE | Session termination |
| `/health` | GET | Health check (returns server name and version) |

Sessions are identified by the `mcp-session-id` header. A new session is created when a POST arrives without a session ID.

## Error codes

All tool errors return a structured JSON object with `code`, `message`, and optional `details`. The error codes are:

| Code | Meaning |
|------|---------|
| `PATH_OUTSIDE_SANDBOX` | Path is outside allowed directories or traversal detected |
| `FILE_NOT_FOUND` | File or directory does not exist |
| `PERMISSION_DENIED` | OS-level permission error (EACCES) |
| `FILE_TOO_LARGE` | File exceeds `max_file_size` limit |
| `DEPTH_EXCEEDED` | Recursive operation hit `max_depth` limit |
| `INVALID_ENCODING` | Unsupported file encoding requested |
| `WRITE_DISABLED` | Write operation attempted in read-only mode |
| `DIRECTORY_NOT_EMPTY` | Non-recursive delete on a non-empty directory |
| `ALREADY_EXISTS` | Target exists and overwrite is `false` |
| `INVALID_PATH` | Path is empty, contains null bytes, exceeds length, or regex is invalid |
| `UNKNOWN_ERROR` | Catch-all for unexpected failures |

### Error response shape

```json
{
  "code": "FILE_NOT_FOUND",
  "message": "File not found: /some/path.txt",
  "details": {}
}
```

The `details` field provides additional context when available (e.g., `size` and `limit` for `FILE_TOO_LARGE`, or `allowed_paths` for `PATH_OUTSIDE_SANDBOX`).

## Supported encodings

The `read_file` and `write_file` tools accept an `encoding` parameter. Supported values:

`utf-8`, `utf8`, `utf-16le`, `utf16le`, `latin1`, `binary`, `ascii`, `base64`, `hex`

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

## Related documentation

| Document | Description |
|----------|-------------|
| [CHANGELOG.md](https://github.com/mcp-tool-shop-org/mcp-file-forge/blob/main/CHANGELOG.md) | Release history |
| [SECURITY.md](https://github.com/mcp-tool-shop-org/mcp-file-forge/blob/main/SECURITY.md) | Security policy and vulnerability reporting |
