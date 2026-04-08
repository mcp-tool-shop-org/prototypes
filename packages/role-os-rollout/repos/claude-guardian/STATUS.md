# Claude Guardian — Rollout Status

**Classification:** full treatment candidate
**Current phase:** LOCKED
**Owner:** Claude (rollout session 2026-03-24)
**Locked date:** 2026-03-24

## Progress

| Step | Status | Notes |
|------|--------|-------|
| 1. Standard init | done | 52 files scaffolded (no double nesting, using fixed role-os v1.0.2) |
| 2. Context files filled | done | 4 files in .claude/context/ — human-approved |
| 3. Highest-risk seam identified | done | Health checks + budget-system truth (3 failure classes, machine/human output split) |
| 4. Repo-local workflow written | done | .claude/workflows/protect-health-budget-truth.md — 9 reject criteria |
| 5. Reject conditions defined | done | 9 criteria including reassurance drift (#9, added per human review) |
| 6. Proving packet passed | done | GUARDIAN-001 — 5 invariants, 3 violations, 3 forced questions, 4 known seams |
| 7. Lock | done | Human-approved 2026-03-24. No code bugs found. Clean lock. |

## Resolved items

- 4 known seams confirmed as intentional design tradeoffs (not defects)
- Reassurance drift added as reject criterion #9 (promoted to org-level decision)
