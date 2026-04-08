# SHIPCHECK-001 — Audit Gate Integrity Lock

**Packet type:** lockdown proving packet
**Repo:** @mcptoolshop/shipcheck
**Seam:** Audit gate semantics + exit-code contract
**Date:** 2026-03-24
**Status:** APPROVED — human review complete 2026-03-24, 3 decisions locked

---

## Objective

Prove that the Role OS setup for shipcheck can reject the wrong change at multiple independent levels, with invariants traced to specific source lines.

## Invariants under test

### INV-1: Truthful exit on audit failure

**Claim:** `auditCommand()` exits 1 when any unchecked items remain.

**Source:** `bin/shipcheck.mjs:206-211`
```javascript
if (unchecked === 0) {
  log(`${GREEN}${BOLD}All hard gates pass. Ship it.${RESET}\n`);
} else {
  log(`${YELLOW}${unchecked} item(s) still need attention.${RESET}\n`);
  process.exit(1);
}
```

**Evidence:** The branch is binary. `unchecked === 0` → no exit (falls through to exit 0). `unchecked > 0` → `process.exit(1)`. There is no threshold, no rounding, no "close enough." The exit code is a direct consequence of the count.

**Test coverage:** `test/shipcheck.test.mjs` — "audit: gaps remain → exit 1" and "audit: all checked → exit 0" tests.

**Reject defense:**
- `protect-audit-gates.md` reject criterion #1 (weakens gate semantics)
- `current-priorities.md` invariant #7 (truthful exit codes)
- `product-brief.md` anti-thesis #1 (never convert hard failures into suggestions)

### INV-2: Structured error shape on every failure path

**Claim:** Every error exit goes through `fail()`, which emits `{code, message, hint}`.

**Source:** `bin/shipcheck.mjs:25-34`
```javascript
function fail(code, message, hint, exitCode = 1) {
  const error = { code, message, hint };
  if (process.env.SHIPCHECK_JSON) {
    console.error(JSON.stringify(error));
  } else {
    console.error(`${YELLOW}Error [${code}]:${RESET} ${message}`);
    console.error(`${DIM}Hint: ${hint}${RESET}`);
  }
  process.exit(exitCode);
}
```

**Callers:**
- L117: `fail("IO_TEMPLATE_MISSING", ...)` — init, missing template, exit 2
- L160: `fail("STATE_MISSING_GATE", ...)` — audit, missing SHIP_GATE.md, exit 1 (default)
- L328: `fail("INPUT_MISSING_REPO", ...)` — dogfood, missing --repo, exit 1
- L331: `fail("INPUT_MISSING_SURFACE", ...)` — dogfood, missing --surface, exit 1
- L346: `fail(fetchResult.error, ...)` — dogfood, fetch failed (DOGFOOD_INDEX_FETCH_FAILED)
- L418: `fail("INPUT_UNKNOWN_COMMAND", ...)` — unknown command, exit 1

**Exception:** `auditCommand()` L210 uses `process.exit(1)` directly (not via fail()). This is acceptable because the gap report is the structured output — the exit code is the error signal.

**Exception:** `dogfoodCommand()` L359-362 uses JSON output + `process.exit(1)` directly for dogfood failures in required mode. The result object already contains structured `{reason, detail}`.

**Reject defense:**
- `protect-audit-gates.md` reject criterion #3 (hides failure specificity)
- `current-priorities.md` invariant #3 (structured error shape)
- `brand-rules.md` truth constraint #3 (exit codes must match semantics)

### INV-3: Exit code semantics are stable

**Claim:** Exit 0 = success, exit 1 = user/gate failure, exit 2 = runtime failure. These semantics are permanent.

**Source:** `contracts/error-contract.md` (exit code table) + `bin/shipcheck.mjs` (all exit paths)

**Exhaustive exit code map:**

| Path | Code | Semantic |
|------|------|----------|
| help/--help/-h | 0 | success |
| init completes | 0 | success |
| audit: unchecked=0 | 0 | success |
| dogfood: pass | 0 | success |
| dogfood: exempt | 0 | success |
| dogfood: warn-only + fail | 0 | success (policy-gated relaxation) |
| unknown command | 1 | user error |
| audit: unchecked>0 | 1 | gate failure |
| dogfood: missing flags | 1 | user error |
| dogfood: required + fail | 1 | gate failure |
| init: missing template | 2 | runtime error |
| dogfood: fetch failed | 1* | runtime-ish (uses default exitCode=1, should arguably be 2) |

*Note: `fail()` default exitCode is 1, and the dogfood fetch failure at L346 doesn't override it. This is a minor inconsistency — a fetch failure is arguably a runtime error (exit 2), not a user error. Flagged for human review but not blocking.

**Reject defense:**
- `protect-audit-gates.md` reject criterion #2 (blurs exit-code meaning)
- `contracts/error-contract.md` stability rule (released codes are permanent)
- `current-priorities.md` invariant #2 (exit code contract)

### INV-4: Gate template integrity

**Claim:** SHIP_GATE.md template contains exactly 31 checkable items across gates A-E.

**Source:** `templates/SHIP_GATE.md`

**Verification method:**
```bash
grep -c "^- \[ \]" templates/SHIP_GATE.md
# Expected: 31
```

**Reject defense:**
- `protect-audit-gates.md` reject criterion #7 (changes item count without updates)
- `brand-rules.md` truth constraint #4 (template item count must be exact)
- `current-priorities.md` invariant #4 (31-item gate template)

### INV-5: Zero runtime dependencies

**Claim:** `dependencies` in package.json is empty or absent.

**Source:** `package.json` — no `dependencies` field present.

**Reject defense:**
- `protect-audit-gates.md` reject criterion #5 (adds runtime dependencies)
- `current-priorities.md` invariant #1 (zero dependencies)
- `product-brief.md` anti-thesis #3 (no configuration-heavy framework)

## Hypothetical violations

### Violation A: "Friendly threshold" change

**Scenario:** A PR adds `if (passRate >= 95) process.exit(0);` to auditCommand(), allowing repos with 1-2 unchecked items to pass.

**Would this be rejected?**
- `protect-audit-gates.md` criterion #1: YES — weakens gate semantics
- `product-brief.md` anti-thesis #1: YES — converts hard failure into suggestion
- `brand-rules.md` forbidden metaphor: YES — introduces "close enough" logic
- INV-1 broken: unchecked > 0 but exit 0

**Verdict:** Rejected at 4 independent levels.

### Violation B: "Generic error code" change

**Scenario:** A PR replaces `fail("STATE_MISSING_GATE", ...)` with `fail("ERROR", "Something went wrong", "Try again")`.

**Would this be rejected?**
- `protect-audit-gates.md` criterion #3: YES — hides failure specificity
- `brand-rules.md` truth constraint #3: YES — error codes must be specific
- INV-2 weakened: error shape preserved but diagnostic value destroyed

**Verdict:** Rejected at 3 independent levels.

### Violation C: "Optional strictness" flag

**Scenario:** A PR adds `--lenient` flag that converts hard gate failures to warnings.

**Would this be rejected?**
- `protect-audit-gates.md` criterion #4: YES — converts hard failure to advisory
- `protect-audit-gates.md` criterion #6: YES — configuration that relaxes gates
- `product-brief.md` anti-thesis #1: YES — advisory tool
- `current-priorities.md` banned detour #5: YES — no config file support

**Verdict:** Rejected at 4 independent levels.

## Routing verification

**Test:** Does `roleos route` recommend the correct chain for a change touching `bin/shipcheck.mjs`?

Expected chain: Backend Engineer → Test Engineer → Critic Reviewer
(as specified in `protect-audit-gates.md`)

*Note: This will be verified after `roleos init` is run on the actual repo. For now, the workflow document specifies the chain explicitly.*

## Resolved questions (human decisions 2026-03-24)

### Q1: Dogfood fetch failure exit code
**Decision:** Keep at exit 1. A fetch failure is checker failure (exit 1), not an evaluated gate failure (exit 2). Conflating them makes automation lie about what happened. This decision is promoted to org-level (applies to all CLI tools that gate releases).

### Q2: SKIP detection
**Decision:** Tighten it. Must use explicit canonical markers with explicit parsing rules. No substring heuristics. Implementation is a future code PR; the lockdown records the decision.

### Q3: Exit code 3 in CI
**Decision:** Must be formalized or removed. Currently dead code and not a trustworthy contract surface. Implementation is a future code/CI PR; the lockdown records the decision.

### Q4: Additional reject rule (human-required)
**Added:** Reject criterion #8 in protect-audit-gates.md — automatic reject if exit-code semantics, skip semantics, or dogfood fetch classification change without synchronized updates to docs, tests, and org decision records.

## Verdict

**APPROVED** — Human review complete 2026-03-24. All 5 invariants traced to source lines. 3 hypothetical violations proven rejectable at 3-4 independent levels each. 3 open questions resolved with locked decisions. 1 additional reject rule added per human requirement. 4 context files patched per pressure-test feedback.

Lockdown status: **locked**.
