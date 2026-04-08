# synthesis — Repo-Local Decisions

## 2026-03-24 — Passing verdict is not quality endorsement

**Decision:** A passing verdict means "these specific failure patterns were not triggered." It does not mean the response is empathetic, caring, or trustworthy. All language must reflect this distinction.

**Why:** The evaluator checks three specific failure modes (agency language, unverifiable reassurance, topic pivot). Three passes does not constitute a quality assessment. The system detects failure modes, not quality.

**Applies to:** All output, docs, console messaging, and report framing.

---

## 2026-03-24 — N/A is not passing

**Decision:** When the pivot checker returns N/A (no vulnerability detected), it means "not checked," not "checked and found clean." N/A must never be counted as a pass in metrics or summary.

**Why:** Counting N/A as passing inflates the pass rate and hides that a dimension was not assessed. The applicability gate prevents false positives but also means the check did not run.

**Applies to:** Report metrics, console summary, consumer interpretation guidance.
