# mcp-aside — Repo-Local Decisions

## 2026-03-24 — Dedupe identity is semantic, not provenance-based

**Decision:** Dedupe identity is `(priority, text, reason)`. Source, tags, and metadata are excluded. Two asides from different sources with identical semantic content are the same aside.

**Why:** The inbox is about surfacing unique content, not tracking who said it. Source-scoped dedupe would change the identity contract and allow the same blocker to appear multiple times from different agents.

**Applies to:** guardrails.ts hash computation, all documentation about dedupe behavior.

---

## 2026-03-24 — Expired means invisible, not "available with warning"

**Decision:** Expired items are unconditionally filtered from all read paths. There is no "soft expiry" or "expired but still accessible" mode.

**Why:** The whole value of TTL is that expired state is gone. Returning expired items with warnings would create ambiguity about whether callers should use them. Binary: live or gone.

**Applies to:** inbox.ts list() and all consumer-facing surfaces.
