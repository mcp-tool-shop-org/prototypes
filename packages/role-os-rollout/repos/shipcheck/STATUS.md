# Shipcheck — Rollout Status

**Classification:** lock candidate → full treatment candidate
**Current phase:** LOCKED
**Owner:** Claude (rollout session 2026-03-24)
**Locked date:** 2026-03-24

## Progress

| Step | Status | Notes |
|------|--------|-------|
| 1. Standard init | done | `roleos init` run, 52 files scaffolded |
| 2. Context files filled | done | 4 files in .claude/context/ — human-approved |
| 3. Highest-risk seam identified | done | Exit-code contract (primary), audit gate parsing + template integrity (secondary) |
| 4. Repo-local workflow written | done | .claude/workflows/protect-audit-gates.md — 8 reject criteria |
| 5. Reject conditions defined | done | 8 reject criteria covering exit-code drift, skip drift, failure-classification drift |
| 6. Proving packet passed | done | SHIPCHECK-001 — 5 invariants traced, 3 violations proven rejectable |
| 7. Lock | done | Human-approved 2026-03-24 with 3 decisions locked + 1 rule added |

## Resolved questions

All 3 open questions resolved. See QUESTIONS.md and LOCK-PACKET.md.

## Pending code changes (decisions locked, implementation follows)

1. Tighten SKIP: detection to use explicit canonical markers (Q2)
2. Formalize or remove exit code 3 in CI (Q3)
