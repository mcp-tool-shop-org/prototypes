<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-session-copilot/readme.png" width="400" />
</p>

<p align="center">
  <strong>Session memory for Claude Code.</strong><br>
  Captures decisions, timelines, and patterns across sessions. Makes context recoverable after <code>/compact</code>.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/claude-session-copilot/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-session-copilot/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-session-copilot"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-session-copilot" alt="npm" /></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-session-copilot/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/claude-session-copilot" alt="License: MIT" /></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-session-copilot/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

---

## Why?

Claude Code sessions are ephemeral. When you `/compact` or start fresh, your reasoning, decisions, and progress disappear. Session Copilot captures all of that and makes it recoverable.

**This plugin only works in Claude Code** — it depends on PostToolUse hooks, skills, resource notifications, and CLAUDE.md context injection that no other MCP client has.

## Quick Start

```bash
npx @mcptoolshop/claude-session-copilot
```

### Claude Code Plugin

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

## What It Does

### 7 Tools

| Tool | Purpose |
|------|---------|
| `copilot.decision` | Log a decision (what, why, alternatives rejected) |
| `copilot.snapshot` | Save session state for continuity |
| `copilot.resume` | Load latest snapshot + decisions for a new session |
| `copilot.timeline_event` | Record a timeline event |
| `copilot.query` | Search decisions/timeline/snapshots |
| `copilot.pulse` | Project health dashboard |
| `copilot.forget` | Prune old data |

### 4 Skills (Claude Code only)

| Skill | What it does |
|-------|-------------|
| `/copilot:resume` | Pick up where the last session left off |
| `/copilot:snapshot` | Save comprehensive state before `/compact` |
| `/copilot:decisions` | Review the decision log |
| `/copilot:pulse` | Project health dashboard |

### 4 PostToolUse Hooks (Claude Code only)

Hook prompts request timeline recording after (prompt-based — events may be missed if Claude does not execute the prompt):
- **Bash** — detects build/test results (pass/fail)
- **Write** — records file creation
- **Edit** — records file modification
- **TodoWrite** — records task state changes

### Pattern Detection

Surfaces alerts when it notices:
- **Repeated failure** — same command fails 3+ times
- **File churn** — same file edited 5+ times in one session
- **Long session** — 100+ events without a snapshot

### 4 Resources

| URI | What it shows |
|-----|---------------|
| `copilot://pulse` | Live project health |
| `copilot://timeline` | Current session events |
| `copilot://decisions` | Recent decision log |
| `copilot://snapshot/latest` | Most recent handoff note |

## Session Lifecycle

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Session Start│ ──► │  /copilot:resume  │ ──► │   Work normally  │
└─────────────┘     └──────────────────┘     │  (hooks auto-    │
                                              │   track events)  │
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │ copilot.decision │
                                              │ (log key choices)│
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │/copilot:snapshot │
                                              │ (before /compact)│
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │  Next session    │
                                              │  /copilot:resume │
                                              └─────────────────┘
```

## Storage

Data persists in `.claude/copilot/store.json` (project-local) or `~/.claude/copilot/store.json` (global fallback).

Override with `COPILOT_STORE_PATH` environment variable.

## Why Claude Code Only?

This server is architecturally dependent on Claude Code primitives:

| Feature | Claude Code Primitive | Other MCP Clients |
|---------|----------------------|-------------------|
| Auto-timeline | PostToolUse hooks | No hooks system |
| Slash commands | Skills (SKILL.md) | No skills |
| Context injection | CLAUDE.md | No equivalent |
| Live dashboards | Resource notifications | Don't poll resources |
| Task coordination | TodoWrite hooks | No TodoWrite |

Without these, the server is just a JSON file with no way to populate it via hook prompts.

## Session Model & Limitations

Claude Session Copilot is a **persistence layer**, not a session-binding system.

- **Session ID is stored, not bound.** `currentSessionId` persists in the JSON store across different Claude Code sessions. It is not derived from or verified against the active Claude Code session context.
- **Multiple Claude Code sessions in the same project share one stored session ID.** Decisions and events from different sessions may be mixed under the same ID.
- **Hook-based timeline is prompt-based, not guaranteed.** PostToolUse hooks inject prompts that ask Claude to call `copilot.timeline_event`. If Claude does not execute the prompt, the event is not recorded. Timeline gaps are expected.
- **Resume loads stored data, not verified current state.** `copilot.resume` returns the last stored snapshot with age signaling. A stale snapshot (>24 hours) is flagged as STALE. Freshness assessment is the consumer's responsibility.
- **No file locking.** Concurrent Claude Code sessions may overwrite each other's writes to `store.json`.

## Security & Data Scope

Claude Session Copilot is a **local-only MCP server** — no network requests, no telemetry, no cloud services.

- **Data accessed:** Reads and writes session data (decisions, timeline events, snapshots) to `.claude/copilot/store.json`. Monitors PostToolUse hooks for event metadata (file paths, command results).
- **Data NOT accessed:** No network requests. No telemetry. No credential storage. Does not read source code contents — only records file paths and event metadata.
- **Permissions required:** File system read/write for the copilot store. MCP stdio transport (no network listeners).

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

## Scorecard

| Category | Score |
|----------|-------|
| Security | 10/10 |
| Error Handling | 10/10 |
| Operator Docs | 10/10 |
| Shipping Hygiene | 10/10 |
| Identity | 10/10 |
| **Overall** | **50/50** |

---

## License

MIT

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
