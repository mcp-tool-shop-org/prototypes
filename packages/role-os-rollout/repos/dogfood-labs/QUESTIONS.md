# dogfood-labs — Questions

## Answered during lockdown

### Q1: Can an unverified, stale, policy-invalid, or weakly evidenced dogfood result look like a valid org-consumable record?

**Answer:** YES. Stub provenance is the production default. Every accepted record has `provenance_confirmed: true` without GitHub API verification. A crafted submission with a fake run URL passes through and gets indexed as `verified: pass`. This is the blocking defect (V1).

### Q2: Is stale detection automated?

**Answer:** No. Portfolio generation is manual-only. A repo can be stale for weeks with no alert. Thresholds exist in policy but detection requires someone to run `node tools/portfolio/generate.js`.

### Q3: Do rejected records affect consumers?

**Answer:** No — indexes only include accepted records. Rejected records are invisible to Gate F and repo-knowledge. This is acceptable design (rejected = not evidence), but the org has no easy way to see rejection patterns without checking git history.

### Q4: Does policy failure block ingestion?

**Answer:** No. Policy failure downgrades the verdict to `fail` but the record is still persisted. Gate F correctly rejects `verified: fail` records, so consumers are protected. But the record exists in git and could confuse manual auditors.
