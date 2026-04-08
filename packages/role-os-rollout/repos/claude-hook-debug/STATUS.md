# claude-hook-debug — Lockdown Status

## Classification
Lock candidate → **locked**

## Phase
Lockdown complete (2026-03-24)

## Primary seam
Observability/trace truth

## Seam family
Observability/trace truth

## Proving packet
HOOKDEBUG-001 — PASS (clean. Architecture matches claims. Tool is honestly scoped.)

## Files placed
- `.claude/context/product-brief.md`
- `.claude/context/repo-map.md`
- `.claude/context/brand-rules.md`
- `.claude/context/current-priorities.md`
- `.claude/workflows/protect-trace-truth.md`

## Design caveats
- DC-1: PLUGIN_HOOKS_INVISIBLE doesn't fire in mixed scenarios (user hooks + plugin hooks)
- DC-2: No settings-modification-time comparison on reports
- DC-3: Permission-denied may read as file-missing
