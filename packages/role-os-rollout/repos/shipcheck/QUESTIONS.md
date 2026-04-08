# Shipcheck — Open Questions

## Q1: Dogfood fetch failure exit code

**Context:** `bin/shipcheck.mjs:346` — `fail(fetchResult.error, fetchResult.detail, "Check that dogfood-labs repo and indexes/latest-by-repo.json exist")` uses default exitCode=1.

**Question:** Should a network fetch failure exit 2 (runtime error) instead of 1 (user error)? The error contract says exit 2 = "the tool itself failed." A network failure is arguably a tool failure, not a user input error.

**Impact:** Minor. Only affects dogfood command. Could promote to org DECISIONS.md if answer applies to all tools with network fetch.

**Status:** RESOLVED — Keep at exit 1. Checker failure, not gate failure. Promoted to org decision.

---

## Q2: SKIP: detection tightening

**Context:** `bin/shipcheck.mjs:176` — `trimmed.includes("SKIP:")` matches anywhere in the line.

**Question:** Should SKIP: detection be tightened (e.g., require it after the checkbox text, not in the middle of a word)? Current behavior is functional but a line like `- [ ] Test SKIPPER: module` would false-positive as skipped.

**Impact:** Low. No known false positives in practice. But the proving packet flags it as a brittleness.

**Status:** RESOLVED — Yes, tighten. Explicit canonical markers only. No substring heuristics. Implementation is a future PR.

---

## Q3: Exit code 3 in CI script

**Context:** `.github/workflows/ci.yml` dogfood job checks `if [ "$EXIT_CODE" -eq 0 ] || [ "$EXIT_CODE" -eq 3 ]` → status=pass. But shipcheck.mjs never emits exit 3.

**Question:** Is this dead code? Future-proofing for a partial-success mode? Or a bug?

**Impact:** None currently (dead branch). But if exit 3 is added to the CLI later, CI would silently accept it as pass. The error contract does define exit 3 as "partial success."

**Status:** RESOLVED — Must be formalized or removed. Not a trustworthy contract surface in current state. Implementation is a future PR.
