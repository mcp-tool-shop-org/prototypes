# repo-crawler-mcp — Lockdown Status

## Classification
Lock candidate → **locked**

## Phase
Lockdown complete (2026-03-24)

## Primary seam
Crawl/discovery truth

## Seam family
Discovery truth

## Proving packet
CRAWLER-001 — PASS (rerun after 3 blocking fixes in v1.3.1)

## Fixes shipped (v1.3.1)
- Freshness: cacheNote on CrawlResult, getWithMeta() in cache with storedAt/cacheAgeMs
- Coverage: discovery.limitReached, discovery.matchingReposInLimit (replaces totalReposFound), discovery.appliedFilters
- Failure: discovery.failedRepos array (name + error), discovery.failedCount

## Files placed
- `.claude/context/product-brief.md`
- `.claude/context/repo-map.md`
- `.claude/context/brand-rules.md`
- `.claude/context/current-priorities.md`
- `.claude/workflows/protect-discovery-truth.md`

## Follow-up packets
- CRAWLER-005: Extend Tier 3 permission model to Tier 1/2 (permission denial vs genuine absence)
