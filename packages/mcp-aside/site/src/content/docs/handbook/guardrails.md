---
title: Guardrails
description: Rate limiting, deduplication, and TTL configuration for mcp-aside.
sidebar:
  order: 3
---

Everything is configurable via `aside.configure` at runtime.

## Defaults

| Setting | Default | Description |
|---------|---------|-------------|
| `enabled` | true | Master switch — set to `false` to bypass all guardrails |
| `defaultTtlSeconds` | 600 (10 min) | How long an interjection lives if no explicit expiry is set |
| `maxTtlSeconds` | 3600 (1 hr) | Hard cap on TTL, even if the caller asks for more |
| `dedupeWindowSeconds` | 300 (5 min) | Same priority + text + reason = suppressed within this window |
| `rateLimitWindowSeconds` | 60 | Sliding window for rate limiting |
| `rateLimitMax` | low: 6, med: 3, high: 1 | Max pushes per priority per window |
| `notifyAtOrAbove` | high | Only send log notifications at or above this priority |

## Rejection codes

When `aside.push` is rejected by the guardrails, the response includes a `code` field:

| Code | Meaning |
|------|---------|
| `INBOX.TEXT.EMPTY` | The `text` field was empty or whitespace-only. |
| `INBOX.DEDUPED` | An identical interjection (same priority + text + reason) was pushed within the dedupe window. |
| `INBOX.RATELIMIT` | The per-priority rate limit was exceeded for the current sliding window. |

## Tuning at runtime

Use `aside.configure` to adjust guardrails without restarting:

```javascript
// Extend TTL to 30 minutes, allow more low-priority pushes
aside.configure({
  defaultTtlSeconds: 1800,
  rateLimitMax: { low: 10, med: 3, high: 1 }
})
```

Pass `{ enabled: false }` to disable all guardrails temporarily (every push will be accepted).

## Design notes

- The inbox is ephemeral — restart the server and the inbox is gone
- Interjections are stored newest-first
- Expired items are pruned on every read and push
- Logs go to stderr — stdout is reserved for MCP JSON-RPC
- Deduplication hashes are SHA-256 based, combining priority + text + reason
