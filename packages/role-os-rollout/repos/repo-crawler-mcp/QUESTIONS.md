# repo-crawler-mcp — Questions

## Answered during lockdown

### Q1: Can this system make unseen, skipped, stale, unreachable, filtered, or partially discovered state look like "the discovered reality"?

**Answer:** Yes, structurally. The output lacks metadata to distinguish these states. `totalReposFound` is filtered+limited (not org total), failed repos are absent from JSON (logged to stderr only), cached data has current timestamps, and Tier 1/2 permission denial is indistinguishable from genuine absence. These are design omissions, not active claims of completeness.

### Q2: Does the system claim "complete scan"?

**Answer:** No — it never explicitly claims completeness. But the field name `totalReposFound` and the absence of truncation/failure metadata create an implied completeness that callers could reasonably infer.

### Q3: Why is Tier 3 honest about permissions but Tier 1/2 is not?

**Answer:** Tier 3 (security sections) was designed with a `handleSecurityPermission` function that maps 403→denied and 404→not_enabled. This pattern was not applied to Tier 1/2 data fetching (traffic, issues, PRs), where errors are caught and returned as null/empty.
