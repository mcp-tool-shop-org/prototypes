# Shipcheck — Repo-Level Decisions

## 2026-03-24 — Exit code semantics for shipcheck

**Decision:** Keep dogfood fetch failure at exit 1, not exit 2. Redefine exit code semantics:
- Exit 0 = success
- Exit 1 = tool/runtime/integration failure (checker could not complete its job)
- Exit 2 = evaluated gate failure (repo was evaluated and failed)
- Exit 3 = reserved, must not exist without documentation + test

**Why:** A fetch failure is the checker failing to obtain required truth, not the repo cleanly failing an evaluated rule. Conflating those makes downstream automation lie about what happened.

**Status:** Locked.

---

## 2026-03-24 — SKIP detection must be tightened

**Decision:** SKIP detection must use explicit canonical markers with explicit parsing rules. No substring heuristics, no "looks close enough" matching, no inference from casual prose.

**Why:** Shipcheck is too central to tolerate accidental skip semantics from loose matching. The current `trimmed.includes("SKIP:")` is a known brittleness.

**Implementation:** This is a code change to be made in a future PR. The lockdown records the decision; the fix follows.

**Status:** Locked (decision). Implementation pending.

---

## 2026-03-24 — Exit code 3 must be formalized or removed

**Decision:** Exit code 3 in CI (`ci.yml` dogfood job) is currently dead code. It must be either:
- Removed from CI, or
- Formalized with one explicit meaning, one explicit trigger class, and one test

It must not survive as ambiguous. If it is not documented and not exercised, it is not a trustworthy contract surface.

**Implementation:** This is a code/CI change to be made in a future PR. The lockdown records the decision; the fix follows.

**Status:** Locked (decision). Implementation pending.
