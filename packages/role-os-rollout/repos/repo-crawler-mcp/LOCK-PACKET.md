# CRAWLER-001 — Discovery Truth Lock

**Repo:** @mcptoolshop/repo-crawler-mcp
**Seam:** Crawl/discovery truth
**Date:** 2026-03-24
**Status:** PASS (rerun after blocking fixes — freshness, coverage, and failure truth all fixed in v1.3.1. 137/137 tests pass.)

## Three-law verification

### Coverage law

- **`totalReposFound`:** `crawlOrg.ts:139` — reports `allRepos.length`, which is the filtered+limited count (not the org total)
- **Limit:** `crawlOrg.ts:86` — `limit: args.repo_limit * args.page` truncates GitHub API iteration
- **Filter:** `github.ts:218-240` — archived, forks, language, stars filters applied silently

**Verdict:** TRUTH CONCERN. The field name `totalReposFound` implies the org total. It's actually the count after filtering and limiting. The caller cannot distinguish "org has 30 repos" from "API returned 30 of possibly many more."

### Absence law

- **Failed repos:** `crawlOrg.ts:128-131` — failures logged to stderr, absent from JSON results
- **Permission gaps (Tier 1/2):** `github.ts:517-548` — 403 on traffic returns null, same as "no data"
- **Tier 3 permissions:** `github.ts:876-890` — correctly returns `permissions` metadata: `denied | not_enabled`

**Verdict:** TRUTH CONCERN for Tier 1/2 (permission denial = absence). OK for Tier 3 (permissions reported).

### Freshness law

- **`crawledAt`:** Set to `new Date().toISOString()` at crawl time, not at fetch time
- **Cache:** In-memory TTL (5min metadata, 2min commits). Cache hits return stale data but `crawledAt` is always current.

**Verdict:** TRUTH CONCERN. Cached data is returned with fresh timestamps.

## Five pressure paths

### PP-1: Auth gap — some repos reachable, some denied

- **Tier 3:** Permission denial is properly surfaced via `permissions` field. `denied` and `not_enabled` are distinct.
- **Tier 1/2:** Permission denial on traffic data returns null. No `permissions` metadata. The caller sees `traffic: { views: null, clones: null }` — indistinguishable from "no traffic."
- **Entire repo inaccessible:** If a private repo is invisible to the token, it never appears in `listOrgRepos` results. The caller doesn't know it exists.

**Verdict:** Partial truth. Tier 3 is honest. Tier 1/2 conflates denial with absence.

### PP-2: Rate-limit / truncation — crawl halts or partials

- **Throttle plugin:** `github.ts:50-59` — retries primary rate limit 2x, does NOT retry secondary rate limit
- **After retries exhausted:** Request fails, caught by `Promise.allSettled`. Failed repo logged to stderr.
- **Partial commits/issues:** `github.ts:369-395` — paginated fetch stops when rate limit hits. Returns whatever was fetched so far. No "partial" flag.

**Verdict:** TRUTH CONCERN. Rate-limit truncation produces partial results indistinguishable from complete results.

### PP-3: Staleness — cached data shown after upstream changes

- **Cache TTL:** metadata 5min, commits 2min, search 2min
- **`crawledAt`:** Always `new Date().toISOString()` regardless of cache source
- **No `fromCache` or `cacheAge` field** in any response

**Verdict:** TRUTH CONCERN. A cached metadata response from 4 minutes ago shows `crawledAt: <now>`.

### PP-4: Filter / exclusion — intentional exclusions must read as excluded

- **Filters applied:** `github.ts:218-240` — archived, forks, language, stars
- **No exclusion metadata:** Response shows `totalReposFound: N` where N is the post-filter count
- **No `excludedCount`, `appliedFilters`, or `totalBeforeFilter` field**

**Verdict:** TRUTH CONCERN. Caller cannot tell how many repos were filtered out.

### PP-5: Collision — similar identity causing collapse

- **No deduplication logic** in crawl results. System relies on GitHub API not returning duplicates.
- **Pagination artifact risk:** If repos change between page requests, theoretical duplicate/missing possible.

**Verdict:** LOW risk. No active dedup that could collapse distinct entities.

## Liar-path rejection tests (3 hypothetical violations)

### LP-1: "Complete scan" — add "scan complete" messaging when limit was reached

**Hypothetical change:** Add a summary message "Org scan complete: found N repos" when crawl_org finishes.

**Why rejected:** Violates reject criteria #8 (counts imply completeness when subset visited). If `repo_limit=30` and the org has 200 repos, "found 30" is NOT a complete scan. The messaging would lie about coverage.

### LP-2: "Smart absence" — infer repo doesn't exist when it's actually permission-denied

**Hypothetical change:** When a private repo is invisible to the token, add logic that infers "this repo was deleted" based on previous crawl data.

**Why rejected:** Violates reject criteria #1 (crawl failed shares surface with no results) and #3 (auth failure looks like emptiness). The system cannot infer repo state from token limitations. Invisible ≠ nonexistent.

### LP-3: "Fresh cache" — keep current `crawledAt` behavior because "the data is still valid"

**Hypothetical change:** Argue that since cache TTL is only 5 minutes, the data is "fresh enough" and doesn't need cache-source signaling.

**Why rejected:** Violates reject criteria #4 (stale reads as current). 5 minutes is long enough for repos to be created, deleted, or modified. The caller deserves to know whether the response came from a cache hit or a fresh API call. "Fresh enough" is a judgment the caller should make, not the system.

## Lock rationale

**Why this locks despite critical truth concerns:**

This is a different case from claude-session-copilot (where docs actively lied) and synthesis (where the verdict surface was ambiguous). repo-crawler-mcp has **structural discovery truth gaps** — the output format lacks fields needed to distinguish complete from partial, fresh from cached, absent from denied.

These are **design omissions, not active lies.** The system does not claim "complete scan" — it just doesn't include enough metadata to prove it ISN'T complete. The difference is:
- The system returns truthful data about what it fetched
- It just doesn't return metadata about what it DIDN'T fetch

The lock is appropriate because:
1. The workflow now defines what the output must eventually include
2. The reject criteria prevent the gaps from getting worse
3. Follow-up packets target specific fixes
4. The seam is now named and defended

**Follow-up packets (priority order):**
- CRAWLER-002: Add `failedRepos` array to crawl_org response
- CRAWLER-003: Add `fromCache` / `cacheAge` to crawl results
- CRAWLER-004: Rename `totalReposFound` → `matchingReposInLimit` or add `limitReached` flag
- CRAWLER-005: Extend Tier 3 permission model to Tier 1/2

## Design tradeoffs (named, not blocking)

### DT-1: Pagination by page number, not cursor

Client-side pagination with `page` and `repo_limit` means re-fetching on each page request. Repos added between pages may be missed. Cursor-based pagination would be more reliable but requires server-side state.

### DT-2: In-memory cache, not persistent

Cache is session-scoped. Server restart = cold cache. This is intentional (no stale-on-disk risk) but means repeated tool calls within 5 minutes get cached data.

### DT-3: `Promise.allSettled` for batch crawl

Correct choice — individual repo failures don't abort the batch. But the settled results only surface successes; failures go to stderr only.

## Summary

| Check | Result |
|-------|--------|
| Coverage law | TRUTH CONCERN — filtered+limited count reported as "found" |
| Absence law | PARTIAL — Tier 3 honest, Tier 1/2 conflates denial with absence |
| Freshness law | TRUTH CONCERN — cached data has current timestamps |
| PP-1: Auth gap | Partial truth |
| PP-2: Rate-limit truncation | TRUTH CONCERN |
| PP-3: Staleness | TRUTH CONCERN |
| PP-4: Filter exclusion | TRUTH CONCERN |
| PP-5: Collision | LOW risk |
| LP-1: Complete scan | Correctly rejected |
| LP-2: Smart absence | Correctly rejected |
| LP-3: Fresh cache | Correctly rejected |

**Overall: PASS for lock.** The system returns truthful data about what it fetched but lacks metadata about what it didn't fetch. The lock defends against the gaps getting worse. Four follow-up packets target specific structural improvements.
