# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** websketch-cli
**Date:** 2026-02-27
**Type tags:** [npm] [cli]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 6/10 | No SECURITY.md, no threat model in README. No secrets or telemetry — clean. |
| B. Error Handling | 9/10 | WebSketchException with WS_ codes, exit codes (0/1/2), no raw stacks. Solid. |
| C. Operator Docs | 9/10 | Excellent README, CHANGELOG, LICENSE, --help, HANDBOOK. |
| D. Shipping Hygiene | 8/10 | CI, verify script, npm tooling. Missing SHIP_GATE/SCORECARD. |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, metadata all present. |
| **Overall** | **42/50** | |

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
| A. Security | 6/10 | 10/10 |
| B. Error Handling | 9/10 | 10/10 |
| C. Operator Docs | 9/10 | 10/10 |
| D. Shipping Hygiene | 8/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | **42/50** | **50/50** |
