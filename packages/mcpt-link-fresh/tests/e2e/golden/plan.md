# Drift Sync Plan

| Key | Value |
|-----|-------|
| Generated | 2026-01-15T00:00:00.000Z |
| Mode | github-only |
| Total drifts | 5 |

### Legend

| Badge | Meaning | Safety |
|-------|---------|--------|
| **[API]** | Updates via GitHub API (no PR needed) | Safe to auto-apply |
| **[PR]** | Opens a pull request for human review | Requires review |
| **[REL]** | Requires a versioned package release | Manual release needed |

## test-tool

- [ ] **[API]** `metadata.description` — Safe to auto-apply
  - Current: `An old description that needs updating`
  - Canonical: `A test tool for unit testing drift detection`
  - Endpoint: `PATCH /repos/{owner}/{repo}`
- [ ] **[API]** `metadata.homepage` — Safe to auto-apply
  - Current: `https://old-site.com/test-tool`
  - Canonical: `https://mcptoolshop.com/tools/test-tool/`
  - Endpoint: `PATCH /repos/{owner}/{repo}`
- [ ] **[API]** `metadata.topics` — Safe to auto-apply
  - Current: `javascript, testing`
  - Canonical: `mcp, mcp-server, beta, fast, semantic, local, only`
  - Endpoint: `PUT /repos/{owner}/{repo}/topics`
- [ ] **[API]** `release.releaseNotes` — Safe to auto-apply
  - Current: `(missing or stale links section)`
  - Canonical: `(managed links + proof section)`
  - Endpoint: `PATCH /repos/{owner}/{repo}/releases/{id}`
- [ ] **[PR]** `readme.readmeBlock` — Requires review
  - Current: `(missing or stale mcpt block)`
  - Canonical: `(managed links block)`
  - Endpoint: `PUT /repos/{owner}/{repo}/contents/README.md (via branch + PR)`

### Summary

- 4 safe to auto-apply (API)
- 1 require PR review
