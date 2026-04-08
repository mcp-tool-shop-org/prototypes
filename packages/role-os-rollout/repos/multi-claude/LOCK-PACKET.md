# MULTICLAUDE-001 — Lane Isolation Lock

**Packet type:** lockdown proving packet
**Repo:** @mcptoolshop/multi-claude
**Seam:** Lane isolation + dispatch truthfulness
**Date:** 2026-03-24
**Status:** APPROVED — human review complete 2026-03-24, 6 precision gaps accepted as operational, inverse liar-path criterion added

---

## Objective

Prove that the Role OS setup for multi-claude can reject changes that would break claim atomicity, leak file isolation between lanes, hide worker failures, or bypass the verification gate.

## Invariants under test

### INV-1: Claim is fully atomic

**Claim:** `runClaim()` wraps all checks (status, deps, conflicts, existing claims) and all mutations (attempt creation, claim insertion, status update, transition log) in a single `db.transaction()`.

**Source:** `src/commands/claim.ts:runClaim()` — entire body is `db.transaction(() => { ... })()`.

**Evidence:** SQLite `db.transaction()` provides all-or-nothing semantics. If any step throws, all writes roll back. The UNIQUE partial index `idx_claims_active_packet ON claims(packet_id) WHERE is_active = 1` prevents double-claims even if two transactions race.

**Test coverage:** `test/claim.test.ts` — claim atomicity, role conflict, dependency validation tests.

**Reject defense:**
- `protect-lane-isolation.md` criterion #1 (breaks claim atomicity)
- `protect-lane-isolation.md` criterion #2 (weakens one-active-claim)
- `current-priorities.md` invariant #1 (claim atomicity)
- `current-priorities.md` invariant #2 (one active claim per packet)

### INV-2: Per-packet worktree isolation

**Claim:** Each claimed packet gets its own git worktree at `.multi-claude/worktrees/{packet_id}/` on a dedicated branch `multi-claude/{packet_id}`.

**Source:** `src/commands/auto.ts:createWorktree()` — creates worktree via `git worktree add`.

**Known gap:** Worktree creation happens AFTER the claim transaction succeeds. A crash between claim and worktree creation leaves an orphaned claim (packet is 'claimed' but no worktree exists). Lease expires in 2 hours.

**Test coverage:** End-to-end tests in `test/e2e.test.ts` cover claim → worktree → execute flow.

**Reject defense:**
- `protect-lane-isolation.md` criterion #3 (allows file scope leakage)
- `current-priorities.md` invariant #3 (per-packet worktree isolation)

### INV-3: Reconciliation catches undeclared changes

**Claim:** `reconcileOutput()` compares declared artifact manifest against actual `git diff`. Files in actual but not in declared → undeclared error. Files matching forbidden patterns → scope violation.

**Source:** `src/runtime/reconcile.ts:reconcileOutput()`.

**Known limitation:** 8 hardcoded filter patterns (node_modules, dist, target, .tsbuildinfo, pnpm-lock.yaml, Cargo.lock, .multi-claude) are invisible to reconciliation. Changes in these paths are not reported.

**Test coverage:** Reconciliation tests verify undeclared detection, forbidden file rejection, scope validation.

**Reject defense:**
- `protect-lane-isolation.md` criterion #3 (file scope leakage)
- `protect-lane-isolation.md` criterion #7 (configurable filters without audit)
- `current-priorities.md` invariant #4 (reconciliation catches undeclared)

### INV-4: Stop reason reflects output classification, not worker exit

**Claim:** `classifyOutput()` returns stop reasons based on file existence and JSON validity: ERROR file → `failed`, missing JSON → `malformed_output`, valid JSON → `completed`. Worker process exit code is not used.

**Source:** `src/runtime/sdk-runtime.ts:classifyOutput()`.

**Key distinction:** `completed` means valid artifacts.json + writeback.json exist. It does NOT mean reconciliation passed or verification succeeded. The final truth is in submit/verify results.

**Reject defense:**
- `protect-lane-isolation.md` criterion #4 (hides lane failures)
- `protect-lane-isolation.md` criterion #5 (conflates stop reason with verdict)
- `current-priorities.md` invariant #7 (stop reason reflects output classification)

### INV-5: Verification is a required gate

**Claim:** Packets must pass through submitted → verifying → verified before reaching merged. No shortcut.

**Source:** `src/commands/verify.ts` — runs verification checks, advances status only on pass. `src/commands/promote.ts` — requires verified status before promoting to integrating/merged.

**Reject defense:**
- `protect-lane-isolation.md` criterion #8 (bypasses verification gate)
- `current-priorities.md` invariant #5 (verification is a gate)

## Hypothetical violations

### Violation A: "Move dep check outside transaction for performance"

**Scenario:** A PR moves the dependency check out of `runClaim()`'s transaction to a separate pre-check, then claims inside a smaller transaction.

**Would this be rejected?**
- `protect-lane-isolation.md` criterion #1: YES — checks moved outside transaction
- `current-priorities.md` invariant #1: YES — claim atomicity broken
- INV-1: TOCTOU race — dependency could change between pre-check and claim

**Verdict:** Rejected at 3 independent levels.

### Violation B: "Add dist/ to reconciliation scope"

**Scenario:** A PR removes `dist/` from the ignored patterns list so reconciliation catches build artifact changes.

**Would this be rejected?**
- Not automatically rejected — this STRENGTHENS reconciliation
- But criterion #7 requires the change to be documented and the proving packet updated
- Must verify: does removing `dist/` cause false positives for legitimate build outputs?

**Verdict:** Allowed with documentation. Criterion #7 applies to adding filters, not removing them.

### Violation C: "Fast merge for verified-by-architect packets"

**Scenario:** A PR adds a `--skip-verify` flag to `promote` that allows architect-approved packets to go directly from submitted to merged.

**Would this be rejected?**
- `protect-lane-isolation.md` criterion #8: YES — bypasses verification gate
- `current-priorities.md` invariant #5: YES — verification required
- `product-brief.md` anti-thesis #5: YES — no unverified merges

**Verdict:** Rejected at 3 independent levels.

## Known precision gaps (documented, not blocking)

1. **Worktree creation outside transaction.** Crash between claim and worktree → orphaned claim. Lease expires in 2 hours. Documented operational procedure.
2. **In-memory session registry.** Lost on crash. No persistence. Not critical — DB has attempt records for recovery.
3. **Reconciliation filter patterns.** 8 hardcoded paths invisible to reconciliation. Documented, intentional (build artifacts).
4. **Session-level role conflicts not DB-enforced.** Coordinator + builder in same session, sweep + file-modifier in same session — architectural assumptions, not constraints.
5. **Stop reason ≠ verification verdict.** `completed` means valid JSON, not verified output. The distinction is documented and intentional.
6. **No automatic lease expiration.** Claims expire by timestamp but no background job reclaims them. Operator must manually release.

This is the most complex repo in the rollout. The precision gaps are real but all are documented, operationally manageable, and none break the core isolation contract.

## Post-review addition

**Reject criterion #10 added** per human review: automatic reject if a change reduces effective isolation or recovery truth while preserving the same outward success language. This is the inverse of #9 and the most dangerous liar-path for multi-claude — behavior weakens silently while the product still sounds confident.

## Verdict

**APPROVED** — Human review complete 2026-03-24. All 5 invariants traced to source. 3 hypothetical violations proven rejectable. 6 precision gaps accepted as operational trade-offs (not contract failures). 10 total reject criteria. Inverse liar-path protection added.

Lockdown status: **locked**.
