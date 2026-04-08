<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-file-forge/readme.png" alt="MCP File Forge" width="400"></p>

<p align="center">
  Secure file operations and project scaffolding for AI agents.
  <br />
  Part of <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/file-forge"><img alt="npm version" src="https://img.shields.io/npm/v/@mcptoolshop/file-forge"></a>
  <a href="https://github.com/mcp-tool-shop-org/mcp-file-forge/blob/main/LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-blue"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-file-forge/"><img alt="Landing Page" src="https://img.shields.io/badge/Landing_Page-live-blue"></a>
</p>

---

## At a Glance

MCP File Forge is a [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that gives AI agents sandboxed, policy-controlled access to the local file system. It ships **17 tools** across five categories:

| Category | Tools | Description |
|----------|-------|-------------|
| **Reading** | `read_file`, `read_directory`, `read_multiple` | Read files and directory listings |
| **Writing** | `write_file`, `create_directory`, `copy_file`, `move_file`, `delete_file` | Create, modify, copy, move, and delete |
| **Search** | `glob_search`, `grep_search`, `find_by_content` | Find files by name pattern or content |
| **Metadata** | `file_stat`, `file_exists`, `get_disk_usage`, `compare_files` | Inspect size, timestamps, existence |
| **Scaffolding** | `scaffold_project`, `list_templates` | Create projects from templates with variable substitution |

Key properties:

- **Sandboxed** -- operations are restricted to explicitly allowed directories.
- **Read-only mode** -- flip one env var to disable all write tools.
- **Symlink-safe** -- symlink following is off by default to prevent sandbox escapes.
- **Windows-first** -- designed for Windows paths and conventions, works everywhere.
- **Template engine** -- `{{var}}` / `${var}` substitution plus path-level `__var__` renaming.

---

## Installation

```bash
npm install -g @mcptoolshop/file-forge
```

Or run directly with npx:

```bash
npx @mcptoolshop/file-forge
```

---

## Claude Desktop Configuration

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "file-forge": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/file-forge"],
      "env": {
        "MCP_FILE_FORGE_ALLOWED_PATHS": "C:/Projects,C:/Users/you/Documents"
      }
    }
  }
}
```

If you installed globally you can point directly at the binary:

```json
{
  "mcpServers": {
    "file-forge": {
      "command": "mcp-file-forge",
      "env": {
        "MCP_FILE_FORGE_ALLOWED_PATHS": "C:/Projects"
      }
    }
  }
}
```

---

## Tool Reference

### Reading

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `read_file` | Read file contents | `path`, `encoding?`, `start_line?`, `end_line?`, `max_size_kb?` |
| `read_directory` | List directory entries | `path`, `recursive?`, `max_depth?`, `include_hidden?`, `pattern?` |
| `read_multiple` | Batch-read multiple files | `paths`, `encoding?`, `fail_on_error?` |

### Writing

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `write_file` | Write or overwrite a file | `path`, `content`, `encoding?`, `create_dirs?`, `overwrite?`, `backup?` |
| `create_directory` | Create a directory | `path`, `recursive?` |
| `copy_file` | Copy a file or directory | `source`, `destination`, `overwrite?`, `recursive?` |
| `move_file` | Move or rename | `source`, `destination`, `overwrite?` |
| `delete_file` | Delete a file or directory | `path`, `recursive?`, `force?` |

### Search

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `glob_search` | Find files by glob pattern | `pattern`, `base_path?`, `max_results?`, `include_dirs?` |
| `grep_search` | Search file contents with regex | `pattern`, `path?`, `glob?`, `case_sensitive?`, `max_results?`, `context_lines?` |
| `find_by_content` | Literal text search (no regex) | `text`, `path?`, `file_pattern?`, `max_results?` |

### Metadata

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `file_stat` | File/directory statistics | `path` |
| `file_exists` | Check existence and type | `path`, `type?` (`file` / `directory` / `any`) |
| `get_disk_usage` | Directory size breakdown | `path`, `max_depth?` |
| `compare_files` | Compare two paths | `path1`, `path2` |

### Scaffolding

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `scaffold_project` | Create project from template | `template`, `destination`, `variables?`, `overwrite?` |
| `list_templates` | List available templates | `category?` |

Full parameter documentation, examples, and error codes are in the [HANDBOOK.md](HANDBOOK.md).

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_FILE_FORGE_ALLOWED_PATHS` | Comma-separated list of allowed root directories | `.` (cwd) |
| `MCP_FILE_FORGE_DENIED_PATHS` | Comma-separated denied path glob patterns | `**/node_modules/**`, `**/.git/**` |
| `MCP_FILE_FORGE_READ_ONLY` | Disable all write operations | `false` |
| `MCP_FILE_FORGE_MAX_FILE_SIZE` | Maximum file size in bytes | `104857600` (100 MB) |
| `MCP_FILE_FORGE_MAX_DEPTH` | Maximum recursion depth | `20` |
| `MCP_FILE_FORGE_FOLLOW_SYMLINKS` | Allow following symlinks outside sandbox | `false` |
| `MCP_FILE_FORGE_TEMPLATE_PATHS` | Comma-separated template directories | `./templates` |
| `MCP_FILE_FORGE_LOG_LEVEL` | Log verbosity (`error`, `warn`, `info`, `debug`) | `info` |
| `MCP_FILE_FORGE_LOG_FILE` | Path to a log file (in addition to stderr) | _none_ |

---

## Config File

Create `mcp-file-forge.json` (or `.mcp-file-forge.json`) in or above your working directory:

```json
{
  "sandbox": {
    "allowed_paths": ["C:/Projects", "C:/Users/you/Documents"],
    "denied_paths": ["**/secrets/**", "**/.env"],
    "follow_symlinks": false,
    "max_file_size": 52428800,
    "max_depth": 20
  },
  "templates": {
    "paths": ["./templates", "~/.mcp-file-forge/templates"]
  },
  "logging": {
    "level": "info",
    "file": "./logs/mcp-file-forge.log"
  },
  "read_only": false
}
```

Configuration priority (highest wins):

1. Environment variables
2. Config file
3. Built-in defaults

---

## Security

MCP File Forge enforces several layers of protection to keep AI agents from reaching outside their designated workspace:

- **Path sandboxing** -- every path is resolved to an absolute path and checked against the `allowed_paths` list before any I/O occurs.
- **Denied paths** -- glob patterns that are blocked even within allowed directories (e.g. `**/secrets/**`).
- **Symlink protection** -- symlinks are not followed by default; if a symlink target resolves outside the sandbox, the operation is denied.
- **Path traversal detection** -- `..` sequences that would escape the sandbox are rejected.
- **Size limits** -- files larger than `max_file_size` are refused to prevent memory exhaustion.
- **Depth limits** -- recursive operations are capped at `max_depth` levels.
- **Read-only mode** -- set `MCP_FILE_FORGE_READ_ONLY=true` to disable `write_file`, `create_directory`, `copy_file`, `move_file`, `delete_file`, and `scaffold_project`.
- **Null-byte rejection** -- paths containing `\0` are refused.
- **Windows long-path guard** -- paths exceeding 32,767 characters are refused.

---

## Documentation

| Document | Description |
|----------|-------------|
| [HANDBOOK.md](HANDBOOK.md) | Deep-dive: security model, tool reference, templates, architecture, FAQ |
| [CHANGELOG.md](CHANGELOG.md) | Release history (Keep a Changelog format) |
| [docs/PLANNING.md](docs/PLANNING.md) | Internal planning and research notes |

---

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

---

## Security & Data Scope

MCP File Forge is an **MCP server** providing sandboxed file operations for AI agents.

- **Data accessed:** Files within explicitly allowed directories only. Config files, template directories
- **Data NOT accessed:** No cloud sync. No telemetry. No analytics. No data outside sandbox
- **Network:** stdio transport by default — no network listeners, no egress. HTTP mode available via `PORT` env var for remote deployment
- **No telemetry** is collected or sent

Full policy: [SECURITY.md](SECURITY.md)

---

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10/10 |
| B. Error Handling | 10/10 |
| C. Operator Docs | 10/10 |
| D. Shipping Hygiene | 10/10 |
| E. Identity (soft) | 10/10 |
| **Overall** | **50/50** |

---

## License

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
