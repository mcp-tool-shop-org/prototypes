# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** websketch-extension
**Date:** 2026-02-27
**Type tags:** [npm] (Chrome extension, private)

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 5/10 | No SECURITY.md, no threat model. Clean — no secrets, no telemetry. |
| B. Error Handling | 6/10 | Basic capture error handling in popup. No formal error shape. |
| C. Operator Docs | 7/10 | Good README, CHANGELOG, LICENSE. Missing threat model. |
| D. Shipping Hygiene | 7/10 | CI, validate script, tests. Missing SHIP_GATE/SCORECARD. |
| E. Identity (soft) | 8/10 | Logo, translations, landing page present. Logo uses .github/ path not brand URL. |
| **Overall** | **33/50** | |

## Key Gaps

1. No SECURITY.md — no vulnerability reporting process
2. No threat model in README — data scope and permissions not documented
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
| E. Identity (soft) | 8/10 | 10/10 |
| **Overall** | **33/50** | **50/50** |
