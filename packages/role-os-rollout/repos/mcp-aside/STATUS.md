# mcp-aside — Lockdown Status

## Classification
Lock candidate → **locked**

## Phase
Lockdown complete (2026-03-24)

## Primary seam
Ephemeral lifecycle truth (identity, lifetime, resurrection)

## Seam family
Ephemeral state truth

## Proving packet
ASIDE-001 — PASS (clean, 5 pressure paths verified, 3 design caveats documented)

## Files placed
- `.claude/context/product-brief.md`
- `.claude/context/repo-map.md`
- `.claude/context/brand-rules.md`
- `.claude/context/current-priorities.md`
- `.claude/workflows/protect-ephemeral-truth.md`

## Design caveats (documented, not blocking)
- DC-1: Source/tags/meta excluded from dedupe identity (by design)
- DC-2: Expired vs absent indistinguishable on read (by design)
- DC-3: TOCTOU race latent under concurrent use (not exploitable in MCP stdio)
