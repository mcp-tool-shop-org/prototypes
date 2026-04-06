# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** ConsensusOS
**Date:** 2026-02-27
**Type tags:** [npm] [cli] [container]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 9/10 | Excellent SECURITY.md + threat model, missing README data scope |
| B. Error Handling | 9/10 | Fail-closed invariant engine, structured errors |
| C. Operator Docs | 9/10 | Extensive docs (10 documents), CHANGELOG, LICENSE |
| D. Shipping Hygiene | 9/10 | CI, npm publish, Docker, 295 tests |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, metadata |
| **Overall** | **46/50** | |

## Key Gaps

1. No SHIP_GATE.md or SCORECARD.md
2. No Security & Data Scope section in README

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Add Security & Data Scope in README | 3 min |
| 2 | Add SHIP_GATE.md + SCORECARD.md, bump to 1.0.5 | 5 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 9/10 | 10/10 |
| B. Error Handling | 9/10 | 10/10 |
| C. Operator Docs | 9/10 | 10/10 |
| D. Shipping Hygiene | 9/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | **46/50** | **50/50** |
