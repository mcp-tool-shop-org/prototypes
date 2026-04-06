# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** mcp-aside
**Date:** 2026-02-27
**Type tags:** [npm] [mcp]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 5/10 | No SECURITY.md, no formal threat model |
| B. Error Handling | 8/10 | MCP tools with structured results, guardrails |
| C. Operator Docs | 7/10 | Good README with tool docs, no CHANGELOG, no SHIP_GATE |
| D. Shipping Hygiene | 5/10 | Version at 0.2.1, no CHANGELOG, no SHIP_GATE |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, metadata all present |
| **Overall** | **35/50** | |

## Key Gaps

1. No SECURITY.md with formal scope documentation
2. No CHANGELOG.md
3. Version at 0.2.1 — needs promotion to 1.0.0
4. No SHIP_GATE.md or SCORECARD.md

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Add SECURITY.md with data scope | 5 min |
| 2 | Add CHANGELOG.md, fill SHIP_GATE.md + SCORECARD.md | 10 min |
| 3 | Bump version to 1.0.0, update README | 5 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 5/10 | 10/10 |
| B. Error Handling | 8/10 | 10/10 |
| C. Operator Docs | 7/10 | 10/10 |
| D. Shipping Hygiene | 5/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | 35/50 | 50/50 |
