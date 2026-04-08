# Product Brief — @mcptoolshop/repo-crawler-mcp

## What this is

MCP server that crawls GitHub organizations and repos via the GitHub API. Provides tiered discovery (Tier 1: metadata, Tier 2: issues/PRs/commits, Tier 3: security/workflows) with filtering, pagination, caching, and concurrent crawl. Exposes tools for org crawl, single repo crawl, file content, commit diffs, workflow runs, and search.

## Type

MCP server (stdio transport, in-memory cache, GitHub API via Octokit)

## Core value

Structured, tiered discovery of GitHub org repos with machine-consumable JSON output. Each crawl result includes per-repo data organized by tier with section filtering.

## What it is not

- Not a real-time monitor — discovery is point-in-time, not streaming
- Not a complete org snapshot — pagination limits, filters, and rate limits can truncate results
- Not a permission-aware reporter (currently) — missing data from permission denial looks identical to genuinely absent data in most tiers
- Not a freshness-signaling system (currently) — cached data is returned with current timestamps

## Anti-thesis (7 statements)

1. Must never present truncated discovery as complete — if pagination, rate limits, or failures reduce coverage, the output must say so
2. Must never collapse "not found," "excluded," "failed," "rate-limited," and "permission denied" into the same empty surface
3. Must never return cached data with a current timestamp as if it were just fetched
4. Must never silently drop failed repos from crawl_org results — failures must be surfaced, not just logged to stderr
5. Must never report `totalReposFound` as the org's true repo count when it's actually the filtered+limited count
6. Must never let filter exclusions (archived, language, forks) be invisible — the caller must know what was excluded
7. Must never imply "crawled N repos" means "these are all the repos" when rate limits or failures reduced coverage

## Highest-risk seam

**Crawl/discovery truth** — the boundary where the system claims what was seen, missed, failed, excluded, and is current. The liar-paths are: pagination truncation reported as complete discovery, failed repos silently absent from results, cached data with fresh timestamps, and permission denial indistinguishable from genuine absence.
