# Multi-Claude — Repo-Level Decisions

## 2026-03-24 — 6 precision gaps are operational trade-offs, not contract failures

**Decision:** All six gaps (worktree outside transaction, in-memory registry, reconciliation filters, session-level conflicts, stop reason vs verdict, no auto lease expiry) are accepted as operational trade-offs. They are named, bounded, recoverable, and do not let the system lie about lane isolation or dispatch truth.

**Status:** Locked.

---

## 2026-03-24 — Inverse liar-path is a reject-worthy change category

**Decision:** Added reject criterion #10: automatic reject if behavior weakens while language stays the same. This is the most dangerous drift mode for multi-claude — isolation semantics change but the product still talks like the guarantees are unchanged.

**Status:** Locked.
