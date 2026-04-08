# Repo Map — @mcptoolshop/repo-crawler-mcp

## Stack

- TypeScript (Node.js), Octokit (GitHub API client with throttling)
- MCP SDK, stdio transport
- In-memory TTL cache (5min metadata, 2min commits/search)
- Vitest test runner

## Primary seam: Crawl/discovery truth

### Three laws this seam governs

**Coverage law:** `totalReposFound` (line 139 crawlOrg.ts) is the filtered+limited count, NOT the org's true total. The limit is `repo_limit * page` — a 10,000-repo org with repo_limit=30, page=1 fetches at most 30 and reports `totalReposFound: 30`. No `isTruncated` or `totalOrgRepos` field exists.

**Absence law:** Failed repos in crawl_org are logged to stderr (line 130) but silently absent from results. The response shows `totalCrawled: N` (successes only) and `totalReposFound: M` (filtered+limited). The gap M-N is unexplained — no `failedRepos`, `failedCount`, or `partialCoverage` field.

**Freshness law:** `crawledAt` is always `new Date().toISOString()` even when data came from cache. Cache TTLs (5min metadata, 2min commits) mean stale data can be served. No `fromCache`, `cacheAge`, or `dataFreshAt` field in output.

### Contract surfaces with truth concerns

| Surface | Location | Truth gap |
|---------|----------|-----------|
| `totalReposFound` | crawlOrg.ts:139 | **CRITICAL** — reports filtered+limited count as "found" |
| Failed repos | crawlOrg.ts:128-131 | **CRITICAL** — logged to stderr, absent from JSON response |
| `crawledAt` | crawlRepo.ts:42 | **HIGH** — always current time, even for cached data |
| Permission gaps (Tier 1/2) | github.ts:517-548 | **HIGH** — 403 on traffic → null, indistinguishable from "no data" |
| Filter exclusions | github.ts:218-240 | **MEDIUM** — silently filtered, no exclusion count in response |
| Rate limit truncation | github.ts:50-59 | **MEDIUM** — throttle plugin retries 2x, then silently stops iteration |
| Tier 3 permissions | github.ts:876-890 | **OK** — returns `permissions` metadata distinguishing denied/not_enabled |

### Liar-path surfaces

| Path | Risk | Surface lie |
|------|------|------------|
| Pagination truncation | CRITICAL | "Found 30 repos" when org has 10,000 |
| Failed repo silent drop | CRITICAL | 25/50 repos fail, response shows only 25 successes |
| Cached data fresh timestamp | HIGH | 4-min-old cache data served with `crawledAt: <now>` |
| Permission gap as absence | HIGH | "No traffic data" could mean "403 denied" or "truly no data" |
| Filter exclusion invisible | MEDIUM | 70 archived repos excluded, response shows 30 found |
| Rate limit mid-crawl | MEDIUM | Partial commits/issues returned as if complete |
