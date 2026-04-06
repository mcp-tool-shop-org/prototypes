---
title: Beginners Guide
description: A gentle introduction to MCP Bouncer for first-time users.
sidebar:
  order: 99
---

## What is MCP Bouncer?

MCP Bouncer is a lightweight Python tool that automatically health-checks every MCP server configured in your `.mcp.json` file. When a server is broken (missing binary, crashes on startup, bad dependencies), Bouncer moves it to a quarantine file so it no longer wastes context tokens or causes errors. When the server starts working again, Bouncer restores it automatically. It runs as a Claude Code SessionStart hook, meaning it executes every time you start a new session.

## Who is it for?

MCP Bouncer is for anyone using Claude Code with MCP servers. If you have more than a couple of servers configured, broken ones are inevitable — a dependency upgrades, a binary gets uninstalled, or a config drifts. Bouncer catches these silently at session start so you never see unexpected tool-call failures or red warnings. It is particularly useful for developers who maintain many MCP server configurations across projects.

## Prerequisites

Before installing MCP Bouncer, you need:

- **Python 3.10 or newer** — check with `python --version`
- **Claude Code** — the Claude CLI tool where MCP servers are configured
- **A `.mcp.json` file** — the standard MCP server configuration file in your project directory
- **pip** — the Python package manager (ships with Python)

No additional Python libraries are required. Bouncer uses only the Python standard library.

## Installation step-by-step

1. Install the package from PyPI:

   ```bash
   pip install mcp-bouncer
   ```

2. Open your Claude Code settings file. This is either `settings.local.json` (per-project) or `.claude/settings.json` (global). Add the hook configuration:

   ```json
   {
     "hooks": {
       "SessionStart": [
         {
           "hooks": [
             {
               "type": "command",
               "command": "mcp-bouncer-hook",
               "timeout": 10
             }
           ]
         }
       ]
     }
   }
   ```

3. Start a new Claude Code session. Bouncer runs automatically and logs a summary to stderr.

4. Verify it worked by running the CLI:

   ```bash
   mcp-bouncer status
   ```

   You should see your active servers listed. If any were broken, they appear under the Quarantined section.

## First steps after installation

Once Bouncer is installed, there is nothing else to configure. It runs silently at session start. Here are useful things to try:

- **Check status manually** — run `mcp-bouncer status` to see which servers are active and which are quarantined
- **Trigger a check outside a session** — run `mcp-bouncer check` to see JSON output of health results
- **Restore a fixed server now** — if you fixed a broken server and want it back immediately, run `mcp-bouncer restore` instead of waiting for the next session
- **Look at the quarantine file** — open `.mcp.health.json` in your project directory to see quarantine details including failure reasons and timestamps

## Common issues

**"Command not found" for mcp-bouncer-hook**
The `mcp-bouncer-hook` command is installed by pip into your Python scripts directory. Make sure that directory is on your PATH. On Windows, this is typically `%APPDATA%\Python\PythonXX\Scripts`. On macOS/Linux, it is usually `~/.local/bin`.

**Server wrongly quarantined**
Some MCP servers exit cleanly within the 2-second startup window (for example, servers that print help and exit). Bouncer interprets any exit within 2 seconds as a crash. If this happens, run `mcp-bouncer restore` to bring it back, and consider filing an issue if the false positive is reproducible.

**Hook timeout exceeded**
The default hook timeout is 10 seconds. With 5 parallel workers and a 2-second per-server check, Bouncer handles up to ~12 servers within that window. If you have significantly more servers, increase the `timeout` value in your hook configuration.

**Nothing happens on session start**
Confirm the hook is registered in the correct settings file. Claude Code checks `settings.local.json` in the project directory and `.claude/settings.json` globally. Also verify `mcp-bouncer-hook` runs without errors from the command line.

## Glossary

| Term | Meaning |
|------|---------|
| **MCP** | Model Context Protocol — the standard for connecting external tools to Claude |
| **MCP server** | A process that exposes tools to Claude via the MCP protocol |
| **.mcp.json** | The configuration file listing all MCP servers for a project |
| **.mcp.health.json** | The quarantine file where Bouncer stores broken server configs |
| **Quarantine** | Moving a broken server out of `.mcp.json` into `.mcp.health.json` so it does not load |
| **Restore** | Moving a recovered server from `.mcp.health.json` back into `.mcp.json` |
| **SessionStart hook** | A command that Claude Code runs automatically at the beginning of every session |
| **Health check** | Spawning a server process and verifying it survives for 2 seconds without crashing |
| **fail_count** | The number of consecutive failed health checks for a quarantined server |
