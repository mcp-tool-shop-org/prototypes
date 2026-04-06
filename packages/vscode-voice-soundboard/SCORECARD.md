# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** vscode-voice-soundboard
**Date:** 2026-02-27
**Type tags:** `[all]` `[vsix]` `[mcp]`

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 5/10 | SECURITY.md template only, shell exec fixed in v0.3.0, no threat model in README |
| B. Error Handling | 8/10 | VS Code notifications with action buttons, setup banner for config issues |
| C. Operator Docs | 8/10 | README good with commands table, CHANGELOG comprehensive |
| D. Shipping Hygiene | 6/10 | CI has lint+build+test+package, no verify script, no dep audit |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, GitHub metadata all present |
| **Overall** | **37/50** | |

## Key Gaps

1. SECURITY.md template only — no real data scope (Section A)
2. README missing threat model paragraph (Section A)
3. No `verify` script (Section D)
4. No dep audit in CI (Section D)
5. Version at 0.3.1 — needs 1.0.0 bump (Section D)

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 5/10 | 10/10 |
| B. Error Handling | 8/10 | 10/10 |
| C. Operator Docs | 8/10 | 10/10 |
| D. Shipping Hygiene | 6/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | 37/50 | **50/50** |
