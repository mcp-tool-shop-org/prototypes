---
title: For Beginners
description: New to NullOut? Start here for a gentle introduction.
sidebar:
  order: 99
---

New to NullOut or MCP servers? This page explains everything from scratch.

## What is this tool?

**NullOut** is a tool that finds and safely deletes "undeletable" files on Windows. These are files with special names like `CON`, `PRN`, `AUX`, or `NUL` that Windows reserves for hardware devices. When files with these names end up on your disk (often created by WSL, Linux tools, or software bugs), Windows Explorer and normal commands can't touch them. NullOut also catches files with trailing dots or spaces and paths that exceed the 260-character limit.

NullOut scans for these problematic files, shows you exactly what it found, and lets you safely remove them through a three-step scan-plan-delete workflow. It runs as an MCP server, meaning AI assistants like Claude can use it as a tool.

## Who is this for?

- **Windows developers** using WSL who occasionally end up with undeletable files
- **System administrators** cleaning up machines with corrupted or rogue file entries
- **MCP users** who want a safe, automated way to handle filesystem hazards
- **Anyone** who has ever right-clicked a file and been told they can't delete it

## Prerequisites

Before you start, you need:

- **Windows 10 or later** -- NullOut uses Windows-specific APIs (the `\\?\` extended path namespace)
- **Python 3.10 or later** -- the runtime for the MCP server
- **An MCP host** -- Claude Desktop, Claude Code, or any MCP-compatible client
- **Basic terminal skills** -- you'll need to set environment variables and run pip commands

You do NOT need:
- Administrator privileges (NullOut works within your user permissions)
- Deep knowledge of NTFS internals
- Prior experience with MCP servers

## Your First 5 Minutes

### 1. Install NullOut

```bash
pip install nullout-mcp
```

### 2. Set your allowed roots

NullOut only scans directories you explicitly allow. Set the `NULLOUT_ROOTS` environment variable:

```bash
# PowerShell
$env:NULLOUT_ROOTS = "C:\Users\you\Downloads;C:\temp"

# Or in your MCP host config (see step 3)
```

### 3. Generate a token secret

NullOut signs deletion tokens with HMAC-SHA256. Generate a random secret:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Set it as an environment variable or include it in your MCP host config.

### 4. Configure your MCP host

Add NullOut to your Claude Desktop or Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "nullout": {
      "command": "nullout-mcp",
      "env": {
        "NULLOUT_ROOTS": "C:\\Users\\you\\Downloads",
        "NULLOUT_TOKEN_SECRET": "paste-your-generated-secret-here"
      }
    }
  }
}
```

### 5. Scan for problems

Ask your AI assistant: "Scan my Downloads folder for undeletable files" -- or call the `scan_reserved_names` tool directly. NullOut returns a list of hazardous entries with details about why each one is problematic.

### 6. Review and delete

For each finding, call `plan_cleanup` to generate a confirmation token (valid for 5 minutes), then `delete_entry` with that token. Nothing is deleted without an explicit token -- and the token is rejected if the file changed since the scan.

## Common Mistakes

### 1. Forgetting to set NULLOUT_ROOTS
NullOut refuses to start without this variable. If you get a RuntimeError at startup, set `NULLOUT_ROOTS` to a semicolon-separated list of directories you want to scan.

### 2. Forgetting to set NULLOUT_TOKEN_SECRET
The server fails closed without a token secret -- it will not start. Generate a random hex string and set it before launching.

### 3. Trying to scan system directories
Don't add `C:\Windows` or `C:\Program Files` to your roots unless you really know what you're doing. Stick to user directories like Downloads, temp folders, or project directories.

### 4. Expecting it to work on Linux/macOS
NullOut is Windows-only by design. The reserved device name problem is a Windows-specific issue. On Linux and macOS, files named `CON` or `NUL` are perfectly normal.

### 5. Trying to delete non-empty directories
NullOut only deletes files and empty directories. If a hazardous directory contains files, you need to clean its contents first (or handle them individually).

## Next Steps

- Follow [Getting Started](../getting-started/) for complete installation and configuration
- Read [MCP Tools](../mcp-tools/) for the full 7-tool reference and three-step workflow
- Review [Safety Model](../safety-model/) to understand the protection guarantees
- Check [Configuration](../configuration/) for all environment variables and policies

## Glossary

| Term | Definition |
|---|---|
| **Reserved device name** | Names Windows reserves for hardware: `CON`, `PRN`, `AUX`, `NUL`, `COM1`-`COM9`, `LPT1`-`LPT9`. Files with these names are "undeletable" via normal tools |
| **Extended path namespace** | The `\\?\` prefix that bypasses Win32 name validation, allowing access to reserved-name files |
| **MCP** | Model Context Protocol -- a standard for AI assistants to use external tools. NullOut is an MCP server |
| **MCP host** | An application that connects to MCP servers (e.g., Claude Desktop, Claude Code) |
| **Finding** | A hazardous file or directory discovered during a scan, identified by a unique finding ID |
| **Confirmation token** | An HMAC-SHA256 signed token that authorizes deletion of a specific finding. Expires after 5 minutes |
| **TOCTOU protection** | Time-of-check-to-time-of-use safety -- NullOut re-verifies the file identity (volume serial + file ID) between scan and delete |
| **Allowed roots** | Directories you explicitly authorize NullOut to scan -- it refuses to touch anything outside these paths |
| **Reparse point** | NTFS feature used by junctions, symlinks, and mount points. NullOut never traverses or deletes these (deny_all policy) |
| **Restart Manager** | A Windows API (rstrtmgr.dll) that identifies which processes hold a lock on a file. NullOut queries it read-only via `who_is_using` |
