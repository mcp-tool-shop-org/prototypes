# Workflow: Protect Discovery Truth

**Repo:** @mcptoolshop/repo-crawler-mcp
**Seam:** Crawl/discovery truth — the boundary where the system claims what was seen, missed, failed, excluded, and is current.

## What this workflow protects

The contract that discovery results honestly report coverage, absence causes, and data freshness — so that consumers never mistake truncated, cached, filtered, or partially failed discovery for the complete truth about what exists.

## Automatic reject criteria (9)

A proposed change MUST be rejected if it:

1. **Makes "no results" share the same surface as "crawl failed"** — collapses genuine emptiness with error conditions into the same empty response
2. **Makes skipped or filtered content silently absent** — excludes repos by filter (archived, language, forks) without any indication that filtering occurred
3. **Makes auth failure or rate limit look like clean emptiness** — returns empty data or null when the actual cause was 403 or 429, without distinguishing these from genuinely absent data
4. **Makes stale crawl output read as current discovery** — serves cached data with current-time timestamps, hiding that the data may be minutes old
5. **Makes partial traversal read as full traversal** — reports `totalReposFound` or `totalCrawled` without indicating whether the limit was reached, repos failed, or rate limits truncated results
6. **Collapses distinct entities via dedupe without surfacing the collision** — merges repos, issues, or results that share similar attributes without the caller knowing
7. **Makes retry/resume change coverage without surfacing the boundary** — re-crawls or resumes without indicating what was already covered and what is newly discovered
8. **Makes counts/summary imply completeness when only a subset was visited** — reports "crawled N repos" without indicating N was limited by pagination, rate limits, or failures
9. **Makes human-facing reassurance stronger while leaving machine-facing semantics unchanged** — e.g., progress output says "crawl complete" while results show `totalCrawled < totalReposFound` (org-wide reassurance drift rule)

## The key question this workflow answers

**Can this system ever make unseen, skipped, stale, unreachable, filtered, or partially discovered state look like "the discovered reality"?**

### Currently: YES — blocking truth concerns exist

The proving packet found that:
- `totalReposFound` is the filtered+limited count, not the org total
- Failed repos in crawl_org are logged to stderr but absent from JSON results
- `crawledAt` is always current time, even for cached data
- Permission denial on Tier 1/2 data is indistinguishable from genuine absence

### After fixes, must say
- Whether results are truncated and why (limit, rate-limit, filter)
- Which repos failed and why (at minimum: name + error message)
- Whether data came from cache and how old the cache entry is
- Whether absence means "not found," "excluded," "denied," or "failed"

### Must never imply
- That `totalReposFound` is the org's actual repo count
- That all matching repos were crawled when some failed silently
- That `crawledAt: <now>` means the data was just fetched from GitHub
- That null/empty means "doesn't exist" when it might mean "permission denied"

## When to re-prove

Re-prove this workflow when:
- Pagination or limit logic changes
- Cache behavior or TTL changes
- Error handling in crawlOrg batch processing changes
- New data tiers are added
- Permission reporting expands to Tier 1/2
