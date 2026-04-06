# Workflow: Protect Ephemeral Truth

**Repo:** @mcptoolshop/mcp-aside
**Seam:** Ephemeral lifecycle truth — the boundary where identity, lifetime, and resurrection semantics must remain explicit and where expired, duplicated, or replayed state must never share the same surface as fresh state.

## What this workflow protects

The contract that every aside has explicit identity (`priority:text:reason`), an immutable lifetime (TTL set at write time), and clear resurrection semantics (none — re-push creates new state). The caller always knows exactly what happened.

## Automatic reject criteria (8)

A proposed change MUST be rejected if it:

1. **Allows expired state to read as live** — introduces a read path that returns items past their `expiresAt`, adds a "grace period," or makes expiry checks optional
2. **Makes dedupe collapse distinct intents into one identity** — changes the hash to include fewer fields (e.g., dropping `reason`), or allows dedupe to match on partial content, without understanding the identity contract implications
3. **Allows semantically same aside to bypass dedupe** — adds fields to the hash that make trivially different payloads appear distinct (e.g., adding `createdAt` or random salt to the hash)
4. **Enables replay/resurrection of dead state** — adds a "refresh," "renew," or "revive" operation that extends TTL on an expired item without creating genuinely new state
5. **Makes TTL differ between write path and read path** — introduces read-time TTL computation, lazy expiry extension, or any mechanism where the item's lifetime depends on when it's read
6. **Destroys push-outcome provenance** — collapses `ok: true`, `DEDUPED`, `RATELIMIT`, and `TEXT.EMPTY` into a generic success/failure without distinct codes
7. **Presents expired/missing state as absent rather than expired** — while the system correctly treats both as empty inbox, any change that adds "history" or "recent" views must distinguish between "nothing was ever pushed" and "items existed but expired"
8. **Makes human-facing reassurance stronger while leaving machine-facing semantics unchanged** — e.g., tool response says "aside noted" when the actual outcome was `INBOX.DEDUPED` (org-wide reassurance drift rule)

## The key question this workflow answers

**Can this system ever cause old or collapsed side-state to be mistaken for a fresh, distinct, currently valid aside?**

### Answer: No, under current architecture, with documented caveats

- Expired items: unconditionally filtered on every read. Cannot leak.
- Deduped items: distinct response code (`INBOX.DEDUPED`). Caller always knows.
- Replayed items: dedupe history blocks re-push within window. After window, re-push creates new state.
- Rate-limited items: distinct response code (`INBOX.RATELIMIT`). Caller always knows.

### Caveats that must remain documented
- Source/tags/meta are excluded from dedupe identity — two different-source asides with same `(priority, text, reason)` will collide
- Expired vs absent is indistinguishable from the read path — both return empty list
- Dedupe history outlives items — re-push may be blocked even though the original expired
- TOCTOU race is latent in Guardrails if used outside serialized MCP context

## When to re-prove

Re-prove this workflow when:
- Dedupe hash inputs change
- TTL computation or clamping logic changes
- Expiry comparison operator changes
- New push outcome codes are added
- Persistence is added (fundamental architecture change)
- Concurrency model changes
