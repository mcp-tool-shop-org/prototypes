# registry-sync — Repo-Local Decisions

## 2026-03-24 — Issue creation is not drift resolution

**Decision:** Creating a GitHub issue is a request for human action, not a fix. Language and output must never frame issue creation as "synced," "fixed," or "resolved."

**Why:** The system creates issues to surface drift. The human reads the issue, decides what to do, and takes action. Until the human acts, drift is unchanged.

**Applies to:** All output messaging, console summary, docs.

---

## 2026-03-24 — Apply is not idempotent (and must not claim to be)

**Decision:** Running apply() twice with the same plan creates duplicate GitHub issues. The system must not claim idempotency. If idempotency checks are added later, they must be explicit and tested.

**Why:** Issue creation always POSTs new. No dedup check exists. Claiming idempotency would be a lie.

**Applies to:** Docs, CLI help text, any messaging about re-running apply.

---

## 2026-03-24 — Multi-step mutations are not atomic

**Decision:** `createWorkflowPR()` performs 3 sequential GitHub API calls (branch, file, PR) with no rollback. If a middle step fails, earlier mutations remain on the remote. This must be documented, not hidden.

**Why:** Rollback introduces its own failure modes. The current approach is honest about failure but doesn't surface which sub-steps completed. Follow-up packet REGSYNC-002 will improve this.

**Applies to:** apply.ts createWorkflowPR, output formatting, docs.
