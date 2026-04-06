# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** jam-session-plugin
**Date:** 2026-02-27
**Type tags:** [plugin]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 5/10 | No SECURITY.md, no threat model in README |
| B. Error Handling | 7/10 | Delegates to underlying MCP server |
| C. Operator Docs | 7/10 | README good, no CHANGELOG or SHIP_GATE |
| D. Shipping Hygiene | 5/10 | No version tracking, no CHANGELOG |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, metadata all present |
| **Overall** | **34/50** | |

## Key Gaps

1. No SECURITY.md or threat model documentation
2. No CHANGELOG.md tracking releases
3. No SHIP_GATE.md for compliance tracking

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Add SECURITY.md with scope documentation | 5 min |
| 2 | Add CHANGELOG.md with 1.0.0 entry | 5 min |
| 3 | Fill SHIP_GATE.md and SCORECARD.md | 10 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 5/10 | 10/10 |
| B. Error Handling | 7/10 | 10/10 |
| C. Operator Docs | 7/10 | 10/10 |
| D. Shipping Hygiene | 5/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | 34/50 | 50/50 |
