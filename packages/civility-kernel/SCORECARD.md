# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** civility-kernel
**Date:** 2026-02-27
**Type tags:** [npm]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 6/10 | No SECURITY.md, no threat model in README |
| B. Error Handling | 8/10 | Zod validation, structured lint errors |
| C. Operator Docs | 7/10 | Good README, no CHANGELOG |
| D. Shipping Hygiene | 5/10 | No verify script, no coverage, pre-1.0 |
| E. Identity (soft) | 10/10 | Logo, npm badge, GitHub metadata |
| **Overall** | **36/50** | |

## Key Gaps

1. No SECURITY.md — no vulnerability reporting process
2. No coverage setup, no verify script
3. Version at 0.2.1 — needs promotion to 1.0.0
4. No Security & Data Scope in README

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Create SECURITY.md + threat model in README | 5 min |
| 2 | Add coverage + verify script, bump to 1.0.0 | 5 min |
| 3 | Add CHANGELOG.md | 5 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 6/10 | 10/10 |
| B. Error Handling | 8/10 | 10/10 |
| C. Operator Docs | 7/10 | 10/10 |
| D. Shipping Hygiene | 5/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | **36/50** | **50/50** |
