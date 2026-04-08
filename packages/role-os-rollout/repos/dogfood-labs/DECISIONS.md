# dogfood-labs — Repo-Local Decisions

## 2026-03-24 — Stub provenance must never be the production default

**Decision:** The ingestion pipeline must require an explicit provenance adapter. Stub provenance is for tests only. Production must use `githubProvenance(token)` or throw.

**Why:** `run.js:44` defaults to `stubProvenance` which always returns `confirmed: true`. Every production-ingested record has unchecked provenance. This is the foundational trust defect of the evidence layer.

**Applies to:** tools/ingest/run.js, ingest.yml, and any future ingestion entrypoint.

---

## 2026-03-24 — "Verified" means the verifier ran, not that evidence is trustworthy

**Decision:** The word "verified" in this repo means "the verifier processed the record and computed a verdict." It does NOT mean the evidence is trustworthy, comprehensive, or current. Language and docs must not conflate these.

**Why:** The verifier checks schema, provenance (when real), policy, and step consistency. A `verified: pass` record still depends on: provenance being real (not stubbed), freshness being within thresholds, and the source submission being honest.

**Applies to:** All documentation, index fields, consumer-facing descriptions.
