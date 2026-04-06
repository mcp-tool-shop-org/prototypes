# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** zip-meta-map
**Date:** 2026-02-27
**Type tags:** [pypi] [cli]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 8/10 | SECURITY.md exists with detailed scope. No threat model in README. |
| B. Error Handling | 7/10 | CLI has exit codes, basic error handling. No formal structured error shape. |
| C. Operator Docs | 8/10 | Excellent README, CHANGELOG, SPEC.md, PROFILES.md. Missing threat model. |
| D. Shipping Hygiene | 7/10 | pytest, python_requires, hatchling, CI. Missing SHIP_GATE/SCORECARD. |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, PyPI badge. |
| **Overall** | **40/50** | |

## Key Gaps

1. No threat model in README — data scope not documented
2. Missing SHIP_GATE.md and SCORECARD.md for audit trail
3. Version still at 0.2.2 — needs v1.0.0 promotion

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Add Security & Data Scope section to README | 5 min |
| 2 | Add SHIP_GATE.md + SCORECARD.md | 10 min |
| 3 | Bump version to 1.0.0 | 2 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 8/10 | 10/10 |
| B. Error Handling | 7/10 | 10/10 |
| C. Operator Docs | 8/10 | 10/10 |
| D. Shipping Hygiene | 7/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | **40/50** | **50/50** |
