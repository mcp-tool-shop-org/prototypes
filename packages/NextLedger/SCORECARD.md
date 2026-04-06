# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** NextLedger
**Date:** 2026-02-27
**Type tags:** [desktop]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 8/10 | SECURITY.md exists. No threat model table in README. |
| B. Error Handling | 8/10 | ENGINE_ERROR_CODES.md exists, user-friendly UI errors. No formal audit. |
| C. Operator Docs | 8/10 | README current with install/usage/prerequisites. Missing SHIP_GATE/SCORECARD. |
| D. Shipping Hygiene | 8/10 | dotnet test, CI, ZIP releases. Missing formal audit trail. |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, metadata. |
| **Overall** | **42/50** | |

## Key Gaps

1. Missing SHIP_GATE.md and SCORECARD.md for audit trail
2. README missing formal Security & Data Scope table
3. SECURITY.md missing version table and scope details

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Add SHIP_GATE.md + SCORECARD.md | 5 min |
| 2 | Add Security & Data Scope table to README | 3 min |
| 3 | Patch bump to 1.0.3 | 1 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 8/10 | 10/10 |
| B. Error Handling | 8/10 | 10/10 |
| C. Operator Docs | 8/10 | 10/10 |
| D. Shipping Hygiene | 8/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | **42/50** | **50/50** |
