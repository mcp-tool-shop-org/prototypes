# Workflow: Protect Evidence Truth

**Repo:** dogfood-labs
**Seam:** Evidence/provenance truth — the boundary where the system claims a dogfood record is verified, current, and policy-valid.

## What this workflow protects

The contract that "verified" actually means the verifier checked provenance (not stubbed), that "current" means within freshness thresholds (not manually checked), and that "accepted" means policy-valid (not just schema-valid).

## Automatic reject criteria (9)

A proposed change MUST be rejected if it:

1. **Lets verified and unverified records share the same outward surface** — allows stub provenance in production, or mints "provenance_confirmed: true" without real GitHub API check
2. **Lets stale evidence read as current enough for enforcement** — serves records past max_age_days without staleness signaling, or disables stale detection
3. **Lets schema-valid records read as policy-valid when they are not** — removes the distinction between schema validation (structural) and policy evaluation (semantic)
4. **Collapses bot/human/mixed evidence into one trust surface** — removes execution_mode tracking or treats bot and human evidence as interchangeable
5. **Lets rejected or downgraded records be consumable like clean records** — indexes rejected records alongside accepted, or removes the `_rejected/` separation
6. **Makes provenance gaps disappear into "record exists"** — hides that provenance was stubbed, skipped, or failed by presenting the record as fully verified
7. **Removes stale detection automation** — disables or weakens any scheduled freshness checking (currently manual, should become automated)
8. **Removes write-time validation** — allows records to be persisted without schema check
9. **Makes human-facing reassurance stronger while leaving machine-facing semantics unchanged** — e.g., portfolio says "13/13 repos verified" when provenance was never actually checked (org-wide reassurance drift rule)

## The key question this workflow answers

**Can an unverified, stale, policy-invalid, or weakly evidenced dogfood result look like a valid org-consumable record?**

### Currently: YES — blocking truth concerns exist

- Provenance is stubbed in production (V1)
- Stale detection is manual-only (V3)
- Policy-invalid records are persisted (V6)
- Rejected records are invisible to consumers (V4)

### After fixes, must say
- Whether provenance was actually confirmed via GitHub API (not stubbed)
- When evidence was last checked for freshness (not "whenever someone manually ran portfolio")
- Whether a record passed both schema AND policy validation
- How many records were rejected and why (not just how many were accepted)

### Must never imply
- That "verified: pass" means provenance was confirmed (if stub was used)
- That the index represents complete evidence (it excludes rejected records)
- That freshness is monitored (if detection is manual-only)
- That policy enforcement blocks ingestion (it only downgrades verdicts)

## When to re-prove

Re-prove this workflow when:
- Provenance adapter selection changes
- Policy enforcement strength changes
- Index rebuild logic changes
- Stale detection automation is added or removed
- New consumer pathways are added (beyond shipcheck, repo-knowledge, portfolio)
