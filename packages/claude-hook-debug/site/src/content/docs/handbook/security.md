---
title: Security
description: Security model and threat analysis for claude-hook-debug.
sidebar:
  order: 4
---

## Threat model

**What it touches:** Claude Code settings files at four paths:
- `~/.claude/managed-settings.json`
- `~/.claude/settings.json`
- `.claude/settings.json`
- `.claude/settings.local.json`

All access is **read-only**. The tool never modifies any file.

**What it does NOT touch:**
- No API keys, tokens, or credentials are read or logged
- The `env` block in settings is completely ignored
- No files outside Claude Code settings paths are accessed
- No child processes are spawned
- No network connections are made

**Permissions required:** Filesystem read access to `~/.claude/` and the project's `.claude/` directory. No elevated permissions needed.

## No telemetry

Zero analytics. Zero phone-home. Zero data collection. The tool runs entirely locally and produces output only to stdout/stderr.

## Zero dependencies

The tool has no production dependencies — only Node.js built-ins (`fs`, `path`, `os`). This eliminates supply chain risk from transitive dependencies.

## Reporting vulnerabilities

Email: **64996768+mcp-tool-shop@users.noreply.github.com**

See [SECURITY.md](https://github.com/mcp-tool-shop-org/claude-hook-debug/blob/main/SECURITY.md) for full reporting guidelines and response timeline.
