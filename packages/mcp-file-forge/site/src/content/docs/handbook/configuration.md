---
title: Configuration
description: Environment variables, config files, and precedence rules.
sidebar:
  order: 3
---

MCP File Forge can be configured through environment variables, a JSON config file, or both.

## Environment variables

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

## Config file

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

## Precedence

Configuration priority (highest wins):

1. **Environment variables** — always override everything else
2. **Config file** — found by walking up from the working directory
3. **Built-in defaults** — used when nothing else is specified

This means you can set baseline configuration in a project-level config file and override specific values per-session with environment variables.
