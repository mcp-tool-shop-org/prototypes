# Brand Rules — dogfood-labs

## Tone

Evidence store with verification obligations. The system stores dogfood evidence and computes verdicts. It must be honest about what was actually verified, what was assumed, and what was skipped.

## Domain language

| Term | Meaning | Must not be confused with |
|------|---------|--------------------------|
| Verified | The verifier ran and produced a verdict (may be pass or fail) | "Trustworthy" or "proven" |
| Provenance confirmed | GitHub API confirmed the claimed run actually exists | "Content was validated" (provenance = source exists, not content is correct) |
| Policy valid | Record meets all repo-level policy requirements | "Correct" or "complete" (policy valid = rules passed, not evidence is strong) |
| Accepted | Record passed verification and is persisted to records/ | "Endorsed" or "guaranteed" |
| Rejected | Record failed verification and is persisted to records/_rejected/ | "Deleted" or "never existed" |
| Stale | Record's finished_at is older than max_age_days | "Invalid" (stale = old, may still be truthful) |
| Index | Computed view of latest accepted records per repo+surface | "Complete evidence" (index omits rejected, only shows latest) |

## Enforcement bans

- "all records verified" when provenance is stubbed in production
- "comprehensive coverage" when indexes only show accepted records
- "current evidence" when stale detection is manual-only
- "policy-enforced" when policy failure doesn't block persistence

### Contamination risks

1. **Provenance theater** — the biggest lie: "provenance_confirmed: true" when stub provenance always returns true
2. **Freshness pretense** — stale records with pass verdicts presented without age context
3. **Enforcement pretense** — policy evaluation runs but doesn't block ingestion
4. **Rejection invisibility** — rejected records hidden from all consumer-facing indexes
5. **Verification conflation** — "verified" conflated with "trustworthy" when verification only means "the verifier ran"
