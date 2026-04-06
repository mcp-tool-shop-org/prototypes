# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** mcp-app-builder
**Date:** 2026-02-27
**Type tags:** `[all]` `[vsix]`

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 4/10 | No SECURITY.md, no threat model, no explicit telemetry statement |
| B. Error Handling | 6/10 | Errors shown via vscode.window.showErrorMessage but no structured shape |
| C. Operator Docs | 7/10 | README good, CHANGELOG exists (disordered), LICENSE present |
| D. Shipping Hygiene | 5/10 | CI exists, no verify script, no dep scanning, no coverage |
| E. Identity (soft) | 9/10 | Logo, translations, landing page, metadata all present |
| **Overall** | **31/50** | |

## Key Gaps

1. No SECURITY.md or threat model (Section A)
2. No structured error class — generic catch blocks without error codes (Section B)
3. CHANGELOG out of chronological order (Section C)
4. No verify script, no dep audit, no coverage in CI (Section D)

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | AppBuilderError class + wire into commands | 10 min |
| 2 | SECURITY.md + threat model + telemetry statement | 5 min |
| 3 | verify script + CI improvements (coverage, dep audit, vsce check) | 10 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 4/10 | 10/10 |
| B. Error Handling | 6/10 | 10/10 |
| C. Operator Docs | 7/10 | 10/10 |
| D. Shipping Hygiene | 5/10 | 10/10 |
| E. Identity (soft) | 9/10 | 10/10 |
| **Overall** | 31/50 | **50/50** |
