# Site Theme — Repo-Level Decisions

## 2026-03-24 — Design tradeoffs are intentional, not defects

**Decision:** All four tradeoffs (hardcoded org domain, set:html XSS surface, app template stubs, no upgrade guide) are accepted as named, intentional limitations.

**Status:** Locked.

---

## 2026-03-24 — CI matrix coverage is a contract surface

**Decision:** Added reject criterion #9: automatic reject if CI matrix coverage is reduced or multi-template validation weakened. The liar-path for scaffold repos is local success while the broader contract erodes.

**Status:** Locked.
