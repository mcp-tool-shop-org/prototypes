---
title: Tools
description: All 10 MCP tools for crawling GitHub repositories.
sidebar:
  order: 2
---

## crawl_repo

The main tool. Crawl a single repository at any data tier.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `owner` | string | — | Repository owner |
| `repo` | string | — | Repository name |
| `tier` | `'1'`/`'2'`/`'3'` | `'1'` | Data tier |
| `sections` | string[] | all | Specific sections to include |
| `exclude_sections` | string[] | none | Sections to skip |
| `commit_limit` | number | 30 | Max commits |
| `issue_limit` | number | 100 | Max issues (Tier 2) |
| `alert_limit` | number | 100 | Max security alerts (Tier 3) |

## crawl_org

Crawl every repo in an organization with filters. Supports concurrent crawling for faster org-wide scans.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `org` | string | — | Organization name |
| `tier` | `'1'`/`'2'`/`'3'` | `'1'` | Data tier per repo |
| `min_stars` | number | 0 | Minimum star count |
| `language` | string | any | Filter by primary language |
| `include_forks` | boolean | false | Include forked repos |
| `repo_limit` | number | 30 | Max repos to crawl |
| `concurrency` | number | 3 | Repos to crawl in parallel (1–10) |
| `page` | number | 1 | Page number (1-based) |

## search_repos

Search GitHub repositories by query, language, stars, topic, or any combination. Great for discovery and research.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `query` | string | — | Search query (GitHub search syntax) |
| `language` | string | any | Filter by primary language |
| `topic` | string | any | Filter by topic |
| `min_stars` | number | — | Minimum star count |
| `max_stars` | number | — | Maximum star count |
| `sort` | `'stars'`/`'forks'`/`'updated'`/`'best-match'` | `'best-match'` | Sort order |
| `order` | `'asc'`/`'desc'` | `'desc'` | Sort direction |
| `limit` | number | 30 | Results per page (1–100) |
| `page` | number | 1 | Page number (1-based) |

## get_file_content

Fetch the content of a specific file from a repository. Returns decoded text, size, and URLs.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `owner` | string | — | Repository owner |
| `repo` | string | — | Repository name |
| `path` | string | — | File path (e.g. `src/index.ts`) |
| `ref` | string | default branch | Branch, tag, or commit SHA |

## get_commit_diff

Get the diff/patch for a specific commit. Returns changed files with additions, deletions, status, and patch content.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `owner` | string | — | Repository owner |
| `repo` | string | — | Repository name |
| `ref` | string | — | Commit SHA, branch, or tag |
| `include_patch` | boolean | true | Include diff text per file |

## get_workflow_runs

Get recent CI/CD workflow run results for a repository. Returns status, conclusion, duration, branch, and event trigger.

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `owner` | string | — | Repository owner |
| `repo` | string | — | Repository name |
| `limit` | number | 10 | Max runs per page (1–100) |
| `page` | number | 1 | Page number (1-based) |

## clear_cache

Clear the in-memory response cache and return cache statistics. Useful when you need fresh data after known repo changes.

_No parameters._

## get_repo_summary

Quick human-readable summary. Only 4 API calls — ideal for triage.

## compare_repos

Side-by-side comparison of 2-5 repos. Stars, languages, activity, community health, size.

## export_data

Export crawl results as JSON, CSV, or Markdown. CSV includes formula injection prevention.
