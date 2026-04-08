# repo-knowledge — Lockdown Status

## Classification
Lock candidate → **locked**

## Phase
Lockdown complete (2026-03-24)

## Primary seam
Catalog/schema mutation truth

## Seam family
Mutation truth (catalog variant)

## Proving packet
REPOKNOW-001 — PASS (rerun after 3 blocking fixes. 10/10 write paths now idempotent. 60/60 tests pass.)

## Fixes shipped (v1.0.4)
- TC-1: Migration-004 adds UNIQUE(audit_run_id, domain, title, severity) + dedup existing rows. INSERT → INSERT OR REPLACE.
- TC-2: getStats() uses explicit schema check with audit_schema_missing flag instead of silent try/catch.
- TC-3: rebuildIndex() called after both importAudit() and importAuditInline().

## Files placed
- `.claude/context/product-brief.md`
- `.claude/context/repo-map.md`
- `.claude/context/brand-rules.md`
- `.claude/context/current-priorities.md`
- `.claude/workflows/protect-catalog-truth.md`
