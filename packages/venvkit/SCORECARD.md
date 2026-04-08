# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** venvkit
**Date:** 2026-02-27
**Type tags:** `[all]` `[npm]` `[cli]`

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 4/10 | SECURITY.md template only, no threat model in README |
| B. Error Handling | 9/10 | 19 FindingCodes with severity levels and fix suggestions, structured reports |
| C. Operator Docs | 7/10 | README comprehensive, CHANGELOG empty, LICENSE present |
| D. Shipping Hygiene | 7/10 | CI has coverage + dep audit + windows matrix, but no verify script, no engines.node |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, npm badge all present |
| **Overall** | **37/50** | |

## Key Gaps

1. SECURITY.md template only — no real data scope (Section A)
2. README missing threat model paragraph (Section A)
3. CHANGELOG empty (Section C)
4. No `verify` script (Section D)
5. No `engines.node` in package.json (Section D)

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 4/10 | 10/10 |
| B. Error Handling | 9/10 | 10/10 |
| C. Operator Docs | 7/10 | 10/10 |
| D. Shipping Hygiene | 7/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | 37/50 | **50/50** |
