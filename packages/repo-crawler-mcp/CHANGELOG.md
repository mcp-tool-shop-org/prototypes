# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.3.2] - 2026-03-25

### Added
- `--version` / `-V` and `--help` / `-h` CLI flags
- CHANGELOG.md included in npm tarball
- Version alignment tests (3 new tests)

### Fixed
- SECURITY.md supported version widened from "1.0.x" to "1.x"
- SHA-pinned CI actions (checkout, setup-node)

## [1.3.1] - 2026-03-19

### Fixed
- Discovery truth defects + Role OS lockdown

## [1.3.0] - 2026-03-19

### Added
- **In-memory response cache** — TTL-based caching with per-data-type expiry (2–10 min), saves API quota on repeated calls
- **`clear_cache` tool** — Clear cache and view hit/miss statistics
- **Pagination** — `page` param added to `search_repos`, `crawl_org`, and `get_workflow_runs`; responses include `totalCount`, `page`, `perPage`, `hasMore`
- 13 new tests (137 total across 13 test files)

## [1.2.0] - 2026-03-19

### Added
- **`get_commit_diff` tool** — Get diff/patch for any commit with per-file additions, deletions, status, and optional patch text
- **`get_workflow_runs` tool** — Get recent CI/CD run results with status, conclusion, duration, branch, and event trigger
- 18 new tests (124 total across 12 test files)

## [1.1.0] - 2026-03-19

### Added
- **`search_repos` tool** — Search GitHub repositories by query, language, stars, topic with full GitHub search syntax
- **`get_file_content` tool** — Fetch and decode any file from a repository by path, with optional branch/tag/SHA ref
- **Concurrent org crawling** — New `concurrency` param (default 3, max 10) for `crawl_org` processes repos in parallel batches
- 27 new tests (106 total across 10 test files) covering search, file content, org crawling, compare, and export schemas

### Fixed
- Server version now reads from package.json instead of hardcoded `0.1.0`
- Eliminated redundant `repos.get()` call in file tree fetching (saves 1 API call per crawl)
- Tier 3 security fetches now run in parallel via `Promise.allSettled` (was sequential)
- `settled()` helper now logs rejected promises with section labels instead of silently swallowing
- `export_data` input validates `CrawlResult` shape instead of accepting `z.any()`

## [1.0.0] - 2026-02-27

### Changed
- Promoted to v1.0.0 — production-stable release
- Shipcheck audit pass: SECURITY.md, threat model, structured errors, operator docs

## [0.1.1] - 2026-02-22

### Added
- Initial public release
- 5 MCP tools: crawl_repo, crawl_org, get_repo_summary, compare_repos, export_data
- 3-tier data model with section-selective fetching
- Graceful degradation and permission tracking
- CSV/Markdown export with injection prevention
- Landing page and translations
