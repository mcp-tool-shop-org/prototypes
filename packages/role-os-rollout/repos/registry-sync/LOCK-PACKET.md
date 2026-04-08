# REGSYNC-001 — Write-Path Mutation Truth Lock

**Repo:** @mcptoolshop/registry-sync
**Seam:** Write-path mutation truth
**Date:** 2026-03-24
**Status:** PASS with truth concerns (4 liar-paths documented, 2 blocking for improvement but not for lock — see rationale)

## Invariants traced to source

### INV-1: Plan is read-only

- **plan():** `plan.ts` — takes `AuditResult`, returns `PlanResult` with `PlannedAction[]`. Pure function. No API calls, no side effects.
- **No mutation in plan:** Verified — plan.ts imports no fetch, no auth, no GitHub API modules.

**Verdict:** PASS. Clean separation. Plan never writes.

### INV-2: Per-action success/failure in apply results

- **Apply loop:** `apply.ts:39-52` — for each action, pushes `{ action, success: true, url }` or `{ action, success: false, error }`.
- **ApplyResult:** `types.ts` — includes `results: ApplyAction[]` with per-action detail AND `summary` with aggregate counts.

**Verdict:** PASS. Every action has its own result. No aggregate-only reporting.

### INV-3: Partial failure continues execution

- **Apply loop:** `apply.ts:43-51` — catch block pushes failure and increments `failed`, then loop continues.
- **Test:** `apply.test.ts` — explicitly tests "continues after failure."

**Verdict:** PASS. Failure on action N does not abort actions N+1 through end.

### INV-4: Structured error codes

- **SyncError:** `errors.ts` — `{ code, message, hint }` structure.
- **Error codes:** AUTH_MISSING, INPUT_MISSING, APPLY_FAILED, GITHUB_API, NPM_API, etc.
- **Exit code mapping:** `cli.ts:428-432` — AUTH/INPUT → exit 1, others → exit 2.

**Verdict:** PARTIAL. Codes exist but APPLY_FAILED is overloaded — auth failure during apply gets the same code as validation failure. See TC-4.

### INV-5: Token fail-fast

- **getGitHubToken():** `auth.ts` — checks env, falls back to `gh auth token`, throws AUTH_MISSING if neither.
- **Called at top of createIssue and createWorkflowPR:** Before any mutation attempt.

**Verdict:** PASS. Missing token is caught before mutations. But expired/invalid token is NOT caught until the first API call fails (see TC-4).

## Four truth concerns

### TC-1: Silent partial mutation in createWorkflowPR (HIGH)

**Finding:** `apply.ts:191-295` performs three sequential mutations: create branch (step 1), create file (step 2), create PR (step 3). If step 1 succeeds and step 2 fails, the orphaned branch exists on remote but the system only reports `{ success: false, error: "Failed to create workflow file" }`.

**Impact:** The caller knows something failed but not that remote state was partially mutated. An orphaned branch `registry-sync/add-publish-workflow` exists on the target repo. On re-run, step 1 returns 422 (tolerated), step 2 retries — but the caller never sees "branch was already created by previous failed attempt."

**Lock decision:** Not blocking for lock. The system correctly reports failure. The truth gap is in the granularity of the failure report (which step left state), not in the verdict itself. **Promoted to REGSYNC-002.**

### TC-2: Duplicate issue creation — no idempotency (HIGH)

**Finding:** `apply.ts:79-145` — `createIssue()` always POSTs a new issue. No check for "does an issue with this title already exist?" Running apply twice with the same plan creates duplicate issues.

**Impact:** If an operator re-runs apply after a partial failure (to complete the remaining actions), previously succeeded issue-creation actions will create duplicates.

**Lock decision:** Not blocking for lock. The system honestly reports each creation as "succeeded." The truth gap is that the system doesn't prevent or warn about duplicates, not that it hides them. **Promoted to REGSYNC-003.**

### TC-3: 422 retry assumption in createIssue (MEDIUM)

**Finding:** `apply.ts:112-134` — on 422 from issue creation, the code retries without labels. The assumption is "label doesn't exist." But GitHub 422 means "Validation Failed" — could be many causes (invalid title, repo permissions, rate limit edge case, etc.).

**Impact:** Non-label 422 errors will trigger a retry that fails identically, wasting one API call and producing a confusing error trail.

**Lock decision:** Not blocking. The code path is defensive (retry then fail), not permissive (retry then falsely succeed). The worst case is wasted retry + same error, not false success. **Documented as design caveat.**

### TC-4: Auth/permission failure indistinguishable (MEDIUM)

**Finding:** When GitHub returns 401/403 during apply, the catch block wraps it as `SyncError('APPLY_FAILED', ...)`. The caller cannot distinguish "token expired" from "insufficient permissions" from "network error" from "repo not found."

**Impact:** Operators can't self-diagnose. All failures look the same in the output.

**Lock decision:** Not blocking. The system fails correctly (doesn't proceed after auth failure). The truth gap is in error classification, not in mutation truth. **Promoted to REGSYNC-004.**

## Liar-path rejection tests (3 hypothetical violations)

### LP-1: "Smart retry" — automatically re-run failed actions

**Hypothetical change:** After apply completes with failures, automatically re-run failed actions a second time ("in case it was transient").

**Why rejected:** Violates reject criteria #2 (hides retry behavior) and #3 (introduces idempotency claims). For issue creation, auto-retry would create duplicates. For createWorkflowPR, auto-retry might succeed on step 2 (if step 1's branch still exists) — which is actually useful — but the behavior would be invisible to the caller. Any retry must be explicit and visible.

### LP-2: "Sync complete" messaging — frame apply success as drift resolution

**Hypothetical change:** Change the console summary to say "Sync complete — N repos updated" when all actions succeed.

**Why rejected:** Violates reject criteria #6 (frames issue creation as drift resolution). Creating issues is not "updating repos." The human still has to read the issue, decide what to do, and take action. "Sync complete" implies the drift is fixed, which is false.

### LP-3: "Skip duplicates" — silently skip actions that look like duplicates

**Hypothetical change:** Before creating an issue, search for existing issues with the same title and skip if found.

**Why rejected:** Violates reject criteria #8 (changes plan→apply boundary). The plan says "create issue." If apply decides to skip because one looks similar, it's making a decision the plan didn't authorize. The correct fix is idempotency-aware planning, not silent skipping in apply.

## Design tradeoffs (named, not blocking)

### DT-1: No rollback for multi-step mutations

`createWorkflowPR` creates branch → file → PR in sequence with no rollback. If step 2 fails, the branch is orphaned.

**Acceptable because:** Rollback introduces its own failure modes (what if branch deletion fails?). The current approach is honest: it fails and reports failure. The truth gap is in the granularity of what's reported, not in whether failure is reported.

### DT-2: Issues are informational, not actionable mutations

Issue creation is the primary action type, but creating an issue doesn't change registry state. It requests human action. The system treats issue creation with the same "succeeded" surface as PR creation.

**Acceptable because:** The system is a sync engine, not a CI/CD pipeline. Its job is to surface drift and request action. But docs and output must not conflate "issue created" with "drift fixed."

### DT-3: fetchGitHub retry is invisible

`fetch.ts` retries 5xx errors up to 3 times with exponential backoff. The caller never sees that retries occurred.

**Acceptable because:** Transport-level retries on server errors are standard. But for a mutation-truth repo, invisible retries should be logged, not hidden.

## Summary

| Check | Result |
|-------|--------|
| Plan is read-only | PASS |
| Per-action success/failure | PASS |
| Partial failure visibility | PASS |
| Structured error codes | PARTIAL (APPLY_FAILED overloaded) |
| Token fail-fast | PASS (missing), PARTIAL (expired) |
| LP-1: Smart retry | Correctly rejected |
| LP-2: Sync complete | Correctly rejected |
| LP-3: Skip duplicates | Correctly rejected |

**Overall: PASS for lock.** The system reports mutation outcomes honestly at the action level. The truth gaps are in granularity (orphaned state, duplicate prevention, error classification) not in verdict honesty. Four truth concerns promoted to follow-up packets:
- REGSYNC-002: Surface partial mutation state in createWorkflowPR results
- REGSYNC-003: Add idempotency checks for issue creation
- REGSYNC-004: Distinguish auth/permission/network failures in error codes

**Rationale for locking despite truth concerns:** Unlike claude-session-copilot (where docs actively lied about capabilities) and synthesis (where the verdict surface was ambiguous), registry-sync's mutations are reported correctly — each action gets success/failure, and failure includes an error message. The gaps are about making the reporting *more granular*, not about fixing false claims. The system never says "succeeded" when a mutation failed.
