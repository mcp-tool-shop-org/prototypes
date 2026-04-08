---
title: Security Model
description: Sandboxing, path restrictions, and symlink protection.
sidebar:
  order: 4
---

MCP File Forge enforces multiple layers of protection to keep AI agents within their designated workspace. Security is not optional -- it is built into every file operation.

## Protection layers

### Path sandboxing
Every path is resolved to an absolute path and checked against the `allowed_paths` list before any I/O occurs. Operations targeting paths outside allowed directories are rejected immediately with a `PATH_OUTSIDE_SANDBOX` error.

### Denied paths
Glob patterns that are blocked even within allowed directories. The defaults block `**/node_modules/**` and `**/.git/**`. Add your own with `MCP_FILE_FORGE_DENIED_PATHS` or the `sandbox.denied_paths` config field. Pattern matching uses `minimatch` with dot-file support.

### Symlink protection
Symlinks are not followed by default. When a symlink is encountered, its real target path is resolved. If the target falls outside the sandbox, the operation is denied. Enable symlink following with `MCP_FILE_FORGE_FOLLOW_SYMLINKS=true` only when you trust all symlink targets within your allowed paths.

### Path traversal detection
`..` sequences that would escape the sandbox are rejected, regardless of how they are composed. The server tracks directory depth and rejects any path where `..` components would move above the starting point.

### Size limits
Files larger than `max_file_size` (default: 100 MB / 104,857,600 bytes) are refused to prevent memory exhaustion. Configure with `MCP_FILE_FORGE_MAX_FILE_SIZE`.

### Depth limits
Recursive operations are capped at `max_depth` levels (default: 20) to prevent runaway traversal. Configure with `MCP_FILE_FORGE_MAX_DEPTH`.

### Read-only mode
Set `MCP_FILE_FORGE_READ_ONLY=true` to disable all write operations. The following tools are blocked in read-only mode: `write_file`, `create_directory`, `copy_file`, `move_file`, `delete_file`, and `scaffold_project`. Only read, search, and metadata tools remain active.

### Null-byte rejection
Paths containing `\0` are refused. This prevents null-byte injection attacks that could bypass path validation on some systems.

### Windows long-path guard
Paths exceeding 32,767 characters are refused. This is the Windows API maximum path length.

## Data scope

| Aspect | Detail |
|--------|--------|
| **Data accessed** | Files within explicitly allowed directories only. Config files, template directories. |
| **Data NOT accessed** | No cloud sync. No telemetry. No analytics. No data outside the sandbox. |
| **Network (stdio mode)** | No network listeners, no egress. Communication is stdin/stdout only. |
| **Network (HTTP mode)** | Listens on the port specified by `PORT` env var. Intended for trusted deployment platforms. No outbound connections. |
| **Telemetry** | None collected or sent. |
