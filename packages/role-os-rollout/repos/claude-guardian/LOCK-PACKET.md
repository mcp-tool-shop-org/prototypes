# GUARDIAN-001 — Health & Budget Truth Lock

**Packet type:** lockdown proving packet
**Repo:** @mcptoolshop/claude-guardian
**Seam:** Health checks + budget-system truth
**Date:** 2026-03-24
**Status:** APPROVED — human review complete 2026-03-24, no blocking issues, 1 reject criterion added

---

## Objective

Prove that the Role OS setup for claude-guardian can reject changes that would blur health-state meaning, soften budget semantics into vague guidance, or conflate distinct failure categories.

## Forced questions (answered in draft)

### Q-A: What exactly distinguishes "system unhealthy" from "budget exceeded" from "checker failure"?

| Class | Trigger | Signal location | Output path |
|-------|---------|----------------|-------------|
| **System unhealthy** | Disk < 5GB, logs > 200MB, hang detected (composite quiet > thresholds) | `process-monitor.ts:assessHangRisk()`, `log-manager.ts:scanLogs()` | `hangRisk.level`, `diskLow`, `claudeLogSizeMB` |
| **Budget exceeded** | `slotsAvailable === 0` because leases fill cap, or cap reduced by risk | `budget.ts:acquire()`, `budget.ts:adjustCap()` | `acquire → {granted: false, reason}` |
| **Checker failure** | `findClaudeProcesses()` throws (permissions, tools unavailable), state parse failure | `process-monitor.ts:54-121` (captured in `lastEnumerationError`), `state.ts:109-136` | `lastEnumerationError` field, state reset to null |

These three produce different signals at different code locations. A change that merges any two code paths is a contract breach.

### Q-B: Which outputs are contractual for machines, and which are explanatory for humans?

| Output | Contractual (machine) | Explanatory (human) |
|--------|----------------------|---------------------|
| `hangRisk.level` (ok/warn/critical) | YES — agents branch on this | — |
| `budget.slotsAvailable` (number) | YES — agents use for decisions | — |
| `acquire → {granted, lease/reason}` | YES — binary contract | — |
| `attention.level` (none/info/warn/critical) | YES — used for escalation | — |
| `isError: true` in MCP response | YES — error detection | — |
| Health banner text | — | YES — formatted display |
| Recovery plan step descriptions | — | YES — guidance |
| Recovery plan tool names | PARTIALLY — referenced by name | — |
| Doctor summary report | — | YES — human diagnostic |
| Journal entries | PARTIALLY — structured JSON | — |

### Q-C: What wording would make claude-guardian feel safer while actually reducing truth?

Examples of dangerous drift:
- "No issues detected" instead of "risk: ok, disk: 12.4GB, logs: 45MB" — hides measurements behind absence-of-problems framing
- "System is healthy" instead of "hangRisk: ok" — implies absolute state instead of threshold-based measurement
- "Budget should be fine" instead of "2 slots available, cap: 4" — converts number into qualitative comfort
- "Guardian is protecting your session" instead of "daemon polling every 2s, state age: 1s" — implies active protection where there is only monitoring
- "Automatically managing resources" instead of "budget advisory: agents must cooperate" — implies enforcement where none exists

## Invariants under test

### INV-1: Hang risk is deterministic

**Claim:** `assessHangRisk()` produces the same level for the same inputs. No randomness, no time-of-day effects, no probabilistic assessment.

**Source:** `src/process-monitor.ts:assessHangRisk()` — decision table with explicit threshold checks:
- Grace window active (processAge < 60s) → ok
- Composite quiet > hangThreshold (300s) → warn
- Composite quiet > 3× hangThreshold (900s) → critical
- Disk < 5GB → escalates to warn minimum
- CPU > 95% or memory > 4GB → warn

**Evidence:** The function takes numeric inputs and returns a level via if/else branches. No Math.random(), no Date.now() in the decision (only in compositeQuiet computation, which is an input parameter).

**Test coverage:** `process-monitor.test.ts` — tests for each escalation path, grace window behavior, threshold boundaries.

**Reject defense:**
- `protect-health-budget-truth.md` criterion #1 (blurs health-state meaning)
- `current-priorities.md` invariant #1 (hang risk is deterministic)
- `brand-rules.md` truth constraint #1 (same inputs → same level)

### INV-2: Budget acquire is binary

**Claim:** `Budget.acquire()` returns either `{granted: true, lease: {...}}` or `{granted: false, reason: "..."}`. No intermediate state.

**Source:** `src/budget.ts:acquire()`:
```
if (n > this.slotsAvailable) → return {granted: false, reason: "..."}
else → create lease, push to array, return {granted: true, lease: {...}}
```

**Evidence:** Single if/else. `granted` is a boolean. No "pending", no "partial", no "retry."

**Test coverage:** `budget.test.ts` — tests for granted and denied paths, cap transitions, lease expiry.

**Reject defense:**
- `protect-health-budget-truth.md` criterion #2 (changes budget semantics)
- `current-priorities.md` invariant #2 (binary acquire)
- `brand-rules.md` truth constraint #2 (granted or denied, nothing else)

### INV-3: Three failure classes are distinct

**Claim:** System unhealthy, budget exceeded, and checker failure produce distinguishable signals that never merge in output.

**Source:**
- System unhealthy: `hangRisk.level` from `assessHangRisk()` + `diskLow` + `claudeLogSizeMB`
- Budget exceeded: `acquire → {granted: false}` from `Budget.acquire()`
- Checker failure: `lastEnumerationError` from `findClaudeProcesses()`, state parse failure from `readState()`

**Evidence:** These three signal types are produced by different functions in different files. They appear in different fields of the MCP output. No single function combines them.

**Reject defense:**
- `protect-health-budget-truth.md` criterion #3 (hides checker failure inside policy failure)
- `current-priorities.md` invariant #3 (three failure classes remain distinct)
- `product-brief.md` anti-thesis #4 (never conflate failure categories)

### INV-4: State writes are atomic

**Claim:** State persistence uses tmp+rename pattern. Corrupt state is backed up and reset.

**Source:** `src/state.ts:writeState()` — writes to `state.json.tmp`, then `rename(tmp, state.json)`.
`src/state.ts:readState()` — on JSON parse failure: backup corrupt file to `state.json.corrupt.<timestamp>`, journal the recovery, return null.

**Test coverage:** `state.test.ts` — round-trip persistence, corruption recovery.

**Reject defense:**
- `protect-health-budget-truth.md` criterion #8 (alters freshness windows)
- `current-priorities.md` invariant #4 (state writes are atomic)

### INV-5: No process killing

**Claim:** Guardian never sends signals to any process.

**Source:** Grep for `kill`, `SIGKILL`, `SIGTERM`, `process.kill` across all source files.

**Evidence:** No matches for process-killing patterns in src/. The README explicitly states "Never kills processes or restarts." The recovery plan recommends actions but never executes them autonomously.

**Reject defense:**
- `protect-health-budget-truth.md` criterion #7 (adds process control)
- `current-priorities.md` invariant #5 (no process killing, zero exceptions)
- `product-brief.md` anti-thesis #1 (never a process killer)

## Hypothetical violations

### Violation A: "Friendly health summary"

**Scenario:** A PR changes the health banner from `[warn] disk:3.2GB logs:210MB hangRisk:warn` to `⚠️ Your session needs attention — disk space is running low and logs are large. Consider running a cleanup.`

**Would this be rejected?**
- `protect-health-budget-truth.md` criterion #4: YES — softens measurements into qualitative assessments
- `protect-health-budget-truth.md` criterion #6: YES — introduces UI/UX framing
- `brand-rules.md` enforcement ban #2: YES — "everything looks good" pattern
- `brand-rules.md` contamination risk: YES — dashboard UX drift

**Verdict:** Rejected at 4 independent levels.

### Violation B: "Smart budget with retry"

**Scenario:** A PR changes `acquire()` to return `{granted: "deferred", retryAfterMs: 5000}` when slots are nearly available.

**Would this be rejected?**
- `protect-health-budget-truth.md` criterion #2: YES — changes budget semantics
- `current-priorities.md` invariant #2: YES — binary acquire violated
- `brand-rules.md` truth constraint #2: YES — no partial grants
- INV-2 broken: acquire is no longer binary

**Verdict:** Rejected at 4 independent levels.

### Violation C: "Merged error handling"

**Scenario:** A PR catches `findClaudeProcesses()` errors and reports them as `hangRisk: critical` (instead of as a checker failure with `lastEnumerationError`).

**Would this be rejected?**
- `protect-health-budget-truth.md` criterion #3: YES — hides checker failure inside policy failure
- `current-priorities.md` invariant #3: YES — failure classes conflated
- `product-brief.md` anti-thesis #4: YES — blurs failure categories
- INV-3 broken: checker failure now looks like system unhealthy

**Verdict:** Rejected at 4 independent levels.

## Known seams flagged (not blocking, for awareness)

1. **State freshness is 10 seconds** — if daemon crashes, MCP tools get up to 8s of stale data. Not a contract breach but a known limitation.
2. **Budget is advisory** — agents can ignore denials. By design, but must be documented.
3. **Process enumeration failure** — captured in `lastEnumerationError` but health system may over-escalate. Current behavior is to escalate (conservative), which is safer than under-reporting.
4. **Log tails in bundles may contain user content** — documented, not sanitized. Operator must audit before sharing.

## Post-review addition

**Reject criterion #9 added** per human review: automatic reject if a change makes human-facing reassurance stronger while leaving machine-facing semantics unchanged. This covers the subtle drift mode where technical behavior is preserved but operator understanding is weakened through warmer/softer language.

## Verdict

**APPROVED** — Human review complete 2026-03-24. All 5 invariants traced to source. 3 hypothetical violations proven rejectable at 4 independent levels each. 3 forced questions answered with code references. 4 known seams flagged as intentional design tradeoffs. 1 additional reject criterion added (reassurance drift). 9 total reject criteria.

Lockdown status: **locked**.
