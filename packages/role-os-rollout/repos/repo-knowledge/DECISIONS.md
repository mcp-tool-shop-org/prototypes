# repo-knowledge — Repo-Local Decisions

## 2026-03-24 — Audit posture reflects imports, not live truth

**Decision:** Audit posture is derived from imported evidence. It is not a live security assessment. Language must never frame posture as "current security state."

**Why:** Posture is only as fresh as the last import. Findings may be duplicated (TC-1). The system stores evidence, it does not perform audits.

**Applies to:** All posture queries, MCP tools, console output, docs.

---

## 2026-03-24 — Schema drift must fail hard, not degrade silently

**Decision:** If audit tables are missing, corrupted, or partially migrated, queries must fail with explicit errors — not return zeros or undefined. Silent degradation masks DB corruption.

**Why:** getStats() currently wraps audit table queries in try/catch. Migration 003 suppresses duplicate-column errors. Both mask schema state inconsistencies.

**Applies to:** getStats(), migration system, any query touching optional/evolved tables.
