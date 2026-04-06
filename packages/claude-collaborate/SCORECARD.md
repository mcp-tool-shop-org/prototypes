# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** claude-collaborate
**Date:** 2026-03-28
**Note:** Scores reflect post-v1.0.4 remediation.
**Type tags:** [all]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 5/10 | No SECURITY.md, no threat model in README |
| B. Error Handling | 7/10 | Server returns JSON errors, no formal error shape |
| C. Operator Docs | 8/10 | Good README, CHANGELOG present, LICENSE present |
| D. Shipping Hygiene | 6/10 | CI exists, no verify script, no dep scanning |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, badges |
| **Overall** | **36/50** | |

## Key Gaps

1. No SECURITY.md — no vulnerability reporting process
2. No verify script for local pre-push validation
3. No Security & Data Scope in README

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Create SECURITY.md + threat model in README | 5 min |
| 2 | Add verify script | 5 min |
| 3 | Add SHIP_GATE.md + SCORECARD.md | 5 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 5/10 | 10/10 |
| B. Error Handling | 7/10 | 8/10 |
| C. Operator Docs | 8/10 | 10/10 |
| D. Shipping Hygiene | 6/10 | 8/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | **36/50** | **46/50** |
