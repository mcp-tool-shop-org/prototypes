---
title: CLI
description: MCP Bouncer CLI commands for diagnostics and manual control.
sidebar:
  order: 3
---

## Commands

### status (default)

Shows active and quarantined servers without running any health checks.

```bash
mcp-bouncer status
```

Example output:

```
Active (3):
  filesystem  ->  npx @anthropic/mcp-filesystem
  github      ->  npx @anthropic/mcp-github
  memory      ->  npx @anthropic/mcp-memory

Quarantined (1):
  voice-soundboard
    reason:    Command not found: voice-soundboard-mcp
    fails:     3
    since:     2026-02-21T10:30:00
    checked:   2026-02-21T12:00:00

Last check: 2026-02-21T12:00:00
```

### check

Runs health checks on all servers (active and quarantined) and outputs a JSON summary. This is the same logic the SessionStart hook executes.

```bash
mcp-bouncer check
```

### restore

Moves all quarantined servers back into `.mcp.json` unconditionally. Useful after you've fixed a broken server and want it available immediately instead of waiting for the next session.

```bash
mcp-bouncer restore
```

### Path argument

All commands accept an optional path to `.mcp.json` (defaults to `.mcp.json` in the current directory):

```bash
mcp-bouncer status /path/to/.mcp.json
```

## Design decisions

- **No dependencies** — stdlib only, runs anywhere Python 3.10+ lives
- **Fail-safe** — if Bouncer itself crashes, `.mcp.json` is unchanged
- **Preserves structure** — only touches the `mcpServers` key, leaves `$schema` and `defaults` intact
- **Parallel checks** — ThreadPoolExecutor with 5 workers, completes within the 10-second hook timeout
- **One-session delay** — a server that breaks mid-session gets quarantined at the start of the next one
