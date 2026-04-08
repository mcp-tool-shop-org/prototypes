# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** @mcptoolshop/claude-sfx
**Date:** 2026-03-19
**Type tags:** [npm] [cli] [hooks]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 9/10 | SECURITY.md, threat model, no telemetry, no secrets. -1: npm audit non-blocking in CI |
| B. Error Handling | 10/10 | SfxError class, exit codes, hints, no raw stacks |
| C. Operator Docs | 9/10 | README, CHANGELOG, LICENSE, --help, 7 translations. -1: SCORECARD unfilled |
| D. Shipping Hygiene | 8/10 | verify script, lockfile, engines. -1: no coverage floor, -1: 5s timeout too generous |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, GitHub metadata |
| **Overall** | **46/50** | |

## Key Gaps

1. CI coverage runs but no minimum threshold — PR could drop to 0% and pass
2. Ambient drone has no max lifetime — orphaned loops run indefinitely
3. npm audit non-blocking (`|| true`) — known vulns don't fail CI
4. Hook/player timeout 5s too generous for 80-320ms sounds
5. SCORECARD.md was unfilled template

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Add vitest coverage thresholds (80% lines/functions/statements, 70% branches) | 5 min |
| 2 | Add 30-minute max lifetime to ambient drone loops | 10 min |
| 3 | Remove `|| true` from npm audit, reduce timeouts to 3s | 5 min |
| 4 | Clean up stale ambient PID/WAV on detection | 5 min |
| 5 | Fill SCORECARD.md | 5 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 9/10 | 10/10 |
| B. Error Handling | 10/10 | 10/10 |
| C. Operator Docs | 9/10 | 10/10 |
| D. Shipping Hygiene | 8/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | **46/50** | **50/50** |
