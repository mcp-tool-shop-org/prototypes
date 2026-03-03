# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** nameops
**Date:** 2026-02-27
**Type tags:** `[npm]` `[cli]`

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 4/10 | No SECURITY.md; no threat model in README |
| B. Error Handling | 6/10 | Basic Node.js error handling |
| C. Operator Docs | 6/10 | README describes workflow; no CHANGELOG |
| D. Shipping Hygiene | 5/10 | npm test; engines.node set; v0.1.1 pre-1.0 |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, topics |
| **Overall** | **31/50** | |

## Key Gaps

1. No SECURITY.md with proper fields
2. No CHANGELOG.md
3. Version at 0.1.1 — needs promotion to 1.0.0
4. No Security & Data Scope section in README

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Create SECURITY.md | 2 min |
| 2 | Version bump 0.1.1 → 1.0.0 | 1 min |
| 3 | Create CHANGELOG.md + README updates | 3 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 4/10 | 10/10 |
| B. Error Handling | 6/10 | 10/10 |
| C. Operator Docs | 6/10 | 10/10 |
| D. Shipping Hygiene | 5/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | **31/50** | **50/50** |
