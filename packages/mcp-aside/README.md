<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-aside/readme.png" alt="mcp-aside logo" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-aside/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-aside/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/mcp-aside"><img src="https://img.shields.io/npm/v/@mcptoolshop/mcp-aside" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-aside/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  An MCP server that gives your AI a place to jot things down mid-conversation — without derailing the task at hand.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#how-it-works">How It Works</a> &middot;
  <a href="#tools">Tools</a> &middot;
  <a href="#configuration">Configuration</a> &middot;
  <a href="#license">License</a>
</p>

---

## Why

LLMs lose track of things. A stray thought, a half-formed concern, a "we should come back to this" that never gets revisited. **mcp-aside** gives the model a dedicated inbox to push those asides into — rate-limited, deduped, and auto-expiring so the inbox doesn't become its own problem.

Think of it as a sticky-note pad next to the conversation. The model writes notes. You (or the model) read them when the time is right.

## How It Works

1. The model calls `aside.push` with a thought, tagged by priority.
2. Guardrails check for duplicates, rate limits, and TTL caps.
3. If it passes, the interjection lands in an in-memory inbox.
4. Clients get notified via `notifications/resources/updated`.
5. Anyone can read the inbox through the `interject://inbox` resource.

No database. No persistence. If the server stops, the inbox is gone — by design.

## Quick Start

Add to your MCP client config (e.g. `claude_desktop_config.json`, `.mcp.json`, or VS Code settings):

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

### From source

```bash
git clone https://github.com/mcp-tool-shop-org/mcp-aside.git
cd mcp-aside
npm install
npm run build
node build/index.js
```

The server speaks MCP over **stdio**.

## Tools

| Tool | What it does |
|---|---|
| `aside.push` | Push an interjection into the inbox. Accepts `text`, `priority` (low/med/high), `reason`, `tags`, `expiresAt`, `source`, and `meta`. |
| `aside.configure` | Tune the guardrails at runtime — TTL caps, rate limits, dedupe windows, notification thresholds. |
| `aside.clear` | Wipe the inbox. |
| `aside.status` | Read-only snapshot of inbox size and current guardrail config. |
| `aside.stats` | Usage statistics: accepted, rejected, deduped, and rate-limited counts. |

## Resource

| URI | Description |
|---|---|
| `interject://inbox` | JSON array of pending interjections, newest first. Expired items are filtered on read. |

## Guardrails

Everything is configurable via `aside.configure`. Defaults:

| Setting | Default | What it controls |
|---|---|---|
| `enabled` | true | Master switch — set to `false` to bypass all guardrails |
| `defaultTtlSeconds` | 600 (10 min) | How long an interjection lives if no explicit expiry is set |
| `maxTtlSeconds` | 3600 (1 hr) | Hard cap on TTL, even if the caller asks for more |
| `dedupeWindowSeconds` | 300 (5 min) | Same priority + text + reason = suppressed within this window |
| `rateLimitWindowSeconds` | 60 | Sliding window for rate limiting |
| `rateLimitMax` | low: 6, med: 3, high: 1 | Max pushes per priority per window |
| `notifyAtOrAbove` | high | Only send log notifications for items at or above this priority |

## Configuration

### Timer Trigger

A built-in timer fires every 5 minutes, pushing a low-priority "any blockers?" check-in. It respects the same guardrails as manual pushes (so it'll get deduped or rate-limited like anything else). Disable it by commenting out the `startTimerTrigger` call in `index.ts`.

### MCP Inspector

For local testing:

```
Transport: STDIO
Command:   node
Args:      build/index.js
```

## Notes

- Logs go to **stderr** — stdout is reserved for MCP JSON-RPC.
- The inbox is ephemeral. Restart = clean slate.
- Interjections are stored newest-first. Expired items are pruned on every read and push.

## Security & Data Scope

mcp-aside is an **MCP server** with an in-memory interjection inbox.

- **Data accessed:** In-memory inbox only — no database, no files, no persistence
- **Data NOT accessed:** No cloud sync. No telemetry. No file system access
- **Network:** stdio transport only — no network listeners. No egress
- **No telemetry** is collected or sent

Full policy: [SECURITY.md](SECURITY.md)

---

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10/10 |
| B. Error Handling | 10/10 |
| C. Operator Docs | 10/10 |
| D. Shipping Hygiene | 10/10 |
| E. Identity (soft) | 10/10 |
| **Overall** | **50/50** |

---

## License

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
