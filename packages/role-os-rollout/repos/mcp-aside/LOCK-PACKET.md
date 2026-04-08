# ASIDE-001 — Ephemeral Lifecycle Truth Lock

**Repo:** @mcptoolshop/mcp-aside v1.0.0
**Seam:** Ephemeral lifecycle truth (identity, lifetime, resurrection)
**Date:** 2026-03-24
**Status:** PASS (clean — no blocking defects, 3 design caveats documented)

## Three-law verification

### Identity law: `(priority, text, reason)` tuple

- **Hash computation:** `guardrails.ts:64` — `stableHash(priority:text:reason)` using SHA256 truncated to 16 hex chars
- **Text normalization:** `guardrails.ts:54` — `text.trim()` before hashing. Whitespace-only differences are collapsed.
- **Excluded fields:** `source`, `tags`, `meta` — by design, identity is semantic content, not provenance
- **UUID per push:** `inbox.ts:49` — `crypto.randomUUID()` on every accepted push. System ID is always unique; semantic ID governs dedupe.

**Verdict:** PASS. Identity law is clear, documented in code, and tested.

### Lifetime law: TTL immutable at write time

- **TTL normalization:** `guardrails.ts:57-61` — clamp to `[1s, maxTtlSeconds]`, compute `expiresAt` from `now + capped * 1000`
- **Immutability:** No setter, no refresh, no extend. `Interjection` is a plain data object; `expiresAt` is set once.
- **Expiry check:** `inbox.ts:26` — `isExpired(item, now)` returns `true` when `expiresAt <= now`. Strict, no grace period.
- **Lazy cleanup:** `inbox.ts:36-39` (list) and `inbox.ts:47-49` (push) — filter expired on every call.

**Verdict:** PASS. Lifetime is write-once, checked on every read, cleaned up eagerly.

### Resurrection law: No resurrection

- **Re-push creates new state:** New UUID, new `createdAt`, new `expiresAt`. No link to previous item.
- **Dedupe blocks replay:** History entries outlive items. If the dedupe window hasn't passed, re-push of identical content is rejected with `INBOX.DEDUPED`.
- **After dedupe window:** Re-push is accepted as genuinely new state. No reference to the previous item exists.

**Verdict:** PASS. Dead state stays dead. Re-push either creates new state (after dedupe window) or is rejected (within window).

## Five pressure paths

### PP-1: TTL edge — creation, near-expiry read, expiry crossing, post-expiry read

- **Creation:** `guardrails.ts:57-61` normalizes TTL, `inbox.ts:47-54` creates item with `expiresAt`
- **Near-expiry read:** `inbox.ts:36-39` — `isExpired` returns false, item is returned
- **Expiry crossing:** At exact `expiresAt` millisecond, `expiresAt <= now` returns true → item is expired
- **Post-expiry read:** Next `list()` call filters it out. Caller sees empty or reduced list.

**Verdict:** PASS. No gap. The `<=` comparison means the exact boundary is expired, not live.

### PP-2: Dedupe collision — same key/different payload, same payload/different scope, near-same/same intent

- **Same `(priority, text, reason)` / different source:** Deduped. Source is excluded from hash. `guardrails.ts:64` only hashes the semantic triple. (**Caveat: this could surprise callers who expect source-scoped dedupe.**)
- **Same payload / different priority:** Not deduped. Priority is in the hash.
- **Same payload / different reason:** Not deduped. Reason is in the hash.
- **Near-same text (whitespace difference):** Deduped. Text is trimmed before hashing.

**Verdict:** PASS. Dedupe behavior is deterministic and consistent with the documented identity law. The source-exclusion caveat must be documented.

### PP-3: Replay — expired aside reintroduced

- **Scenario:** Push at T0, item expires at T0+10min, re-push at T0+12min (after dedupe window of 5min)
- **Result:** Dedupe history has been pruned (T0 entry is older than T0+12min - 5min = T0+7min). Re-push is accepted as new state.
- **Scenario:** Push at T0, item expires at T0+3min (short TTL), re-push at T0+4min (within 5min dedupe window)
- **Result:** Dedupe history still has the entry. Re-push is rejected with `INBOX.DEDUPED`.

**Verdict:** PASS. Replay within dedupe window is blocked. Replay after dedupe window creates genuinely new state. No resurrection of dead items.

### PP-4: Race — two writes arriving near-simultaneously with overlapping identity

- **Theoretical risk:** Two `decidePush()` calls with identical semantic content enter the dedupe check concurrently. Both read history, both find no match, both write to history.
- **Actual risk in MCP deployment:** Zero. Stdio transport processes one message at a time. Calls are serialized by the event loop.
- **Risk outside MCP:** Real TOCTOU race. The code does not use locks or atomic compare-and-swap.

**Verdict:** PASS for current deployment. **Documented caveat:** Guardrails assumes single-threaded or externally serialized callers.

### PP-5: Surface truth — every outward result says exactly what happened

- **Accepted:** `{ ok: true, item: {...} }` — full item with UUID, timestamps, TTL
- **Deduped:** `{ ok: false, code: "INBOX.DEDUPED", message: "..." }` — explicit rejection
- **Rate-limited:** `{ ok: false, code: "INBOX.RATELIMIT", message: "..." }` — explicit rejection
- **Empty text:** `{ ok: false, code: "INBOX.TEXT.EMPTY", message: "..." }` — explicit rejection
- **Read (live items):** `{ items: [...] }` — only non-expired items
- **Read (all expired):** `{ items: [] }` — indistinguishable from "never pushed" (**documented caveat**)

**Verdict:** PASS. Every push outcome is explicitly coded. The only ambiguity is expired-vs-absent on reads, which is a documented design choice.

## Liar-path rejection tests (3 hypothetical violations)

### LP-1: "Soft expiry" — return expired items with a warning

**Hypothetical change:** Instead of filtering expired items, return them with an `expired: true` flag so callers can decide whether to use them.

**Why rejected:** Violates reject criteria #1 (allows expired state to read as live). The whole point of TTL is that expired means invisible. Returning expired items with a flag creates ambiguity — callers might use them "just in case." The contract is binary: live or gone.

### LP-2: "Smart dedupe" — add source to the hash so different agents can post the same aside

**Hypothetical change:** Include `source` in the dedupe hash so two agents posting identical `(priority, text, reason)` are treated as distinct.

**Why rejected:** Violates the identity law. The current identity is semantic: if the content is the same, it's the same aside regardless of who posted it. Adding source creates a new identity contract. Not inherently wrong, but would require renegotiating the identity law, updating all tests, and documenting the new semantics. Cannot be slipped in as a "bug fix."

### LP-3: "Friendly rejection" — return `ok: true` for deduped pushes

**Hypothetical change:** Instead of `{ ok: false, code: "INBOX.DEDUPED" }`, return `{ ok: true, deduped: true }` since "the intent was captured" by the existing item.

**Why rejected:** Violates reject criteria #6 (destroys push-outcome provenance). The caller must know the difference between "I created a new item" and "my push was suppressed because an identical item already exists." Collapsing these into `ok: true` makes the dedupe mechanism invisible to consumers.

## Design caveats (named, not blocking)

### DC-1: Source/tags/meta excluded from dedupe identity

Two asides from different sources with identical `(priority, text, reason)` will collide. This is by design (semantic identity), but could surprise callers who expect per-source scoping.

**Acceptable because:** The alternative (source-scoped dedupe) would change the identity contract fundamentally. The current design prevents duplicate content regardless of origin, which is the correct default for an inbox.

### DC-2: Expired vs absent indistinguishable on read

Both return empty `items: []`. The system does not track "this inbox once had items but they expired" vs "nothing was ever pushed."

**Acceptable because:** Adding history/archive of expired items would make the system no longer ephemeral. The whole point is that expired state is gone. But this should be documented for callers who might interpret an empty inbox as "nothing happened."

### DC-3: TOCTOU race in Guardrails under concurrent use

Guardrails assumes single-threaded or externally serialized calls. If used in a concurrent context (HTTP server without serialization), the dedupe check has a race window.

**Acceptable because:** The MCP deployment model (stdio) serializes all calls. The race is not exploitable in the current architecture. But the assumption should be documented in code comments.

## Summary

| Check | Result |
|-------|--------|
| Identity law (dedupe triple) | PASS |
| Lifetime law (TTL immutability) | PASS |
| Resurrection law (no revival) | PASS |
| PP-1: TTL edge | PASS |
| PP-2: Dedupe collision | PASS (with DC-1 caveat) |
| PP-3: Replay | PASS |
| PP-4: Race | PASS (with DC-3 caveat) |
| PP-5: Surface truth | PASS (with DC-2 caveat) |
| LP-1: Soft expiry | Correctly rejected |
| LP-2: Smart dedupe | Correctly rejected |
| LP-3: Friendly rejection | Correctly rejected |

**Overall: PASS (clean).** No blocking defects. 3 design caveats documented. All five pressure paths verified. The system's lifecycle truth holds: expired state never surfaces, dedupe is explicit, resurrection is impossible, and every push outcome is distinctly coded.
