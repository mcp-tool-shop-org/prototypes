# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** Registrum
**Date:** 2026-02-27
**Type tags:** [npm]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 7/10 | Template SECURITY.md — no real scope content. No threat model in README. |
| B. Error Handling | 8/10 | Fail-closed design with structured violations. No formal audit. |
| C. Operator Docs | 9/10 | Excellent README, governance docs, invariant specs, tutorials. Missing CHANGELOG. |
| D. Shipping Hygiene | 7/10 | vitest, CI, npm published. Missing SHIP_GATE/SCORECARD, still at v0.1.0. |
| E. Identity (soft) | 9/10 | Logo, 5 translations, landing page. |
| **Overall** | **40/50** | |

## Key Gaps

1. Template SECURITY.md with no real scope content
2. Missing SHIP_GATE.md and SCORECARD.md for audit trail
3. Still at v0.1.0 — needs promotion to v1.0.0
4. Missing CHANGELOG.md with real content

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Write real SECURITY.md with scope details | 3 min |
| 2 | Add SHIP_GATE.md + SCORECARD.md | 5 min |
| 3 | Promote to v1.0.0 + add CHANGELOG | 3 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 7/10 | 10/10 |
| B. Error Handling | 8/10 | 10/10 |
| C. Operator Docs | 9/10 | 10/10 |
| D. Shipping Hygiene | 7/10 | 10/10 |
| E. Identity (soft) | 9/10 | 10/10 |
| **Overall** | **40/50** | **50/50** |
