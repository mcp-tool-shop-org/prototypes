---
title: Beginners Guide
description: Step-by-step walkthrough for first-time users of MCP File Forge.
sidebar:
  order: 99
---

This guide walks you through MCP File Forge from zero to productive. No prior MCP experience required.

## 1. What is MCP File Forge?

MCP File Forge is a **Model Context Protocol (MCP) server** that gives AI agents controlled access to your local file system. Instead of the AI asking you to copy-paste file contents, it can read, write, search, and scaffold files directly -- all within a sandbox you define.

MCP is an open standard for connecting AI models to external tools. MCP File Forge is one such tool: it handles file operations so the AI can focus on reasoning about your code, documents, or project structure.

**Key properties:**
- All operations are restricted to directories you explicitly allow
- Write operations can be disabled entirely with a single setting
- Symlinks that escape the sandbox are blocked by default
- No network access, no telemetry, no data leaves your machine (in stdio mode)

## 2. Prerequisites

Before installing MCP File Forge, make sure you have:

- **Node.js 18 or later** -- check with `node --version`
- **npm** -- comes with Node.js, check with `npm --version`
- **An MCP client** -- such as Claude Desktop, Claude Code, or any client that supports the Model Context Protocol

If you do not have Node.js, download it from [nodejs.org](https://nodejs.org/).

## 3. Installation

The simplest way to use MCP File Forge is with `npx`, which runs the package without a global install:

```bash
npx @mcptoolshop/file-forge
```

For repeated use, install globally:

```bash
npm install -g @mcptoolshop/file-forge
```

Verify the installation:

```bash
npx @mcptoolshop/file-forge --help
```

## 4. Connecting to Claude Desktop

Claude Desktop loads MCP servers from a configuration file. Open (or create) your `claude_desktop_config.json` and add a `file-forge` entry:

```json
{
  "mcpServers": {
    "file-forge": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/file-forge"],
      "env": {
        "MCP_FILE_FORGE_ALLOWED_PATHS": "C:/Projects"
      }
    }
  }
}
```

Replace `C:/Projects` with the directory (or directories, comma-separated) where you want the AI to have access. For example:

```
"MCP_FILE_FORGE_ALLOWED_PATHS": "C:/Projects,C:/Users/you/Documents"
```

After saving, restart Claude Desktop. The file-forge tools will appear in the tool list.

**Tip:** Start with read-only mode while you get comfortable. Add `"MCP_FILE_FORGE_READ_ONLY": "true"` to the `env` block. This disables all write, delete, copy, move, and scaffold operations.

## 5. Your first tool calls

Once connected, try these tool calls in your AI conversation. The AI will call these tools on your behalf when you ask it to work with files.

### Read a file

Ask the AI to read a specific file:

> "Read the contents of C:/Projects/my-app/package.json"

The AI calls `read_file` with the path. The file content is returned as text.

### List a directory

> "Show me what's in C:/Projects/my-app/src"

The AI calls `read_directory` and returns a list of files and folders with their sizes.

### Search for text

> "Find all files in C:/Projects/my-app that contain the word 'database'"

The AI calls `find_by_content` (literal text search) or `grep_search` (regex search) and returns matching lines with file paths and line numbers.

### Find files by pattern

> "Find all TypeScript files in C:/Projects/my-app"

The AI calls `glob_search` with the pattern `**/*.ts` and returns matching file paths.

### Check if a file exists

> "Does C:/Projects/my-app/README.md exist?"

The AI calls `file_exists` and reports whether the path exists and whether it is a file or directory.

### Write a file (requires write mode)

> "Create a file at C:/Projects/my-app/TODO.md with a list of tasks"

The AI calls `write_file` with the path and content. Parent directories are created automatically by default.

## 6. Common patterns

### Exploring a new codebase

1. `read_directory` with `recursive: true` to get an overview of the project structure
2. `read_file` on key files like `package.json`, `README.md`, or entry points
3. `grep_search` to find specific patterns, function names, or imports

### Refactoring across files

1. `find_by_content` to locate all occurrences of the old pattern
2. `read_multiple` to review the files that need changes
3. `write_file` for each file with updated content

### Checking project health

1. `get_disk_usage` to see which directories are largest
2. `file_stat` on specific files to check modification dates
3. `compare_files` to spot differences between two versions

### Starting a new project from a template

1. `list_templates` to see available templates
2. `scaffold_project` with your chosen template and variables
3. `read_directory` on the result to verify the structure

## 7. Troubleshooting

### "Path is outside allowed directories"

The `PATH_OUTSIDE_SANDBOX` error means the requested path is not within any directory listed in `MCP_FILE_FORGE_ALLOWED_PATHS`. Double-check the value in your config. Paths must be absolute or resolved relative to the server working directory.

### "Write operations are disabled in read-only mode"

The `WRITE_DISABLED` error appears when `MCP_FILE_FORGE_READ_ONLY` is set to `true`. Remove or set it to `false` if you need write access.

### "File size exceeds limit"

The `FILE_TOO_LARGE` error means the file is larger than the configured maximum (default: 100 MB). Increase the limit with `MCP_FILE_FORGE_MAX_FILE_SIZE` (value in bytes) if needed.

### "Maximum recursion depth exceeded"

The `DEPTH_EXCEEDED` error fires when a recursive operation goes deeper than `max_depth` (default: 20 levels). Increase with `MCP_FILE_FORGE_MAX_DEPTH` if your directory tree is deeply nested.

### Tools are not showing up in Claude Desktop

1. Verify the `claude_desktop_config.json` syntax is valid JSON
2. Restart Claude Desktop after editing the config
3. Check that `npx @mcptoolshop/file-forge` runs without errors in a terminal
4. Make sure Node.js 18+ is installed and `npx` is on your PATH

### Server starts but operations fail silently

Check stderr output. In stdio mode, the server logs to stderr (not stdout). Look for sandbox initialization messages like `Allowed paths: ...` to confirm your paths are being loaded correctly.

### Symlink-related errors

By default, symlinks that point outside the sandbox are blocked. If you need to follow symlinks, set `MCP_FILE_FORGE_FOLLOW_SYMLINKS=true` in the env block. Only do this if you trust all symlink targets within your allowed directories.
