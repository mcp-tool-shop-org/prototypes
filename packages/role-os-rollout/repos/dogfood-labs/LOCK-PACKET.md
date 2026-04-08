# DOGFOOD-001 — Evidence/Provenance Truth Lock

**Repo:** dogfood-labs
**Seam:** Evidence/provenance truth
**Date:** 2026-03-24
**Status:** PASS (rerun after V1 fix — stub default killed, production uses githubProvenance(token), 24 records remediated with stub_verified marker, 5 provenance guard tests added, ingest.yml updated with --provenance=github. All tests pass.)

## Three-law verification

### Provenance law

- **Stub default:** `tools/ingest/run.js:44` — `provenance = stubProvenance` (always returns `confirmed: true`)
- **Real adapter exists:** `tools/verify/validators/provenance.js` — `githubProvenance(token)` queries GitHub API
- **Production usage:** `ingest.yml:48` — `echo "$SUBMISSION_PAYLOAD" | node tools/ingest/run.js` — no provenance flag, no token passed for provenance
- **Result:** Every production-ingested record has `provenance_confirmed: true` without GitHub API verification

**Verdict:** BLOCKING. The system mints "verified" records with unchecked provenance. This is the foundational trust defect.

### Freshness law

- **Thresholds defined:** `policies/global-policy.yaml` — critical: 60d, warning: 30d, healthy: 14d
- **Detection:** `tools/portfolio/generate.js` computes freshness from `finished_at`
- **Automation:** None. Portfolio generation is manual-only. No scheduled workflow.
- **Index staleness:** `indexes/latest-by-repo.json` only updates on new ingestion, not on schedule.

**Verdict:** TRUTH CONCERN. Freshness thresholds exist but detection is unmonitored.

### Policy law

- **Evaluation runs:** `tools/verify/validators/policy.js` checks all global rules + repo-level requirements
- **Failure handling:** If `policy_valid: false`, verdict downgraded to `fail`, record persisted to `records/` or `records/_rejected/`
- **Enforcement:** Policy failure does NOT block persistence. Record enters git regardless.

**Verdict:** TRUTH CONCERN. Policy is evaluated but not enforced as a hard gate.

## Five pressure paths

### PP-1: Provenance gap — fake GitHub run URL accepted

- **Attack:** Craft submission with `run_url: "https://github.com/org/repo/actions/runs/99999"` (nonexistent)
- **Result:** Stub provenance returns `confirmed: true`. Record accepted with `provenance_confirmed: true`.
- **Consumer sees:** `verified: pass` in index. Gate F passes.

**Verdict:** BLOCKING. The liar-path is fully open.

### PP-2: Stale evidence — old record looks current

- **Scenario:** Record ingested March 1. No new runs. March 31 arrives.
- **Index:** Still shows `verified: pass` with `finished_at: 2026-03-01`.
- **Portfolio:** Only detects staleness if manually regenerated.
- **Gate F:** Reads `finished_at` and computes freshness. **Does detect staleness** if it checks age. But the index itself carries no staleness flag.

**Verdict:** TRUTH CONCERN. Gate F can detect age, but no proactive alerting exists.

### PP-3: Policy-invalid record consumed

- **Scenario:** Record fails policy (e.g., missing required scenario). Verdict downgraded to `fail`. Record persisted.
- **Index:** `rebuild-indexes.js` includes this record if it's in `records/` (not `_rejected/`). It will show `verified: fail` in the index.
- **Gate F:** Rejects `verified: fail` records. **Works correctly.**

**Verdict:** Acceptable. Policy failure produces `verified: fail` which consumers correctly reject. The concern is that the record exists at all — but this is audit trail, not consumer deception.

### PP-4: Rejected record invisible

- **Scenario:** Record fails schema or provenance. Written to `records/_rejected/`.
- **Index:** Rebuild excludes `_rejected/`. Consumer sees no record for this repo+surface.
- **Consumer interprets:** "No dogfood evidence" — which is correct (rejected evidence is not evidence).

**Verdict:** Acceptable design. Rejected = not consumable. But the org has no easy way to see "3 records were rejected for repo X" without checking git history.

### PP-5: Surface truth — does the consumer know what was actually verified?

- **Gate F reads:** `{ run_id, verified, verification_status, finished_at, path }` from index
- **Missing:** Whether provenance was real or stubbed. Whether policy was evaluated. What was rejected.
- **Consumer assumes:** If `verified: pass` and `verification_status: accepted`, provenance was confirmed and policy passed.

**Verdict:** TRUTH CONCERN. The index surface implies full verification when provenance was actually stubbed.

## Blocking fix required

### V1: Enable real provenance in production

**Required changes:**
1. `tools/ingest/run.js` — change default from `stubProvenance` to requiring explicit provenance adapter
2. `ingest.yml` — pass `GITHUB_TOKEN` to the ingest script and instantiate `githubProvenance(token)`
3. Add a `--provenance` CLI flag: `--provenance=github` (requires token) or `--provenance=stub` (explicitly opted-in, only for tests)
4. No submission should receive `provenance_confirmed: true` from stub provenance

**Minimum viable fix:** Make `ingest()` throw if no provenance adapter is explicitly provided. Tests pass `stubProvenance`. Production passes `githubProvenance(token)`.

## Truth concerns (not blocking, but important)

### TC-2: No automated stale detection

**Impact:** Records go stale without anyone noticing until manual portfolio generation.
**Fix:** Add a scheduled workflow (weekly) that regenerates portfolio and opens issues for stale repos.
**Promoted to:** DOGFOOD-002

### TC-3: Rejected record audit trail not surfaced

**Impact:** Org has no easy view of "which repos had rejected submissions."
**Fix:** Add a `rejected.json` index or include rejection counts in portfolio output.
**Promoted to:** DOGFOOD-003

## Summary

| Check | Result |
|-------|--------|
| Provenance law | **BLOCKING** — stub default in production |
| Freshness law | TRUTH CONCERN — manual detection only |
| Policy law | Acceptable — failure downgrades verdict, consumers reject fail |
| PP-1: Fake provenance | BLOCKING |
| PP-2: Stale evidence | TRUTH CONCERN |
| PP-3: Policy-invalid consumed | Acceptable |
| PP-4: Rejected invisible | Acceptable design |
| PP-5: Surface truth | TRUTH CONCERN |

**Overall: BLOCKED on V1.** The system mints "provenance_confirmed: true" records without checking GitHub API. Fix provenance, then rerun.
