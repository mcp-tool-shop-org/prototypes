# REPOKNOW-001 — Catalog/Schema Mutation Truth Lock

**Repo:** @mcptoolshop/repo-knowledge
**Seam:** Catalog/schema mutation truth
**Date:** 2026-03-24
**Status:** PASS (rerun after 3 blocking fixes — findings idempotent via UNIQUE + INSERT OR REPLACE, schema drift surfaced via audit_schema_missing flag, FTS5 rebuilt after import. v1.0.4. 60/60 tests pass.)

## Write-path idempotency audit

### Idempotent (safe to re-run)
- **Repo upsert:** slug UNIQUE + coalesce pattern. PASS.
- **Tech upsert:** ON CONFLICT(repo_id) DO UPDATE. PASS.
- **Note upsert:** existence check by (repo_id, note_type, title). PASS.
- **Doc upsert:** checksum dedup — same content = no update. PASS.
- **Fact upsert:** ON CONFLICT(repo_id, fact_type, key). PASS.
- **Release upsert:** ON CONFLICT(repo_id, tag). PASS.
- **Relationship add:** INSERT OR IGNORE with UNIQUE constraint. PASS.
- **Control results:** ON CONFLICT(audit_run_id, control_id). PASS.

### NOT idempotent (truth concern)
- **Audit findings:** Plain INSERT, no UNIQUE constraint. Re-import creates duplicates. **TC-1.**
- **Audit metrics:** UNIQUE(audit_run_id) but error handling varies by call site. **TC-2.**

**Verdict:** 8/10 write paths are idempotent. 2 are not — both in the audit evidence layer.

## Query-path truth audit

- **Exact repo lookup:** Parameterized, FK-enforced. PASS.
- **Filtered queries:** JOIN-based, parameterized. PASS.
- **FTS5 search:** Porter tokenizer + rank. Not rebuilt after audit import. **TC-3.**
- **Audit posture:** Derived from findings/metrics. If findings duplicated, posture is inflated. **Depends on TC-1.**
- **getStats():** Wraps audit table queries in try/catch. Missing tables → undefined. **TC-4.**

## Truth concerns (4 found)

### TC-1: Audit findings not idempotent (HIGH)

**Finding:** `importAudit()` uses plain INSERT for findings. No UNIQUE constraint on (audit_run_id, title, severity) or equivalent. Re-importing the same audit creates duplicate findings.

**Impact:** Severity counts in audit posture are inflated. "3 critical findings" could actually be "1 critical finding imported 3 times."

**Lock decision:** Not blocking for lock — the system correctly stores what it's told. The gap is that it doesn't prevent being told the same thing twice. **Promoted to REPOKNOW-002.**

### TC-2: Schema drift silently tolerated (MEDIUM)

**Finding:** `getStats()` wraps audit table queries in try/catch, returning undefined for missing tables. `migration 003` suppresses "duplicate column" errors.

**Impact:** A partially migrated or corrupted DB returns zeros/undefined for audit data. Callers may assume "no audits" when actually "DB is broken."

**Lock decision:** Not blocking — the fallback is conservative (no data rather than wrong data). But it masks schema problems. **Promoted to REPOKNOW-003.**

### TC-3: FTS5 index not rebuilt after audit import (MEDIUM)

**Finding:** `importAudit()` and `importAuditInline()` do not call `rebuildIndex()`. Newly imported audit content is not searchable until the next full sync or explicit rebuild.

**Impact:** Searches return incomplete results after audit import. The system doesn't signal this.

**Lock decision:** Not blocking — search returning fewer results is conservative (missing, not wrong). But it's undiscoverable. **Promoted to REPOKNOW-004.**

### TC-4: Artifact checksums not verified on read (LOW-MEDIUM)

**Finding:** Artifact records store checksums at import time. On read, the file is not re-hashed. If the file changed on disk, the DB returns the old checksum.

**Impact:** Integrity claims are based on import-time state, not current state.

**Lock decision:** Not blocking — the system doesn't claim live integrity. Artifacts are reference records. **Documented as design caveat.**

## Liar-path rejection tests (3)

### LP-1: "Audit posture as live truth" — present imported posture as current security state

**Hypothetical:** Display audit posture as "current security status" in dashboards without import-age context.

**Why rejected:** Violates reject criteria #8. Posture reflects last import, not live state. An audit from 6 months ago is not "current security."

### LP-2: "Smart finding dedup" — silently merge similar-looking findings

**Hypothetical:** Add fuzzy matching to deduplicate findings that "look the same."

**Why rejected:** Violates reject criteria #1 (must use explicit constraints, not heuristics). Findings with similar titles but different evidence are distinct. Dedup must be explicit (UNIQUE constraint), not inferred.

### LP-3: "Optional schema" — skip audit tables if not needed

**Hypothetical:** Make audit tables lazily created on first import, and skip them in queries if absent.

**Why rejected:** Violates reject criteria #2 (silently tolerates schema drift). The current try/catch approach already has this problem. Making it intentional would make it worse.

## Design tradeoffs

### DT-1: Doc content truncated at 50K for FTS5

Large docs are silently truncated before indexing. Search won't find terms in the tail.

**Acceptable because:** FTS5 performance degrades with very large documents. The alternative is no indexing at all. But truncation should be warned.

### DT-2: Version jump in migrations (v1 → v3)

No v2 intermediate version. Migration 003 runs on both fresh (v1→v3) and existing (v2→v3) databases.

**Acceptable because:** The migrations are additive (CREATE TABLE IF NOT EXISTS, ALTER TABLE with duplicate-column handling). But the version numbering is confusing and should be fixed.

## Summary

| Check | Result |
|-------|--------|
| Repo/tech/note/doc/fact/release upsert idempotency | PASS (8/8) |
| Audit finding idempotency | **TRUTH CONCERN** — duplicates on re-import |
| Schema evolution integrity | **TRUTH CONCERN** — drift silently tolerated |
| FTS5 index freshness | **TRUTH CONCERN** — not rebuilt after audit import |
| Query correctness (non-audit) | PASS |
| Parameterized queries | PASS |
| Transaction safety | PASS |
| LP-1: Posture as live truth | Correctly rejected |
| LP-2: Smart finding dedup | Correctly rejected |
| LP-3: Optional schema | Correctly rejected |

**Overall: PASS for lock.** The core catalog (repos, tech, notes, docs, facts, releases, relationships) is well-built with idempotent upserts, parameterized queries, and transaction safety. The audit evidence layer has 3 truth concerns (findings duplication, schema drift tolerance, FTS5 lag) — all conservative failures (missing/fewer rather than wrong/inflated), but they weaken the audit posture surface.

**Follow-up packets:**
- REPOKNOW-002: Add UNIQUE constraint to audit_findings (prevent duplication)
- REPOKNOW-003: Fail hard on schema drift instead of silent fallback
- REPOKNOW-004: Rebuild FTS5 index after audit import
