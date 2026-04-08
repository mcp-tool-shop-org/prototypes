# dogfood-labs — Lockdown Status

## Classification
Lock candidate → **locked**

## Phase
Lockdown complete (2026-03-24)

## Primary seam
Evidence/provenance truth

## Seam family
Evidence/provenance truth

## Proving packet
DOGFOOD-001 — PASS (rerun after V1 fix. All tests pass.)

## Fixes shipped
- V1: Stub provenance killed as default. ingest() requires explicit adapter. CLI requires --provenance flag. Stub hard-fails in CI. Production uses githubProvenance(token).
- Historical: 24 records marked with provenance_remediation.status='stub_verified'. Indexes rebuilt.
- Tests: 5 provenance guard tests (no adapter, null, invalid, explicit stub, rejecting)
- Workflow: ingest.yml updated with --provenance=github and GITHUB_TOKEN

## Follow-up packets
- DOGFOOD-002: Automated stale detection (scheduled workflow)
- DOGFOOD-003: Rejected record audit trail in indexes/portfolio
