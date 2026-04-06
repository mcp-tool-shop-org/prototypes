# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** linux-dev-typer
**Date:** 2026-02-27
**Type tags:** [desktop] [nuget]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 6/10 | No SECURITY.md, privacy mentioned in README but no formal scope |
| B. Error Handling | 9/10 | Desktop app with user-friendly error handling, 817 tests |
| C. Operator Docs | 8/10 | Excellent README, CHANGELOG exists, no SHIP_GATE |
| D. Shipping Hygiene | 8/10 | CI, NuGet, version tracking — no SHIP_GATE or SCORECARD |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, metadata all present |
| **Overall** | **41/50** | |

## Key Gaps

1. No SECURITY.md with formal scope documentation
2. No SHIP_GATE.md or SCORECARD.md
3. README missing Security & Data Scope section and scorecard table

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Add SECURITY.md with data scope | 5 min |
| 2 | Fill SHIP_GATE.md and SCORECARD.md | 10 min |
| 3 | Update README with Security section + scorecard | 5 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 6/10 | 10/10 |
| B. Error Handling | 9/10 | 10/10 |
| C. Operator Docs | 8/10 | 10/10 |
| D. Shipping Hygiene | 8/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | 41/50 | 50/50 |
