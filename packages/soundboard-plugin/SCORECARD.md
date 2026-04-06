# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** soundboard-plugin
**Date:** 2026-02-27
**Type tags:** [all] [pypi] [container] [mcp]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 10/10 | Excellent SECURITY.md, full threat model, path sandboxing, redaction, WAV validation |
| B. Error Handling | 10/10 | Structured errors with trace IDs, graceful degradation, no stack traces to client |
| C. Operator Docs | 9/10 | README, CHANGELOG, LICENSE, HANDBOOK — missing CI badge accuracy |
| D. Shipping Hygiene | 5/10 | No CI workflow, no verify script, no coverage, missing pytest-cov/ruff in dev deps |
| E. Identity (soft) | 10/10 | Logo, translations (8 languages), landing page, repo metadata all present |
| **Overall** | **44/50** | |

## Key Gaps

1. No CI workflow (ci.yml) — tests never run automatically on push/PR
2. No Makefile with `verify` target
3. Missing pytest-cov and ruff in dev dependencies
4. CI badge pointed to docker.yml instead of ci.yml
5. No Codecov integration for coverage tracking

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Create CI workflow with lint, test, coverage, dep-audit | 5 min |
| 2 | Add Makefile, pytest-cov, ruff | 3 min |
| 3 | Update README badges, add scorecard + data scope | 5 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 10/10 | 10/10 |
| B. Error Handling | 10/10 | 10/10 |
| C. Operator Docs | 9/10 | 10/10 |
| D. Shipping Hygiene | 5/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | 44/50 | **50/50** |
