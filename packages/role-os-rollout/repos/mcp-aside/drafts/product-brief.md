# Product Brief — @mcptoolshop/mcp-aside

## What this is

MCP server that maintains an in-memory interjection inbox with guardrails (TTL, rate-limit, dedupe). Provides ephemeral side-channel state for AI agents — a way to surface blockers, context notes, and side-thoughts mid-task without interrupting the primary work stream. All state is in-memory only; nothing persists to disk.

## Type

MCP server (stdio transport, in-memory state, 4 tools + 1 resource)

## Core value

Ephemeral state with explicit lifecycle: every aside has an identity, a lifetime, and a clear outcome (accepted, deduped, rate-limited, expired). The system never silently drops, merges, or revives state.

## What it is not

- Not persistent storage — all state is in-memory, lost on server restart
- Not a message queue — no ordering guarantees beyond "newest first"
- Not a collaboration tool — single-instance, single-agent inbox
- Not a decision system — it surfaces interjections, it does not evaluate or act on them

## Anti-thesis (6 statements)

1. Must never allow expired state to surface as live — read path unconditionally filters expired items
2. Must never collapse distinct intents into one identity when they differ only in source, tags, or metadata — the dedupe key is `(priority, text, reason)` by design, and this scope must be documented honestly
3. Must never allow a deduped push to look like an accepted push — the response codes `ok: true` and `INBOX.DEDUPED` are structurally distinct
4. Must never silently revive dead state — there is no refresh/renew mechanism; re-push creates new state
5. Must never obscure why a push was rejected — every rejection has an explicit code (DEDUPED, RATELIMIT, TEXT.EMPTY)
6. Must never present "no asides" and "all asides expired" as different states — from the caller's perspective, both are empty inbox, and this equivalence must be documented

## Highest-risk seam

**Ephemeral lifecycle truth** — the boundary where identity, lifetime, and resurrection semantics must remain explicit. The liar-paths are: expired state leaking into reads, dedupe collapsing distinct intents, resurrection reviving dead state without new identity, and the caller not knowing whether a push was accepted, deduped, or rejected.
