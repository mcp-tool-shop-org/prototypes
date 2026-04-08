# Repo Map — @mcptoolshop/claude-session-copilot

## Stack

- TypeScript (Node.js)
- MCP SDK (@modelcontextprotocol/sdk) + stdio transport
- 7 source modules + hooks.json
- Node built-in test runner (5 test files, 29 tests)
- Single entry: MCP server (`build/index.js`)

## Module architecture

| Module | Purpose | I/O? |
|--------|---------|------|
| `index.ts` | Entry point, process lifecycle, error handlers | Yes (process signals) |
| `server.ts` | MCP server definition — 7 tools, 4 resources, tool handlers | Yes (MCP transport) |
| `store.ts` | Persistent JSON store — load, save, mutate, ensureSession | Yes (filesystem) |
| `types.ts` | Decision, TimelineEvent, Snapshot, PatternAlert, SessionInfo | No |
| `decisions.ts` | Decision manager — log, recent, search, bySession, byFile | No (delegates to store) |
| `timeline.ts` | Timeline manager — record, forSession, recent, search, summary | No (delegates to store) |
| `patterns.ts` | Pattern detection — repeated failures, file churn, long sessions | No (delegates to store) |
| `hooks.json` | PostToolUse hook prompts for Bash, Write, Edit, TodoWrite | N/A (config) |

## Primary seam: Hook binding + session truth

### Session identity model

```
store.json
  └─ currentSessionId: string | null    ← SINGLE persistent ID
  └─ sessions: Record<SessionId, SessionInfo>
  └─ decisions[], timeline[], snapshots[], patterns[]  ← ALL keyed by sessionId
```

**Critical binding behavior:**
- `ensureSession()` (store.ts:88-97): If `currentSessionId` exists, returns it. If null, creates new.
- **No Claude Code session binding.** The stored ID persists across different Claude Code sessions.
- Calling tools in Claude Session B reuses `currentSessionId` from Session A unless manually cleared.

### Hook mechanism

```
hooks.json → PostToolUse hooks → inject prompt → Claude follows prompt → calls copilot.timeline_event
```

**Not automatic capture.** The hooks inject prompt text that asks Claude to call `copilot.timeline_event`. If Claude doesn't follow the prompt (or the MCP server isn't registered), the event is silently lost.

### Contract surfaces

| Surface | Location | What it governs | Truth concern |
|---------|----------|-----------------|---------------|
| Session ID persistence | `store.ts:88-97` | Single ID reused across Claude Code sessions | **HIGH** — no actual binding |
| Hook prompt execution | `hooks.json` | Timeline events depend on Claude cooperation | **HIGH** — not guaranteed |
| Resume packet | `server.ts:144-185` | Loads last snapshot + decisions without staleness check | **MEDIUM** — no TTL |
| Store corruption recovery | `store.ts:47-62` | Returns empty store on parse failure | **MEDIUM** — silent data loss |
| Global fallback | `store.ts:28-44` | Falls back to ~/.claude/copilot/ if no .claude/ dir | **LOW** — cross-project risk |

### Liar-path surfaces

| Risk | Where | Observable? |
|------|-------|-------------|
| Session ID reuse across Claude Code sessions | store.ts:88-97 | **No** — operator cannot tell if ID is from current or previous CC session |
| Hook prompts not followed → timeline gaps | hooks.json + Claude behavior | **No** — missing events are indistinguishable from "nothing happened" |
| Stale snapshot returned as current | server.ts resume handler | **Partially** — timestamp is in the data but no staleness warning |
| Store corruption → empty store | store.ts:47-62 load() | **No** — silent reset, no warning |
| Multiple CC sessions overwriting same store | store.ts concurrent writes | **No** — last writer wins, no lock |

## Validation

- `npm test` — 29 tests across 5 files (store, decisions, timeline, snapshots, patterns)
- `npm run build` — TypeScript compilation
- **Coverage gaps:** No tests for hook execution, cross-session contamination, store corruption recovery, staleness
