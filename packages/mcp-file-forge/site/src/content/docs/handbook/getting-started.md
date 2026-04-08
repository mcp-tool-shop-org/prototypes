---
title: Getting Started
description: Install MCP File Forge and connect it to your AI agent.
sidebar:
  order: 1
---

MCP File Forge is an MCP server that gives AI agents sandboxed, policy-controlled access to the local file system. This guide covers installation and basic setup.

## Installation

Install globally from npm:

```bash
npm install -g @mcptoolshop/file-forge
```

Or run directly without installing:

```bash
npx @mcptoolshop/file-forge
```

## Claude Desktop configuration

Add File Forge to your `claude_desktop_config.json`:

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

The `MCP_FILE_FORGE_ALLOWED_PATHS` variable is critical — it defines which directories the server can access. All file operations are restricted to these paths.

## Global install variant

If you installed globally, point directly at the binary:

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

## Read-only mode

For exploration or untrusted agents, disable all write operations:

```json
{
  "env": {
    "MCP_FILE_FORGE_ALLOWED_PATHS": "C:/Projects",
    "MCP_FILE_FORGE_READ_ONLY": "true"
  }
}
```

This disables `write_file`, `create_directory`, `copy_file`, `move_file`, `delete_file`, and `scaffold_project`.

## Next steps

- Browse all [17 tools](/mcp-file-forge/handbook/tools/)
- Learn about the [security model](/mcp-file-forge/handbook/security/)
- Set up [configuration files](/mcp-file-forge/handbook/configuration/) for finer control
