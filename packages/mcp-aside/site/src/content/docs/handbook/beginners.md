---
title: Beginners Guide
description: A step-by-step introduction to mcp-aside for first-time users.
sidebar:
  order: 99
---

## What is mcp-aside?

mcp-aside is an MCP server that gives your AI assistant a sticky-note pad during conversations. When the model notices something worth remembering — a bug, a blocker, a "come back to this later" thought — it pushes that thought into an in-memory inbox instead of losing it. The inbox is ephemeral by design: restart the server and it is gone.

The server exposes four tools (`aside.push`, `aside.configure`, `aside.clear`, `aside.status`) plus a stats tool (`aside.stats`) and one resource (`interject://inbox`). Built-in guardrails prevent the inbox from being flooded with duplicates or low-value noise.

## Who is it for?

mcp-aside is built for developers using MCP-compatible AI clients such as Claude Desktop, Claude Code, or VS Code with an MCP extension. It is useful when:

- You work on long, multi-step tasks and want the AI to capture stray observations without derailing the current work.
- You want a lightweight "parking lot" for ideas, blockers, and tech-debt notes that auto-expire.
- You prefer ephemeral notes (session-scoped) over persistent storage.

No database, no cloud sync, and no configuration files are required to get started.

## Prerequisites

- **Node.js 18+** installed on your machine.
- An **MCP-compatible client** (Claude Desktop, Claude Code, VS Code with MCP support, or any client that speaks MCP over stdio).
- Basic familiarity with JSON configuration files.

## Installation

Add the server to your MCP client config. The exact file depends on your client:

- **Claude Desktop:** `claude_desktop_config.json`
- **Claude Code / VS Code:** `.mcp.json` in your project root or user settings

```json
{
  "mcpServers": {
    "aside": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/mcp-aside"]
    }
  }
}
```

Restart your client after saving. The server starts automatically when the client connects.

## Basic usage

### Push a note

Ask your AI to push an interjection, or call the tool directly:

```javascript
aside.push({
  text: "The auth middleware skips token refresh on 401",
  priority: "high",
  reason: "blocks deployment",
  tags: ["bug", "auth"]
})
```

The three priority levels control rate limits and notification behavior:

| Priority | Rate limit | Best for |
|----------|-----------|----------|
| `low` | 6 per minute | Minor observations, notes to self |
| `med` | 3 per minute | Moderate concerns, suggestions (default) |
| `high` | 1 per minute | Critical blockers, urgent warnings |

### Read the inbox

The inbox is available as the `interject://inbox` resource. Reading it returns all active interjections, newest first. Expired items are filtered out automatically.

### Check status

Call `aside.status` to see the current inbox size and guardrail configuration at a glance.

### Clear the inbox

Call `aside.clear` to wipe all interjections and start fresh.

## Common patterns

**Spotted a bug while working on something else:**
Push it with a `"bug"` tag and keep working. The note stays in the inbox until it expires or you clear it.

**Blocker that needs attention before deploying:**
Use `priority: "high"` so it triggers a log notification and stands out in the inbox.

**Quick observation that may not matter:**
Use `priority: "low"`. It will auto-expire in 10 minutes if nobody acts on it.

**Tune guardrails for a busy session:**
Call `aside.configure` to raise rate limits or extend the default TTL:

```javascript
aside.configure({
  defaultTtlSeconds: 1800,
  rateLimitMax: { low: 10, med: 5, high: 2 }
})
```

**Review usage patterns:**
Call `aside.stats` to see how many interjections were accepted, rejected, deduped, or rate-limited.

## Troubleshooting

**Push returns `INBOX.DEDUPED`:**
You pushed the same text + priority + reason combination within the 5-minute dedupe window. Wait for the window to pass, or change the text slightly.

**Push returns `INBOX.RATELIMIT`:**
You hit the per-priority rate limit. Wait for the sliding window (default 60 seconds) to reset, or raise limits with `aside.configure`.

**Push returns `INBOX.TEXT.EMPTY`:**
The `text` field was empty or whitespace-only. Provide a non-empty string.

**Inbox is empty after restart:**
This is expected. The inbox is in-memory only. Restart the server and all interjections are gone.

**Server not appearing in client:**
Verify your MCP client config points to the correct command (`npx -y @mcptoolshop/mcp-aside`). Restart the client after editing the config. Check that Node.js 18+ is installed and `npx` is on your PATH.

**Timer trigger keeps adding check-ins:**
The built-in timer fires every 5 minutes with a low-priority prompt. It respects all guardrails, so it will be deduped or rate-limited like any other push. To disable it, build from source and comment out the `startTimerTrigger` call in `src/index.ts`.
