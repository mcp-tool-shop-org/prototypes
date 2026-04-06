---
title: How It Works
description: Health checks, quarantine, and auto-restore explained.
sidebar:
  order: 2
---

## Flow

1. Session starts
2. Bouncer reads `.mcp.json` (active) and `.mcp.health.json` (quarantined)
3. Health-checks ALL servers in parallel
4. Broken active servers move to quarantine
5. Recovered quarantined servers restore to `.mcp.json`
6. Summary logged to session

## Health check

For each server, Bouncer:

1. Resolves the command binary (`shutil.which` / absolute path check)
2. Spawns the process with its configured args and env
3. Waits 2 seconds — if the process is still running, it passes

This catches missing binaries, broken dependencies, import errors, and crash-on-startup bugs.

## Quarantine format

Broken servers are stored in `.mcp.health.json` with full config preserved:

```json
{
  "quarantined": {
    "voice-soundboard": {
      "config": { "command": "voice-soundboard-mcp", "args": ["--backend=python"] },
      "reason": "Command not found: voice-soundboard-mcp",
      "quarantined_at": "2026-02-21T10:30:00Z",
      "last_checked": "2026-02-21T12:00:00Z",
      "fail_count": 3
    }
  },
  "last_run": "2026-02-21T12:00:00Z",
  "summary": "3/4 healthy, quarantined: voice-soundboard"
}
```

The health file also records `last_run` (when Bouncer last ran) and a human-readable `summary` of the result.

Every session, quarantined servers are re-tested. When they pass, they're automatically restored.

## Fail-safe design

Bouncer writes `.mcp.json` only after all checks complete. If Bouncer itself crashes mid-run, `.mcp.json` remains untouched — your servers continue loading as before. The `mcpServers` key is the only key Bouncer modifies; all other keys (`$schema`, `defaults`, etc.) are preserved.
