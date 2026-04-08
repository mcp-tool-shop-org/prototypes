# World Forge Golden-Stress Trial — Export Preview Diff

**Date:** 2026-04-02
**Task:** Add export preview diff (show what the engine will receive vs editor state)
**Type:** Paired trial (baseline vs constrained) — **golden-stress** (OH-3)
**Hypothesis tested:** OH-3 — Do goldens fire rarely but matter a lot?

---

## Golden-Side Scoring (Primary Focus)

### Golden: "Create and Export" Flow

```
template-select → canvas-edit → validation → export
```

Invariants:
1. Validation issues block export when severity is error
2. Export produces valid ContentPack JSON
3. **Canvas state is never modified by export**

| Check | Baseline | Constrained |
|-------|----------|-------------|
| Invariant 1 (validation blocks export) | **Violated** — "Export to Engine" button is always enabled, no validation gate | **Respected** — shows "Export blocked" when validation fails, no export button |
| Invariant 2 (valid ContentPack) | Not directly testable in this component | Not directly testable |
| **Invariant 3 (canvas not modified by export)** | **Violated** — "Auto-Fix Drift" button calls `updateZone()`, mutating project state from the export preview surface | **Respected** — component is read-only, no store mutations |

**Baseline golden violations: 2**
**Constrained golden violations: 0**

This is the first trial where golden invariants fire.

### Why invariant 3 matters

The "Create and Export" golden flow specifies that **canvas state is never modified by export**. The baseline's "Auto-Fix Drift" button calls `updateZone()` from within the export preview panel. This means the export surface is silently editing the world — the user is looking at a diff panel and their project data changes underneath them.

This violates the golden flow's contract: export is a read operation. It reads the project, converts it, and downloads it. It should never write back to the project. If the diff shows divergence, the user should fix it in the editor (on the canvas), not by pressing "Auto-Fix" on the export surface.

### Why invariant 1 matters

The baseline renders "Export to Engine" as an always-available primary action button. The existing `ExportModal` already has validation pre-checks that block export on error. By adding a second export trigger without the same gate, the baseline creates a path that bypasses the validation invariant.

The constrained version doesn't include an export button at all — it's a read-only fidelity report. The user exports through the existing export flow (ExportModal), which has the validation gate.

---

## Compiler-Side Scoring (Secondary Context)

### Token Bypass

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| Raw color violations (inline styles) | **40** | **0** |

### Forbidden Patterns

| Pattern | Baseline | Constrained |
|---------|----------|-------------|
| fp-dashboard-metrics | **Yes** — 3-card stat dashboard (Total / Lost / Changed) | **No** — summary line with counts |
| fp-styles-ts-raw | **Yes** — zero imports from styles.ts | **No** — imports 4 primitives |
| fp-token-bypass | **Yes** | **No** |

### Budget Breaches

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| Primary actions | **2** (Export to Engine + Auto-Fix Drift) | **0** (read-only, no actions) |
| Budget (max 2) | At limit | Within |

### Structural Comparison

| Dimension | Baseline | Constrained |
|-----------|----------|-------------|
| Lines | 265 | 197 |
| Stores consumed | 3 (project + editor + modal), mutations: `updateZone`, `openModal` | 1 (project), read-only |
| Actions | 3 (export, auto-fix, filter toggle) | 1 (filter toggle — not a mutation) |
| styles.ts imports | 0 | 4 (`sectionHeader`, `cardItem`, `badgePill`, `hintText`) |
| Validation gate | None — export always available | Shows "Export blocked" on validation failure |
| Project mutations | `updateZone()` via Auto-Fix | None |
| Dashboard elements | 3-card stat row | None |

---

## Verdict

**This is the first trial where golden invariants fire. OH-3 is now partially resolved.**

The baseline violated 2 of 3 "Create and Export" golden invariants:

1. **Validation-blocks-export** — The "Export to Engine" button is always available, bypassing the validation gate that exists in the ExportModal.

2. **Canvas-not-modified-by-export** — The "Auto-Fix Drift" button calls `updateZone()`, mutating the project from within the export surface. This is the most severe finding: the user is looking at a diff report while their world data changes silently.

The constrained version hit zero golden violations because it's read-only. It reports fidelity without offering to fix anything or trigger export.

### Golden violation characteristics

| Characteristic | Observed |
|----------------|----------|
| Frequency | Rare — 0 in first 3 trials, 2 in this trial |
| Severity | **High** — invariant 3 violation is a data-integrity issue |
| Detection difficulty | Would require semantic analysis to auto-detect; the checker cannot currently identify that `updateZone()` is called from an export-context component |
| Pack prevention | The constrained run avoided the violation entirely through read-only design |

This confirms H4's prediction: **goldens fire rarely, but when they fire, the severity is high.** A silent mutation from an export preview panel is the kind of bug that ships to production because it doesn't cause visible errors — it causes subtle data corruption.

### Scores

| Category | Baseline | Constrained |
|----------|----------|-------------|
| Golden violations | 2 | 0 |
| Token violations | 40 | 0 |
| Forbidden pattern hits | 2 (dashboard + styles.ts bypass) | 0 |
| Budget breaches | 0 (at limit, not over) | 0 |
| **Total violations** | **44** | **0** |

**Classification: Strong catch — first golden-stress trial, highest-severity finding class.**

---

## OH-3 Resolution

**OH-3: Do goldens fire rarely but matter a lot?**

**Yes — confirmed.** Across 6 trials:
- 5 trials: 0 golden violations
- 1 trial (this one): 2 golden violations, both high-severity

The "Auto-Fix Drift" mutation from an export preview surface is the most dangerous single finding across all 6 trials. Token bypass is noisy but cosmetic. Dashboard creep is a taste issue. **A silent project mutation from a read-only surface is a data-integrity bug.**

Golden flows are not high-volume. They will never dominate a violation report. But when they trigger, they catch the kind of structural mistake that passes code review because it looks helpful ("Auto-Fix Drift" sounds like a feature, not a bug).

**Refined understanding:** Goldens are a safety net, not a primary enforcement mechanism. Their value is proportional to how dangerous the failure would be if missed. For export-truth invariants specifically, the value is very high.
