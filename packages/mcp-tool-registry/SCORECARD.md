# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** mcp-tool-registry
**Date:** 2026-02-27
**Type tags:** `[all]` `[npm]`

## Pre-Remediation Assessment

| Category            | Score     | Notes                                                                                              |
| ------------------- | --------- | -------------------------------------------------------------------------------------------------- |
| A. Security         | 5/10      | SECURITY.md existed but generic/template, no threat model in README                                |
| B. Error Handling   | 8/10      | Build scripts use process.exit with descriptive messages, AJV emits structured errors              |
| C. Operator Docs    | 9/10      | README excellent, CHANGELOG present, HANDBOOK.md exists                                            |
| D. Shipping Hygiene | 7/10      | CI comprehensive, verify-pack exists, but no combined verify script, no dep audit, no engines.node |
| E. Identity (soft)  | 10/10     | Logo, translations, landing page, GitHub metadata all present                                      |
| **Overall**         | **39/50** |                                                                                                    |

## Key Gaps

1. SECURITY.md was generic template — no real data scope (Section A)
2. README missing threat model paragraph (Section A)
3. No combined `verify` script (Section D)
4. No dep audit in CI (Section D)
5. No `engines.node` in package.json (Section D)

## Post-Remediation

| Category            | Before | After     |
| ------------------- | ------ | --------- |
| A. Security         | 5/10   | 10/10     |
| B. Error Handling   | 8/10   | 10/10     |
| C. Operator Docs    | 9/10   | 10/10     |
| D. Shipping Hygiene | 7/10   | 10/10     |
| E. Identity (soft)  | 10/10  | 10/10     |
| **Overall**         | 39/50  | **50/50** |
