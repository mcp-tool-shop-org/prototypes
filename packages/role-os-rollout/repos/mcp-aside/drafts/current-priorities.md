# Current Priorities — @mcptoolshop/mcp-aside

## Status

Locked (Role OS lockdown 2026-03-24). Primary seam: ephemeral lifecycle truth.

## Classification

Lock candidate → locked.

## Seam family

Ephemeral state truth — same family as any system where temporary state must have explicit identity, lifetime, and resurrection semantics.

## Must-preserve invariants (8)

1. **Expired items never surface** — `list()` unconditionally filters expired items. No read path returns stale state.
2. **Push outcome is always explicit** — every push returns exactly one of: `ok: true`, `INBOX.DEDUPED`, `INBOX.RATELIMIT`, `INBOX.TEXT.EMPTY`. No ambiguous "maybe accepted" state.
3. **Dedupe identity is `(priority, text, reason)`** — source, tags, and metadata are excluded by design. This scope must be documented.
4. **TTL is immutable** — set at write time, never extended or refreshed. No renewal mechanism.
5. **No resurrection** — expired items cannot be revived. Re-push creates entirely new state with new UUID.
6. **Dedupe history outlives items** — an expired item's hash remains in history for the dedupe window, preventing immediate replay.
7. **In-memory only** — all state is lost on server restart. No disk persistence, no cloud sync.
8. **Rate limiting is per-priority, global** — not per-source. A high-priority push from any source counts against the same cap.

## Banned detours

- Adding disk persistence ("but asides should survive restart" — that's a different product)
- Adding TTL renewal/extension ("but the aside is still relevant" — re-push with new TTL instead)
- Adding source-based dedupe ("but different agents should be able to post the same aside" — that changes the identity contract)
- Adding "soft expiry" where expired items are returned with a warning (expired means invisible)
- Adding message queuing semantics (asides are not messages; they're ephemeral state)
