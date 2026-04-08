# Polyglot MCP — Repo-Level Decisions

## 2026-03-24 — Design tradeoffs are intentional, not defects

**Decision:** All four tradeoffs (mixed-language fallback, fragile batch separator, non-atomic cache writes, pt-BR→pt alias) are accepted as named, intentional limitations. They do not block lock.

**Status:** Locked.

---

## 2026-03-24 — Fallback-warning legibility is a contract surface

**Decision:** The fallback-to-source warning is not just "present" — it must be machine-detectable (in structured warnings array) and operator-legible (clear about what happened). Criterion #1 sharpened to reject changes that soften the signal while keeping it technically present.

**Status:** Locked.
