# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** brain-dev
**Date:** 2026-02-27
**Type tags:** [pypi] [mcp]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 9/10 | Good SECURITY.md but missing standard email, no inline data scope in README |
| B. Error Handling | 10/10 | Structured JSON responses, stateless, graceful error handling |
| C. Operator Docs | 9/10 | Good README but no verify script, missing Codecov badge |
| D. Shipping Hygiene | 7/10 | CI has coverage but no Makefile, no dep-audit, no lint/typecheck in CI |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, GitHub metadata |
| **Overall** | **45/50** | |

## Key Gaps

1. No Makefile with verify target
2. No dep-audit job in CI
3. SECURITY.md missing standard email
4. README missing inline Security & Data Scope, Codecov badge
5. No ruff/mypy/pip-audit in dev deps

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Fix SECURITY.md email, add data scope to README | 3 min |
| 2 | Create Makefile, add dev deps | 3 min |
| 3 | Add dep-audit to CI, Codecov badge | 2 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 9/10 | 10/10 |
| B. Error Handling | 10/10 | 10/10 |
| C. Operator Docs | 9/10 | 10/10 |
| D. Shipping Hygiene | 7/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | 45/50 | 50/50 |
