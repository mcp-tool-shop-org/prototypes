# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** ledger-suite
**Date:** 2026-02-27
**Type tags:** [cli]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 5/10 | No SECURITY.md, no threat model, crypto product needs security docs |
| B. Error Handling | 8/10 | CLI with structured errors, 590 tests |
| C. Operator Docs | 6/10 | README adequate, no CHANGELOG, no SHIP_GATE |
| D. Shipping Hygiene | 6/10 | CI exists, version at 0.1.0, no CHANGELOG |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, metadata all present |
| **Overall** | **35/50** | |

## Key Gaps

1. No SECURITY.md — critical for a cryptography product
2. No CHANGELOG.md
3. Version still at 0.1.0 in Directory.Build.props
4. No threat model or crypto security documentation

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Add SECURITY.md with crypto-specific threat model | 10 min |
| 2 | Add CHANGELOG.md with 1.0.0 entry | 5 min |
| 3 | Bump version to 1.0.0, fill SHIP_GATE.md + SCORECARD.md | 10 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 5/10 | 10/10 |
| B. Error Handling | 8/10 | 10/10 |
| C. Operator Docs | 6/10 | 10/10 |
| D. Shipping Hygiene | 6/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | 35/50 | 50/50 |
