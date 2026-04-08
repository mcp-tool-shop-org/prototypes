# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** polyglot-vscode
**Date:** 2026-02-27
**Type tags:** `[all]` `[vsix]`

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 8/10 | SECURITY.md exists, no telemetry, but README missing formal threat model |
| B. Error Handling | 7/10 | friendlyError with action buttons, but no structured error codes |
| C. Operator Docs | 9/10 | README comprehensive, CHANGELOG present, walkthrough included |
| D. Shipping Hygiene | 7/10 | CI + tests + Codecov, but no verify script, no dep audit |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, marketplace listing |
| **Overall** | **41/50** | |

## Key Gaps

1. No structured error shape with typed codes (Section B)
2. README missing formal threat model paragraph (Section A)
3. No verify script (Section D)
4. No dependency audit in CI (Section D)
5. Version still at 0.1.3 — needs 1.0.0 bump

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 8/10 | 10/10 |
| B. Error Handling | 7/10 | 10/10 |
| C. Operator Docs | 9/10 | 10/10 |
| D. Shipping Hygiene | 7/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | 41/50 | **50/50** |
