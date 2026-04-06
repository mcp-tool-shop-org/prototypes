# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** websketch-vscode
**Date:** 2026-02-27
**Type tags:** `[all]` `[vsix]`

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 3/10 | No SECURITY.md, no threat model in README |
| B. Error Handling | 7/10 | showErrorMessage with action buttons, but no formal error codes |
| C. Operator Docs | 7/10 | README excellent, no CHANGELOG, LICENSE present |
| D. Shipping Hygiene | 5/10 | CI has typecheck+build, no tests in CI, no verify script, no dep audit |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, marketplace listing |
| **Overall** | **32/50** | |

## Key Gaps

1. No SECURITY.md (Section A)
2. No CHANGELOG.md (Section C)
3. Tests exist (121) but not in CI (Section D)
4. No verify script, no Codecov, no dep audit (Section D)
5. Version at 0.2.4 — needs 1.0.0 bump

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 3/10 | 10/10 |
| B. Error Handling | 7/10 | 10/10 |
| C. Operator Docs | 7/10 | 10/10 |
| D. Shipping Hygiene | 5/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | 32/50 | **50/50** |
