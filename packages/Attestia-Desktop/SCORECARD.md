# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** Attestia-Desktop
**Date:** 2026-02-27
**Type tags:** [desktop] [container]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 4/10 | No SECURITY.md, no threat model in README, template only |
| B. Error Handling | 8/10 | AttestiaException with typed errors, MVVM error handling |
| C. Operator Docs | 8/10 | Comprehensive README, CHANGELOG, LICENSE present |
| D. Shipping Hygiene | 5/10 | Version mismatch (0.1.0-alpha vs 1.0.0), no verify script |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, metadata all present |
| **Overall** | **35/50** | |

## Key Gaps

1. No SECURITY.md — template only, no vulnerability reporting process
2. No Security & Data Scope in README
3. Version mismatch — Directory.Build.props at 0.1.0-alpha, CHANGELOG at 1.0.0
4. No SHIP_GATE.md or SCORECARD.md

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Fill SECURITY.md + add threat model to README | 5 min |
| 2 | Bump version to 1.0.0 in Directory.Build.props | 2 min |
| 3 | Add SHIP_GATE.md + SCORECARD.md | 5 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 4/10 | 10/10 |
| B. Error Handling | 8/10 | 10/10 |
| C. Operator Docs | 8/10 | 10/10 |
| D. Shipping Hygiene | 5/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | **35/50** | **50/50** |
