# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** tool-scan
**Date:** 2026-02-27
**Type tags:** [pypi] [cli]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 10/10 | SECURITY.md, no network, no telemetry, no code execution |
| B. Error Handling | 9/10 | Structured exit codes, actionable remarks — missing formal error shape |
| C. Operator Docs | 10/10 | README, CHANGELOG, CONTRIBUTING, CITATION, --help accurate |
| D. Shipping Hygiene | 8/10 | CI (ruff + mypy + pytest), 279 tests — missing verify script, dep-audit |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, 10 topics |
| **Overall** | **47/50** | |

## Key Gaps

1. No `verify` script (Makefile or equivalent)
2. No dependency audit job in CI (pip-audit)
3. SECURITY.md missing standard email (used GitHub Issues link)
4. SHIP_GATE.md and SCORECARD.md not present

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Add Makefile with verify target | 2 min |
| 2 | Add dep-audit job to CI + pip-audit dep | 3 min |
| 3 | Update SECURITY.md with email + data scope | 3 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 10/10 | 10/10 |
| B. Error Handling | 9/10 | 10/10 |
| C. Operator Docs | 10/10 | 10/10 |
| D. Shipping Hygiene | 8/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | 47/50 | 50/50 |
