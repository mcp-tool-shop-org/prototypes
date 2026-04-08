# Shipcheck — Context Audit

Repo: @mcptoolshop/shipcheck
Date: 2026-03-24
Auditor: Claude (rollout session)

## Audit Summary

Shipcheck is a zero-dependency CLI that distributes product standards (SHIP_GATE.md, SECURITY.md, CHANGELOG.md, SCORECARD.md) and audits repos against those standards. It is the gatekeeper for every repo in the org — nothing ships without passing its hard gates A-D.

## Source Truth (from bin/shipcheck.mjs, 420 lines)

### Commands
- `init` (L96-154): Detect repo type, copy templates, inject tags + placeholders
- `audit` (L156-212): Parse SHIP_GATE.md, count checked/unchecked/skipped, exit 0 or 1
- `dogfood` (L307-364): Fetch enforcement policy + index from dogfood-labs, evaluate freshness
- `help` (L366-393): Usage text

### Error Contract
- Structured shape: `{code, message, hint}` (L25-34)
- Exit codes: 0=success, 1=user error, 2=runtime error
- Error codes namespaced: IO_, INPUT_, STATE_, DOGFOOD_
- JSON mode via SHIPCHECK_JSON env var

### Type Detection (L38-92)
Scans CWD for: package.json, pyproject.toml, .vscodeignore, tauri.conf.json, Dockerfile, .csproj
Produces tags: all, npm, mcp, cli, pypi, container, vsix, desktop

### Trust Model
- Reads: package.json, pyproject.toml, filesystem signals, SHIP_GATE.md (local only)
- Writes: SHIP_GATE.md, SECURITY.md, CHANGELOG.md, SCORECARD.md (CWD only)
- Network: dogfood command only (GitHub raw content, no auth)
- No secrets, no telemetry, no source code modification

## Highest-Risk Seam

**Audit gate semantics + exit-code contract.**

This is the seam where generic orchestration would cause the most damage:
1. If exit codes drift (e.g., exit 0 on failure), every downstream consumer silently passes broken repos
2. If gate parsing changes (e.g., accepting unchecked items), the quality standard collapses
3. If error codes lose specificity (e.g., generic "FAIL" instead of DOGFOOD_STALE), operators lose diagnostic power
4. If "truthful failure" softens (e.g., hiding gaps, converting hard fail to advisory), the entire org trust model breaks

## Known Weaknesses (from audit)

1. SKIP: detection is substring-based (L176) — brittle but functional
2. No timeout on dogfood fetch in production (only in tests)
3. Exit code 3 referenced in CI comments but never emitted by code
4. No path canonicalization on CWD writes (low risk for CLI tool)
5. Template placeholder injection assumes correct format (no fallback)

## Context Files Status

| File | Status | Notes |
|------|--------|-------|
| product-brief.md | drafted | Pending human review |
| repo-map.md | drafted | Pending human review |
| brand-rules.md | drafted | Pending human review |
| current-priorities.md | drafted | Pending human review |
