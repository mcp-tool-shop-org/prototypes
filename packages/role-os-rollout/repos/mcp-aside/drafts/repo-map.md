# Repo Map — @mcptoolshop/mcp-aside

## Stack

- TypeScript (Node.js), 2 runtime dependencies (@modelcontextprotocol/sdk, zod)
- 4 source modules + 1 trigger module
- Node built-in test runner (2 test files, 25 tests)
- Single entry: MCP server (`build/index.js`)

## Module architecture

| Module | Purpose | State? |
|--------|---------|--------|
| `index.ts` | MCP server setup, 4 tools + 1 resource, notifications | Yes (owns inbox + guardrails instances) |
| `inbox.ts` | In-memory interjection storage, expiry filtering, ordering | Yes (mutable items array) |
| `guardrails.ts` | Dedupe, rate-limit, TTL normalization, push decision | Yes (mutable history array) |
| `triggers.ts` | Background timer for periodic check-in nudges | Yes (interval timer) |

## Primary seam: Ephemeral lifecycle truth

### Three laws this seam governs

**Identity law:** `(priority, text, reason)` tuple. Source, tags, and metadata are excluded from dedupe identity. SHA256(16 hex chars). Two asides identical in this triple within the dedupe window are the same aside.

**Lifetime law:** TTL set at write time, immutable. Default 600s, max 3600s, min 1s. Expired items filtered on every list() and push() call. No renewal, no extension. Expiry comparison: `expiresAt <= now` (no grace period).

**Resurrection law:** No resurrection. Re-push after expiry creates entirely new state (new UUID, new timestamps). Dedupe history outlives the item — if the dedupe window hasn't passed, re-push of identical content is rejected even though the original item expired.

### Contract surfaces

| Surface | Location | Governs |
|---------|----------|---------|
| Dedupe identity | `guardrails.ts:64` | `stableHash(priority:text:reason)` — source/tags/meta excluded |
| TTL normalization | `guardrails.ts:57-61` | Clamp to [1s, maxTtl], set at write time, immutable |
| Expiry check | `inbox.ts:26` | `expiresAt <= now` — strict, no grace period |
| Lazy cleanup | `inbox.ts:36-39, 47-49` | Expired items filtered on every list() and push() |
| Push outcome | `guardrails.ts` | Returns exactly one of: ok/DEDUPED/RATELIMIT/TEXT.EMPTY |
| Rate limit scope | `guardrails.ts:72-74` | Per-priority, sliding window, global (not per-source) |
| Dedupe window | `guardrails.ts:51, 66` | Default 5 min, history pruned on every decidePush() |

### Liar-path surfaces

| Risk | Where | Exploitable? |
|------|-------|--------------|
| Expired item returned on read | inbox.ts list() | **No** — unconditional filter |
| Dedupe collapses different-source asides | guardrails.ts:64 | **By design** — source excluded from hash. Must be documented. |
| Deduped push looks like accepted push | guardrails.ts return codes | **No** — distinct codes (ok vs INBOX.DEDUPED) |
| Expired vs absent indistinguishable | inbox.ts list() | **By design** — both return empty list. Must be documented. |
| TOCTOU race in concurrent decidePush | guardrails.ts:64-78 | **Latent** — not exploitable in MCP stdio (serialized), but code doesn't document assumption |
| Dedupe history outlives item → blocks re-push | guardrails.ts:51 | **By design** — prevents replay within window, but may surprise callers |

## Validation

- `npm test` — 25 tests across 2 files (inbox, guardrails)
- `npm run build` — TypeScript compilation
- Key test gaps: no resurrection timing test, no TTL boundary precision test, no concurrent race test
