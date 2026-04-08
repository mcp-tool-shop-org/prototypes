# Product Brief — @mcptoolshop/claude-session-copilot

## What this is

MCP server that persists session state (decisions, timeline events, snapshots, pattern alerts) to a local JSON store, providing continuity data across Claude Code sessions. Runs via stdio transport, exposes 7 tools and 4 resources. Timeline events are populated by PostToolUse hook prompts (not automatic capture).

## Type

MCP server (stdio transport, project-local or global JSON store)

## Core value

Decisions, timeline, and snapshots survive `/compact` and session boundaries. The operator can call `copilot.resume` to load the last saved state and continue work with context.

## What it is not

- Not a session binding system — it persists data keyed by a stored session ID, but does not bind to Claude Code's actual session context
- Not an automatic capture system — timeline events depend on Claude following hook prompts, not on guaranteed interception
- Not a session authority — it cannot verify that recovered context belongs to the current Claude Code session
- Not a freshness guarantor — snapshots and decisions have no TTL; a 7-day-old snapshot is returned without staleness warning
- Not an isolation boundary — multiple Claude Code sessions in the same project share the same `currentSessionId` in the persistent store

## Anti-thesis (7 statements)

1. Must never become a fake continuity layer — the system persists data, it does not guarantee that persisted data matches the current session's reality
2. Must never be a session guesser — if binding to the actual Claude Code session is not verified, the system must say so
3. Must never be a "close enough" binder — reusing a stored `currentSessionId` across different Claude Code sessions without signaling is a truth gap
4. Must never be a hidden fallback assistant — when hooks don't fire (Claude doesn't follow the prompt), the missing events must be detectable, not silently absent
5. Must never be a conversational wrapper that obscures hook truth — "auto-record" language must honestly reflect that recording depends on prompt-based hooks, not guaranteed interception
6. Must never imply active session authority it does not have — the system knows what was last stored, not what is currently happening
7. Must never present stale state as current without explicit signaling — if a snapshot is hours/days old, the age must be visible

## Highest-risk seam

**Hook binding + session truth** — the boundary between what the system claims about session state and what is actually true. The liar-paths are: reused session ID across different Claude Code sessions, hook prompts that don't fire, stale snapshots presented as current, and no verification that "resumed" context belongs to the active session.
