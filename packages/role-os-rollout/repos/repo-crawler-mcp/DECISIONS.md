# repo-crawler-mcp — Repo-Local Decisions

## 2026-03-24 — "Found" does not mean "all that exist"

**Decision:** `totalReposFound` is the count of repos matching filters within the pagination limit. It is not the org's total repo count. Language and output must not conflate these.

**Why:** An org with 200 repos, filtered to 30, reports `totalReposFound: 30`. Without context, callers assume this is the org total.

**Applies to:** crawlOrg.ts output, docs, any consumer that uses this field.

---

## 2026-03-24 — Failed repos must be surfaceable, not just logged

**Decision:** Repos that fail during crawl_org must be available in the response, not just logged to stderr. The current implementation drops failures silently. Follow-up packet CRAWLER-002 will add a `failedRepos` array.

**Why:** A caller receiving `totalCrawled: 25` and `totalReposFound: 50` has no way to know what happened to the other 25. Were they rate-limited? Permission denied? Network failure?

**Applies to:** crawlOrg.ts batch processing, response schema.

---

## 2026-03-24 — Cached data must not wear fresh timestamps

**Decision:** When data is served from cache, the response must indicate this. `crawledAt` currently always shows current time regardless of cache source. Follow-up packet CRAWLER-003 will add cache-source signaling.

**Why:** A 4-minute-old cache hit looks identical to a fresh API response. The caller cannot assess data freshness.

**Applies to:** All tool responses that may serve cached data.
