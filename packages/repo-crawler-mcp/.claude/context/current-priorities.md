# Current Priorities — @mcptoolshop/repo-crawler-mcp

## Status

Locked (Role OS lockdown 2026-03-24). Primary seam: crawl/discovery truth.

## Classification

Lock candidate → locked.

## Seam family

Discovery truth — same family as any system where what was "found" must be distinguished from what exists, what was excluded, and what failed.

## Must-preserve invariants (7)

1. **Tiered discovery** — Tier 1 (metadata), Tier 2 (issues/PRs/commits), Tier 3 (security/workflows). Tier selection controls depth, not coverage.
2. **Pagination via page/repo_limit** — client controls how many repos per request. `hasMore` signals whether more pages exist within the filtered set.
3. **Filter parameters** — `include_forks`, `include_archived`, `min_stars`, `language` control which repos match. Filters reduce the result set.
4. **Concurrent crawl with batch processing** — `crawl_org` uses `Promise.allSettled` so individual repo failures don't abort the batch.
5. **Structured error codes** — top-level failures (ORG_NOT_FOUND, PERMISSION_DENIED, RATE_LIMITED) have explicit error codes.
6. **Tier 3 permission metadata** — security sections report `permissions` distinguishing `denied`, `not_enabled`, and available.
7. **In-memory cache** — TTL-based (5min metadata, 2min commits). Cache is per-session, not persisted.

## Banned detours

- Removing per-repo results from crawl_org output (aggregate-only would hide failure)
- Making cache persistent (session-scoped is a feature, not a limitation)
- Auto-retrying failed repos in crawl_org without surfacing the retry
- Removing Tier 3 permission metadata (the only section with honest absence reporting)
