# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** claude-session-copilot
**Date:** 2026-02-27
**Type tags:** [npm] [mcp]

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 5/10 | No SECURITY.md, no threat model in README |
| B. Error Handling | 8/10 | MCP structured results, Zod validation |
| C. Operator Docs | 7/10 | Good README with tool docs, no CHANGELOG |
| D. Shipping Hygiene | 6/10 | CI exists, no verify script, pre-1.0 |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, npm badge |
| **Overall** | **36/50** | |

## Key Gaps

1. No SECURITY.md — no vulnerability reporting process
2. No CHANGELOG.md
3. Version at 0.1.1 — needs promotion to 1.0.0
4. No verify script, no Security & Data Scope in README

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Create SECURITY.md + threat model in README | 5 min |
| 2 | Add verify script, bump to 1.0.0 | 5 min |
| 3 | Add CHANGELOG.md + SHIP_GATE.md + SCORECARD.md | 5 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 5/10 | 10/10 |
| B. Error Handling | 8/10 | 10/10 |
| C. Operator Docs | 7/10 | 10/10 |
| D. Shipping Hygiene | 6/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | **36/50** | **50/50** |
