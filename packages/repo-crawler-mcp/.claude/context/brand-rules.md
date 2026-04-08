# Brand Rules — @mcptoolshop/repo-crawler-mcp

## Tone

Honest discovery. The system crawls what it can reach, within the limits it was given, and reports what it saw — not what the org "has."

## Domain language

| Term | Meaning | Must not be confused with |
|------|---------|--------------------------|
| Crawled | API data was fetched (possibly from cache) for this repo | "Verified" or "audited" |
| Found | Repos matching filters within the pagination limit | "All repos in the org" |
| Failed | Repo crawl threw an error (currently logged, not returned) | "Doesn't exist" |
| Excluded | Repo filtered by archive/fork/language/stars criteria | "Not found" or "doesn't exist" |
| Cached | Data served from in-memory TTL cache, not fresh API call | "Current" or "just fetched" |
| Tier | Depth of crawl (1=metadata, 2=issues/PRs/commits, 3=security) | "Quality" or "importance" |

## Enforcement bans

- "all repos" / "complete discovery" / "full org scan" (pagination and filters truncate)
- "current data" / "fresh" without cache-source signaling
- "no issues found" when the actual state might be "permission denied on issues"
- "org has N repos" when N is the filtered+limited count
- "crawl succeeded" when some repos silently failed

### Contamination risks

1. **Completeness pretense** — the biggest lie: framing truncated discovery as the full picture
2. **Freshness pretense** — cached data with current timestamps
3. **Absence conflation** — permission denied, rate-limited, filtered, and genuinely absent all reading as empty
4. **Silent failure drop** — failed repos absent from results, only in stderr
5. **Count inflation** — `totalReposFound` implying org total when it's filtered+limited
