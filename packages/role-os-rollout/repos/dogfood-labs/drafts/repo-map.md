# Repo Map — dogfood-labs

## Stack

- Node.js tooling (verify, ingest, portfolio, report)
- Records stored in git (JSON, sharded by org/repo/date)
- Three index files (latest-by-repo, failing, stale)
- AJV JSON Schema validation
- GitHub Actions workflows (dogfood.yml, ingest.yml)

## Primary seam: Evidence/provenance truth

### Three laws this seam governs

**Provenance law:** `tools/ingest/run.js:44` defaults to `stubProvenance` (always approves). The `githubProvenance` adapter exists but is never used in production. `ingest.yml:48` pipes submission to `node tools/ingest/run.js` with no provenance flag. Records are minted as `provenance_confirmed: true` without actually checking GitHub API.

**Freshness law:** Staleness thresholds exist in policy (critical: 60d, warning: 30d, healthy: 14d). But detection is manual-only — `tools/portfolio/generate.js` must be run by hand. No scheduled workflow. A record can be stale for weeks with no one noticing.

**Policy law:** Policy evaluation runs during verification. If `policy_valid: false`, the verdict is downgraded to `fail`. But the record is still persisted (to `records/` or `records/_rejected/`). Policy failure does not block ingestion — it only changes the verdict field.

### Contract surfaces with truth concerns

| Surface | Location | Truth concern |
|---------|----------|---------------|
| Provenance check | run.js:44, provenance.js | **CRITICAL** — stub default, never real in production |
| Stale detection | portfolio/generate.js | **HIGH** — manual only, no automation |
| Policy enforcement | verify/validators/policy.js | **HIGH** — fails don't block persistence |
| Rejected record visibility | indexes/rebuild-indexes.js | **HIGH** — rejected records absent from indexes |
| Write-time validation | persist.js | **MEDIUM** — no schema check before writeRecord() |
| Index freshness | indexes/*.json | **MEDIUM** — only rebuilt on new ingestion, not on schedule |

### Liar-path surfaces

| Path | Risk | Surface lie |
|------|------|------------|
| Stub provenance in production | CRITICAL | "provenance_confirmed: true" when never checked |
| Stale records in index | HIGH | "verified: pass" with finished_at weeks ago, no staleness warning |
| Policy-invalid but persisted | HIGH | Record exists in git with "verified: fail" — looks like evidence of a run |
| Rejected records invisible | HIGH | Consumer sees 0 records for a repo when actually 3 were rejected |
| No write-time schema validation | MEDIUM | Malformed records committed to git |
