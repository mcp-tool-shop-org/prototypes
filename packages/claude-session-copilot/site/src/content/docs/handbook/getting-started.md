---
title: Getting started
description: Install Claude Session Copilot and run your first session.
sidebar:
  order: 1
---

## Why?

Claude Code sessions are ephemeral. When you `/compact` or start fresh, your reasoning, decisions, and progress disappear. Session Copilot captures all of that and makes it recoverable.

This plugin **only works in Claude Code** -- it depends on PostToolUse hooks, skills, resource notifications, and `CLAUDE.md` context injection that no other MCP client has.

## Quick start

Run directly with npx:

```bash
npx @mcptoolshop/claude-session-copilot
```

## Plugin installation

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "session-copilot": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/claude-session-copilot"]
    }
  }
}
```

Once installed, Claude Code discovers the server automatically. Start a new session and run `/copilot:resume` to verify it is working.

## What happens next

1. **Resume** -- call `/copilot:resume` at session start to pick up where you left off
2. **Work** -- hook prompts request recording for file edits, Bash results, and task changes (prompt-based, not guaranteed)
3. **Decide** -- log key choices with `copilot.decision` so they survive `/compact`
4. **Snapshot** -- call `/copilot:snapshot` before `/compact` to save full state
5. **Repeat** -- the next session starts with `/copilot:resume` and gets everything back
