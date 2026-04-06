# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** websketch-mcp
**Date:** 2026-02-27
**Type tags:** [npm] [mcp] [cli]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 5/10 | No SECURITY.md, no threat model. Clean — no secrets, no telemetry. |
| B. Error Handling | 8/10 | WebSketchException, structured MCP results, websketch_validate never throws. |
| C. Operator Docs | 7/10 | Good README with tool docs. CHANGELOG exists. Missing threat model. |
| D. Shipping Hygiene | 8/10 | CI, prepublishOnly, engines.node, dependabot. Missing SHIP_GATE/SCORECARD. |
| E. Identity (soft) | 9/10 | Logo, translations, landing page, npm badge. |
| **Overall** | **37/50** | |

## Key Gaps

1. No SECURITY.md — no vulnerability reporting process
2. No threat model in README — data scope not documented
3. Missing SHIP_GATE.md and SCORECARD.md for audit trail

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Add SECURITY.md with report email and response timeline | 5 min |
| 2 | Add Security & Data Scope section to README | 5 min |
| 3 | Add SHIP_GATE.md + SCORECARD.md | 10 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 5/10 | 10/10 |
| B. Error Handling | 8/10 | 10/10 |
| C. Operator Docs | 7/10 | 10/10 |
| D. Shipping Hygiene | 8/10 | 10/10 |
| E. Identity (soft) | 9/10 | 10/10 |
| **Overall** | **37/50** | **50/50** |
