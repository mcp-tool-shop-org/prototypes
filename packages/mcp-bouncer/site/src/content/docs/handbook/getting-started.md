---
title: Getting Started
description: Install MCP Bouncer and register the SessionStart hook.
sidebar:
  order: 1
---

## Install

```bash
pip install mcp-bouncer
```

## Register the hook

Add to your Claude Code settings (`settings.local.json` or `.claude/settings.json`):

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

### Alternative: clone the repo

If you prefer not to install via pip, clone the repo and point the hook at the script directly:

```bash
git clone https://github.com/mcp-tool-shop-org/mcp-bouncer.git
```

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python /path/to/mcp-bouncer/hooks/on_session_start.py",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

## Verify

Next session, Bouncer runs automatically. You'll see a summary line in stderr:

```
[mcp-bouncer] 3/4 healthy, quarantined: voice-soundboard
```

And a JSON result on stdout that Claude sees:

```json
{
  "status": "ok",
  "message": "MCP Bouncer: 3/4 healthy, quarantined: voice-soundboard"
}
```
