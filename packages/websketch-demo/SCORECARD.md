# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** websketch-demo
**Date:** 2026-02-27
**Type tags:** [npm]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 5/10 | No SECURITY.md, no threat model. Clean otherwise — no secrets or telemetry. |
| B. Error Handling | 6/10 | Basic JSON validation errors in UI. No formal error shape documented. |
| C. Operator Docs | 7/10 | Good README, CHANGELOG, LICENSE. Missing threat model. |
| D. Shipping Hygiene | 7/10 | CI, tests, build scripts. Missing SHIP_GATE/SCORECARD. |
| E. Identity (soft) | 10/10 | Logo, translations, landing page all present. |
| **Overall** | **35/50** | |

## Key Gaps

1. No SECURITY.md — no vulnerability reporting process
2. No threat model in README — data scope not documented
3. Missing SHIP_GATE.md and SCORECARD.md for audit trail

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Add SECURITY.md with report email and response timeline | 5 min |
| 2 | Add Security & Data Scope section to README | 5 min |
| 3 | Add SHIP_GATE.md + SCORECARD.md | 10 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 5/10 | 10/10 |
| B. Error Handling | 6/10 | 10/10 |
| C. Operator Docs | 7/10 | 10/10 |
| D. Shipping Hygiene | 7/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | **35/50** | **50/50** |
