# MCP File Forge -- Handbook

> Comprehensive guide for `@mcptoolshop/file-forge` v0.2.0

---

## Table of Contents

1. [Why Sandboxed File Operations Matter](#why-sandboxed-file-operations-matter)
2. [Tool Reference](#tool-reference)
   - [Reading Tools](#reading-tools)
   - [Writing Tools](#writing-tools)
   - [Search Tools](#search-tools)
   - [Metadata Tools](#metadata-tools)
   - [Scaffolding Tools](#scaffolding-tools)
3. [Security Model](#security-model)
4. [Template System](#template-system)
5. [Configuration Guide](#configuration-guide)
6. [Integration Patterns](#integration-patterns)
7. [Architecture Overview](#architecture-overview)
8. [Error Codes](#error-codes)
9. [FAQ](#faq)

---

## Why Sandboxed File Operations Matter

When an AI agent can read and write files, the blast radius of a mistake is the entire file system. A misinterpreted instruction could overwrite production configs, leak secrets from `~/.ssh`, or silently follow a symlink into system directories.

MCP File Forge addresses this by placing every operation inside a **sandbox** -- a set of explicitly allowed directories. The server validates every path *before* any I/O occurs. Combined with symlink protection, denied-path patterns, size limits, and an optional read-only mode, the result is a file-access layer that is safe enough for autonomous agent loops while still being practical for real development work.

Key principles:

- **Deny by default.** If a path is not inside `allowed_paths`, the operation fails with a structured error -- no silent fallbacks.
- **Defence in depth.** Even within allowed paths, denied-path patterns can block sensitive subtrees like `**/secrets/**` or `**/.env`.
- **Symlinks are boundaries.** Symlinks that resolve outside the sandbox are rejected unless `follow_symlinks` is explicitly enabled.
- **Resource caps.** Size and depth limits prevent a single tool call from exhausting memory or running away with recursion.
- **Read-only escape hatch.** One environment variable disables every write tool, turning the server into a safe browsing-only companion.

---

## Tool Reference

### Reading Tools

#### `read_file`

Read the contents of a single file.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | `string` | *required* | Absolute or relative path to the file |
| `encoding` | `string` | `"utf-8"` | File encoding (`utf-8`, `ascii`, `latin1`, `base64`, `hex`, etc.) |
| `start_line` | `number` | `1` | First line to return (1-indexed) |
| `end_line` | `number` | EOF | Last line to return (inclusive) |
| `max_size_kb` | `number` | `10240` | Refuse files larger than this (KB) |

**Returns:** The file content as text.

**Errors:** `FILE_NOT_FOUND`, `FILE_TOO_LARGE`, `PERMISSION_DENIED`, `INVALID_PATH` (if path points to a directory).

---

#### `read_directory`

List the entries in a directory with optional recursion.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | `string` | *required* | Path to the directory |
| `recursive` | `boolean` | `false` | Recurse into subdirectories |
| `max_depth` | `number` | `5` | Maximum recursion depth |
| `include_hidden` | `boolean` | `false` | Include dot-prefixed entries |
| `pattern` | `string` | _none_ | Glob pattern to filter entry names |

**Returns:** JSON array of directory entries, each with `name`, `path`, `isFile`, `isDirectory`, and `size` (for files).

---

#### `read_multiple`

Batch-read several files in a single call.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `paths` | `string[]` | *required* | Array of file paths |
| `encoding` | `string` | `"utf-8"` | Encoding for all files |
| `fail_on_error` | `boolean` | `false` | If `true`, abort on the first error; otherwise return partial results |

**Returns:** JSON array of objects with `path`, `success`, `content` (on success), or `error` (on failure).

---

### Writing Tools

All writing tools are disabled when `MCP_FILE_FORGE_READ_ONLY=true`.

#### `write_file`

Write or overwrite a file.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | `string` | *required* | Destination file path |
| `content` | `string` | *required* | Content to write |
| `encoding` | `string` | `"utf-8"` | File encoding |
| `create_dirs` | `boolean` | `true` | Automatically create parent directories |
| `overwrite` | `boolean` | `true` | Overwrite existing files; `false` = fail if file exists |
| `backup` | `boolean` | `false` | Create a `.bak` copy before overwriting |

**Returns:** `{ success, path, bytes_written }`.

---

#### `create_directory`

Create a directory (and optionally its parents).

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | `string` | *required* | Directory to create |
| `recursive` | `boolean` | `true` | Create parent directories |

**Returns:** `{ success, path }`. If the directory already exists, it returns success with a note.

---

#### `copy_file`

Copy a file or directory tree.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `source` | `string` | *required* | Source path |
| `destination` | `string` | *required* | Destination path |
| `overwrite` | `boolean` | `false` | Overwrite existing destination |
| `recursive` | `boolean` | `true` | Copy directory contents recursively |

**Errors:** `ALREADY_EXISTS` (if destination exists and `overwrite` is false), `FILE_NOT_FOUND`, `INVALID_PATH` (directory source with `recursive: false`).

---

#### `move_file`

Move or rename a file or directory.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `source` | `string` | *required* | Source path |
| `destination` | `string` | *required* | Destination path |
| `overwrite` | `boolean` | `false` | Overwrite existing destination |

Parent directories of the destination are created automatically.

---

#### `delete_file`

Delete a file or directory.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | `string` | *required* | Path to delete |
| `recursive` | `boolean` | `false` | Required for non-empty directories |
| `force` | `boolean` | `false` | Suppress errors (always returns success) |

**Safety:** Deleting a non-empty directory without `recursive: true` returns `DIRECTORY_NOT_EMPTY`.

---

### Search Tools

#### `glob_search`

Find files matching a glob pattern.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pattern` | `string` | *required* | Glob pattern (e.g. `**/*.ts`) |
| `base_path` | `string` | cwd | Base directory for the search |
| `max_results` | `number` | `1000` | Cap on returned matches |
| `include_dirs` | `boolean` | `false` | Include directories in results |

**Returns:** `{ count, total_matches, truncated, results }` where each result has `path`, `name`, `isFile`, `isDirectory`, and `size`.

---

#### `grep_search`

Search file contents using a regular expression.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pattern` | `string` | *required* | JavaScript-flavour regex |
| `path` | `string` | cwd | File or directory to search |
| `glob` | `string` | `**/*` | File pattern filter (e.g. `*.ts`) |
| `case_sensitive` | `boolean` | `true` | Case-sensitive matching |
| `max_results` | `number` | `100` | Cap on returned matches |
| `context_lines` | `number` | `0` | Lines of context before and after each match |

**Returns:** `{ pattern, count, truncated, matches }` where each match has `file`, `line`, `column`, `match`, and optional `context`.

---

#### `find_by_content`

Simpler interface for literal (non-regex) text search.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | `string` | *required* | Literal text to find (special characters are escaped) |
| `path` | `string` | cwd | Directory to search |
| `file_pattern` | `string` | _all files_ | Glob filter for file names |
| `max_results` | `number` | `100` | Cap on returned matches |

Internally delegates to `grep_search` with the text escaped for regex.

---

### Metadata Tools

#### `file_stat`

Return detailed statistics for a file or directory.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | `string` | *required* | Path to inspect |

**Returns:** `{ path, name, size, sizeFormatted, isFile, isDirectory, isSymlink, created, modified, accessed }`.

---

#### `file_exists`

Check whether a path exists and optionally verify its type.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | `string` | *required* | Path to check |
| `type` | `"file"` / `"directory"` / `"any"` | `"any"` | Expected type |

**Returns:** `{ exists, path }` with additional fields `isFile` and `isDirectory` when the path exists.

---

#### `get_disk_usage`

Calculate the total size of a directory with a per-entry breakdown.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | `string` | *required* | Directory to measure |
| `max_depth` | `number` | `1` | Depth of the breakdown listing |

**Returns:** `{ path, totalSize, totalSizeFormatted, fileCount, directoryCount, breakdown }`.

---

#### `compare_files`

Compare size and timestamps of two paths.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path1` | `string` | *required* | First path |
| `path2` | `string` | *required* | Second path |

**Returns:** `{ path1, path2, sameType, sameSize, file1, file2, newerFile, sizeDifference, sizeDifferenceFormatted }`.

---

### Scaffolding Tools

#### `scaffold_project`

Create a new project by copying and processing a template directory.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `template` | `string` | *required* | Template name (looked up in template paths) or absolute/relative path to a template directory |
| `destination` | `string` | *required* | Where to create the project |
| `variables` | `Record<string, string>` | `{}` | Template variables to substitute |
| `overwrite` | `boolean` | `false` | Overwrite files in an existing destination |

Built-in variables that are always available:

| Variable | Value |
|----------|-------|
| `PROJECT_NAME` | Base name of the destination directory |
| `CURRENT_YEAR` | Four-digit year at scaffold time |
| `CURRENT_DATE` | ISO date (YYYY-MM-DD) at scaffold time |

**Returns:** `{ success, template, destination, files_created, files_skipped, variables_used }`.

---

#### `list_templates`

List all templates found in the configured template directories.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | `string` | _none_ | Filter by template category |

**Returns:** `{ template_paths, count, templates }` where each template has `name`, `path`, `description`, `category`, and `variables`.

---

## Security Model

### Allowed Paths

Every path argument is resolved to an absolute path and checked against the `allowed_paths` list. A path is allowed if it equals an allowed path or starts with an allowed path followed by a path separator.

```
allowed_paths: ["C:/Projects"]

C:/Projects/app/index.ts  -->  allowed
C:/Projects                -->  allowed
C:/Users/me/.bashrc        -->  DENIED (PATH_OUTSIDE_SANDBOX)
```

### Denied Paths

Even within allowed directories, glob patterns in `denied_paths` can block specific subtrees:

```json
{
  "denied_paths": ["**/secrets/**", "**/.env", "**/node_modules/**"]
}
```

Both the absolute path and the relative path (from cwd) are tested against each pattern.

### Symlink Protection

When `follow_symlinks` is `false` (the default), the server calls `lstat` on every path. If the path is a symbolic link, `realpath` is used to resolve the target. If the target falls outside the sandbox, the operation is denied with `PATH_OUTSIDE_SANDBOX`.

### Path Traversal Detection

Before sandbox checking, the server scans path components for `..` sequences. If the sequence would move the resolved path above the starting point (negative depth), the request is rejected immediately.

### File Size Limits

The `max_file_size` setting (default 100 MB) applies to both reads and writes. The `read_file` tool also has its own `max_size_kb` parameter that defaults to 10 MB.

### Recursion Depth Limits

Recursive operations (`read_directory`, `glob_search`, `grep_search`, `delete_file`, `copy_file`) are capped at `max_depth` levels (default 20).

### Read-Only Mode

Setting `MCP_FILE_FORGE_READ_ONLY=true` disables the following tools entirely:

- `write_file`
- `create_directory`
- `copy_file`
- `move_file`
- `delete_file`
- `scaffold_project`

Any call to a disabled tool returns the error code `WRITE_DISABLED` with a hint about the environment variable.

### Input Validation

Additional checks applied to all inputs:

- Empty or whitespace-only paths are rejected (`INVALID_PATH`).
- Paths containing null bytes (`\0`) are rejected.
- Paths longer than 32,767 characters (Windows `MAX_PATH` extended limit) are rejected.
- Glob patterns with more than 5 `**` wildcards are rejected to prevent runaway recursion.
- Regex patterns are validated before use; invalid patterns return an error rather than crashing.
- Encoding strings are validated against a known list (`utf-8`, `ascii`, `latin1`, `base64`, `hex`, `utf-16le`).

---

## Template System

### How Templates Work

A template is a directory containing files and an optional `template.json` manifest. When `scaffold_project` is called, the server:

1. Locates the template by name (searched in configured template paths) or by explicit path.
2. Reads `template.json` for metadata and variable definitions.
3. Copies every file from the template directory to the destination, skipping `template.json` itself.
4. During the copy, performs variable substitution in both file **contents** and file **names**.

### Variable Substitution

Two syntaxes are supported inside file contents:

- **Mustache-style:** `{{VARIABLE_NAME}}` (whitespace around the name is tolerated)
- **Shell-style:** `${VARIABLE_NAME}`

For file and directory names, use double-underscore syntax:

- `__VARIABLE_NAME__` in a file name is replaced with the variable's value.

Example: a file named `__PROJECT_NAME__.config.ts` with `PROJECT_NAME=my-app` becomes `my-app.config.ts`.

### Template Manifest (`template.json`)

```json
{
  "name": "typescript-starter",
  "description": "Basic TypeScript project with Node.js",
  "version": "1.0.0",
  "author": "mcp-tool-shop",
  "category": "nodejs",
  "variables": [
    {
      "name": "PROJECT_NAME",
      "description": "Name of the project",
      "required": true
    },
    {
      "name": "AUTHOR_NAME",
      "description": "Author name",
      "default": "Developer"
    },
    {
      "name": "DESCRIPTION",
      "description": "Project description",
      "default": "A TypeScript project"
    }
  ]
}
```

### Template Search Paths

Templates are searched in order:

1. `<cwd>/templates/`
2. `~/.mcp-file-forge/templates/` (user home directory)
3. Any additional paths specified via `MCP_FILE_FORGE_TEMPLATE_PATHS` or the `templates.paths` config key.

### Built-in Templates

The package ships with one starter template:

- **typescript-starter** -- a minimal TypeScript + Node.js project with `package.json`, `tsconfig.json`, and a `src/index.ts` entry point.

---

## Configuration Guide

### Sources and Priority

Configuration is merged from multiple sources. Later sources override earlier ones:

1. **Built-in defaults** (lowest priority)
2. **Config file** (`mcp-file-forge.json` or `.mcp-file-forge.json`, searched upward from cwd up to 5 levels)
3. **Environment variables** (highest priority)

### Full Config File Schema

```json
{
  "sandbox": {
    "allowed_paths": ["C:/Projects"],
    "denied_paths": ["**/secrets/**"],
    "follow_symlinks": false,
    "max_file_size": 104857600,
    "max_depth": 20
  },
  "templates": {
    "paths": ["./templates"]
  },
  "logging": {
    "level": "info",
    "file": "./logs/mcp-file-forge.log"
  },
  "read_only": false
}
```

### All Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `MCP_FILE_FORGE_ALLOWED_PATHS` | CSV | `.` | Directories the server may access |
| `MCP_FILE_FORGE_DENIED_PATHS` | CSV | `**/node_modules/**`, `**/.git/**` | Glob patterns to deny |
| `MCP_FILE_FORGE_READ_ONLY` | bool | `false` | Disable write tools |
| `MCP_FILE_FORGE_MAX_FILE_SIZE` | int (bytes) | `104857600` | File size ceiling |
| `MCP_FILE_FORGE_MAX_DEPTH` | int | `20` | Recursion depth ceiling |
| `MCP_FILE_FORGE_FOLLOW_SYMLINKS` | bool | `false` | Follow symlinks outside sandbox |
| `MCP_FILE_FORGE_TEMPLATE_PATHS` | CSV | `./templates` | Template directories |
| `MCP_FILE_FORGE_LOG_LEVEL` | enum | `info` | `error`, `warn`, `info`, or `debug` |
| `MCP_FILE_FORGE_LOG_FILE` | path | _none_ | Optional log file path |

### Logging

All log output goes to **stderr** because stdout is reserved for the MCP JSON-RPC protocol over STDIO. If `MCP_FILE_FORGE_LOG_FILE` is set, log lines are additionally appended to that file.

Log format:

```
[2026-02-12T10:30:45.123Z] [INFO ] [mcp-file-forge] Server connected and ready
```

---

## Integration Patterns

### Claude Desktop

See the [README](README.md#claude-desktop-configuration) for the JSON snippet.

### Claude Code (CLI)

Claude Code discovers MCP servers from `~/.claude/claude_desktop_config.json` or project-level `.claude/mcp.json`. Add the same configuration block shown in the README.

### Other MCP Clients

Any MCP client that supports the STDIO transport can launch File Forge. The only requirement is that the client spawns `node path/to/build/index.js` (or `npx @mcptoolshop/file-forge`) and communicates over stdin/stdout using JSON-RPC.

### Programmatic Usage

```typescript
import { createServer, createTransport } from '@mcptoolshop/file-forge';

const server = createServer();
const transport = createTransport();

await server.connect(transport);
```

---

## Architecture Overview

```
src/
  index.ts             Entry point (shebang, process error handlers, calls startServer)
  server.ts            Creates McpServer, registers all tool modules, connects transport
  types.ts             Zod schemas and TypeScript types for all tools and config
  config/
    index.ts           Loads and merges config from defaults, file, and env vars
  security/
    index.ts           Re-exports sandbox and read-only modules
    sandbox.ts         Sandbox class: path validation, symlink checks, size/depth limits
    read-only.ts       Read-only mode flag and write-tool guard
  tools/
    read.ts            read_file, read_directory, read_multiple
    write.ts           write_file, create_directory, copy_file, move_file, delete_file
    search.ts          glob_search, grep_search, find_by_content
    metadata.ts        file_stat, file_exists, get_disk_usage, compare_files
    scaffold.ts        scaffold_project, list_templates
  utils/
    index.ts           Re-exports all utilities
    errors.ts          Structured error creation, formatting, error-handling wrappers
    logger.ts          Logger class (stderr + optional file), global instance
    validation.ts      Input validators: encoding, path, glob, regex, line range
templates/
  typescript-starter/  Built-in starter template
```

### Data Flow

1. Client sends a JSON-RPC tool call over stdin.
2. `McpServer` (from `@modelcontextprotocol/sdk`) deserializes the request and dispatches to the registered tool handler.
3. The tool handler parses and validates input with Zod.
4. The sandbox validates the resolved path against `allowed_paths`, `denied_paths`, and symlink rules.
5. If read-only mode is active and the tool is a write tool, a `WRITE_DISABLED` error is returned.
6. The tool performs the file-system operation.
7. The result (or structured error) is returned as a JSON-RPC response on stdout.

### Dependencies

| Package | Purpose |
|---------|---------|
| `@modelcontextprotocol/sdk` | MCP server framework and STDIO transport |
| `glob` | Glob pattern matching for `glob_search` and `grep_search` |
| `minimatch` | Denied-path pattern matching in the sandbox |
| `zod` | Schema validation for tool inputs and configuration |

---

## Error Codes

| Code | Meaning |
|------|---------|
| `PATH_OUTSIDE_SANDBOX` | The resolved path is not within any allowed directory, or a symlink escapes the sandbox |
| `FILE_NOT_FOUND` | The target file or directory does not exist |
| `PERMISSION_DENIED` | The operating system denied access (EACCES) |
| `FILE_TOO_LARGE` | The file exceeds the configured size limit |
| `DEPTH_EXCEEDED` | Recursion depth exceeds `max_depth` |
| `INVALID_ENCODING` | The requested encoding is not supported |
| `WRITE_DISABLED` | A write tool was called while in read-only mode |
| `DIRECTORY_NOT_EMPTY` | Attempted to delete a non-empty directory without `recursive: true` |
| `ALREADY_EXISTS` | Destination already exists and `overwrite` is `false` |
| `INVALID_PATH` | Path is empty, contains null bytes, is too long, or points to the wrong type |
| `UNKNOWN_ERROR` | An unexpected error occurred; check the `message` and `details` fields |

All errors are returned in a consistent JSON envelope:

```json
{
  "isError": true,
  "content": [{
    "type": "text",
    "text": "{\"code\":\"FILE_NOT_FOUND\",\"message\":\"File not found: missing.txt\"}"
  }]
}
```

---

## FAQ

**Q: Can I use File Forge on macOS or Linux?**
A: Yes. The server is Windows-first in its path handling and defaults, but it works on any platform that supports Node.js 18+. Path separators and conventions are handled by Node's `path` module.

**Q: How do I restrict access to a single directory?**
A: Set `MCP_FILE_FORGE_ALLOWED_PATHS` to that one directory:
```
MCP_FILE_FORGE_ALLOWED_PATHS=C:/Projects/my-app
```

**Q: What happens if I don't set `ALLOWED_PATHS`?**
A: The default is `.` (the current working directory). The server resolves this to an absolute path at startup.

**Q: Can the agent install npm packages or run shell commands?**
A: No. File Forge only provides file-system operations. For shell access, use a separate MCP server (e.g. Desktop Commander).

**Q: How do I add my own templates?**
A: Create a directory with your template files and an optional `template.json` manifest. Place it in one of the template search paths, or point `MCP_FILE_FORGE_TEMPLATE_PATHS` to its parent directory.

**Q: Why does log output go to stderr?**
A: The MCP STDIO transport uses stdout for JSON-RPC messages. Any non-protocol output on stdout would corrupt the transport. Stderr is the standard sideband for diagnostics.

**Q: Is there a way to disable specific tools?**
A: Not individually. You can disable all write tools with `MCP_FILE_FORGE_READ_ONLY=true`. Finer-grained tool disabling is on the roadmap.

**Q: What is the maximum file size I can read?**
A: The `read_file` tool defaults to refusing files larger than 10 MB (`max_size_kb: 10240`). You can pass a larger value per call. The server-wide `max_file_size` (default 100 MB) is an additional ceiling enforced by the sandbox.

**Q: Does File Forge support binary files?**
A: The `read_file` tool supports `base64` and `hex` encodings, which can represent binary content as text. True binary streaming is not yet implemented.
