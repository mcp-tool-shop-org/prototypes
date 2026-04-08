# Claude Guardian — Repo-Level Decisions

## 2026-03-24 — Known seams are intentional tradeoffs, not defects

**Decision:** The four flagged seams (state freshness 10s, advisory budget, enum escalation, log tails in bundles) are intentional design tradeoffs. They remain named and documented but do not block lock.

**Why:** Each is explicit, tested where contractual, and rejectable by the Critic if future changes drift against them.

**Status:** Locked.

---

## 2026-03-24 — Reassurance drift is a reject-worthy change category

**Decision:** Added reject criterion #9: automatic reject if a change makes human-facing reassurance stronger while leaving machine-facing semantics unchanged.

**Why:** This is a subtle but dangerous drift mode. A change that preserves exit codes and risk levels but rewrites visible text to feel safer weakens operator understanding while passing all machine tests.

**Status:** Locked.
