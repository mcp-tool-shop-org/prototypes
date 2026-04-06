# mcp-aside

In-memory interjection inbox for Claude Code. Capture side-thoughts, blockers, and observations mid-task without derailing your current work.

## Tools (4)

| Tool | Purpose | Read-only? |
|------|---------|-----------|
| `aside.push` | Add an interjection to the inbox (text, priority, reason, tags, expiry) | No |
| `aside.configure` | Update guardrails (TTL, rate limits, dedupe window, notification threshold) | No |
| `aside.clear` | Clear the entire inbox | No |
| `aside.status` | Get inbox size + current guardrails config | Yes |

## Resource (1)

| Resource | URI | What it shows |
|----------|-----|---------------|
| Interjection Inbox | `interject://inbox` | Ordered list of interjections (newest first, expired items filtered) |

## Priority Levels

| Priority | Rate Limit | Use For |
|----------|-----------|---------|
| `low` | 6/min | Minor observations, notes to self |
| `med` | 3/min | Moderate concerns, suggestions (default) |
| `high` | 1/min | Critical blockers, urgent warnings |

## Guardrails (Built-in)

- **TTL**: Default 10 min, max 60 min — interjections auto-expire
- **Rate limiting**: Per-priority caps (low: 6/min, med: 3/min, high: 1/min)
- **Deduplication**: Same priority + text + reason suppressed within 5 min window
- **Notification threshold**: Only `high` priority triggers log notifications by default

## Common Patterns

- **Noticed a bug while working on something else**: `aside.push` with `"I spotted a null check missing in auth.ts"` + tag `["bug"]`
- **Blocker for later**: `aside.push` with priority `"high"` and reason `"blocks deployment"`
- **Quick observation**: `aside.push` with priority `"low"` — it'll expire in 10 min if not acted on
- **Check what's pending**: Read `@mcp-aside:interject://inbox` or call `aside.status`
- **Tune sensitivity**: `aside.configure` to adjust rate limits or TTL
- **Fresh start**: `aside.clear` to empty the inbox

## Timer Trigger

A background timer fires every 5 minutes, pushing a low-priority check-in prompt: "Any blockers, stalled decisions, or observations to capture?" This nudges Claude to surface things that might otherwise be forgotten.

## Tips

- Interjections are ephemeral (in-memory, not persisted) — they're for the current session only
- Use tags to categorize: `["bug"]`, `["perf"]`, `["idea"]`, `["blocker"]`
- The `source` field tracks where the interjection came from: `"timer"`, `"tool"`, `"hook"`, etc.
- Pair with `session-copilot` for persistent cross-session memory
