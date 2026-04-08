# Current Priorities — dogfood-labs

## Status

Locked (Role OS lockdown 2026-03-24). Primary seam: evidence/provenance truth.

## Classification

Lock candidate → locked.

## Seam family

Evidence/provenance truth — same family as any system where "verified" must actually mean verified, not "the verifier ran with assumptions."

## Must-preserve invariants (6)

1. **Schema validation on ingestion** — AJV validates submissions against dogfood-record-submission.schema.json before any processing.
2. **Verdict never upgrades** — verified verdict can equal or downgrade from proposed verdict, never upgrade.
3. **Accepted vs rejected separation** — accepted records go to `records/`, rejected to `records/_rejected/`. Structurally distinct paths.
4. **Index only includes accepted records** — `latest-by-repo.json` is built from accepted records only.
5. **Records are immutable once committed** — no update mechanism. New runs create new records.
6. **Duplicate detection** — isDuplicate() prevents re-ingestion of the same run_id.

## Banned detours

- Making stub provenance "good enough" for production
- Adding "auto-accept" for records from trusted repos (every record must pass the full pipeline)
- Removing rejected record persistence (the audit trail matters even though it's not indexed)
- Making policy enforcement advisory-only (it already is; the ban is against weakening further)
- Adding record mutation/update (records are append-only evidence)
