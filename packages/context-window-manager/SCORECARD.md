# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** context-window-manager
**Date:** 2026-02-27
**Type tags:** [pypi] [mcp] [container]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 4/10 | No SECURITY.md, no threat model in README |
| B. Error Handling | 8/10 | Structured errors with error taxonomy doc |
| C. Operator Docs | 8/10 | Extensive docs, CHANGELOG, LICENSE, 7 doc files |
| D. Shipping Hygiene | 7/10 | CI, pytest, pre-1.0 |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, metadata |
| **Overall** | **37/50** | |

## Key Gaps

1. No SECURITY.md — no vulnerability reporting process
2. Version at 0.6.4 — needs promotion to 1.0.0
3. No Security & Data Scope in README

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Create SECURITY.md + threat model in README | 5 min |
| 2 | Bump to 1.0.0, update classifier | 5 min |
| 3 | Add SHIP_GATE.md + SCORECARD.md | 5 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 4/10 | 10/10 |
| B. Error Handling | 8/10 | 10/10 |
| C. Operator Docs | 8/10 | 10/10 |
| D. Shipping Hygiene | 7/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | **37/50** | **50/50** |
