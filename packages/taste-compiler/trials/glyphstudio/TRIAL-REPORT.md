# GlyphStudio Trial #1 — Export Readiness Surface

**Date:** 2026-04-02
**Task:** Add a contextual export-readiness surface to GlyphStudio's editor workspace
**Type:** Paired trial (baseline vs constrained)

---

## Compiler-Side Scoring

### Token Bypass (TOK-001)

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| Raw color violations | **9 errors** | **0** |
| Files with violations | 1 (CSS) | 0 |

**Baseline violations (all in ExportReadinessPanel.css):**

| Line | Value | Context |
|------|-------|---------|
| 35 | `rgba(58, 201, 122, 0.12)` | `.erpanel-overall-ready` background |
| 41 | `rgba(232, 167, 68, 0.12)` | `.erpanel-overall-warning` background |
| 47 | `rgba(232, 84, 84, 0.12)` | `.erpanel-overall-blocked` background |
| 78 | `#fff` | `.erpanel-indicator-ready` text |
| 83 | `#000` | `.erpanel-indicator-warning` text |
| 88 | `#fff` | `.erpanel-indicator-blocked` text |
| 144 | `rgba(212, 160, 82, 0.15)` | `.erpanel-aside-tag.sketch` background |
| 145 | `#d4a052` | `.erpanel-aside-tag.sketch` color |
| 251 | `#fff` | `.erpanel-quick-btn` text |

### Forbidden Patterns

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| Dashboard/KPI hits | **Yes** — 2x2 manifest grid | **No** — simple property list |
| Chat/assistant hits | 0 | 0 |
| Preview/commit blur | **Partial** — "Quick Export" executes from review surface | **No** — explicit "Preview only" language |

### Budget Breaches

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| Primary actions | **3** (readiness badge + PNG Frame + Sprite Sheet) | **2** (Run Checks secondary + Go to Export primary) |
| Max primary actions budget | 2 | 2 |
| Budget breached? | **Yes** | **No** |

### Golden Flows

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| "New Sprite to Export" golden | Intact | Intact |
| "Animate and Preview" golden | Intact | Intact |
| Golden failure? | No | No |

### Copy Rules

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| Banned phrases | 0 | 0 |
| Tone violations | 0 | 0 |

---

## Human-Side Scoring

### Does it still feel canvas-first?

- **Baseline:** Mostly. Panel lives in right dock (correct). But the 2x2 manifest summary grid with centered stat values (`13px font-weight: 600`) feels dashboard-like — it's a stat tile cluster, not a tool panel.
- **Constrained:** Yes. Simple property list layout (label: value rows). Reads like metadata, not metrics.

### Did the export surface support the workspace, or compete with it?

- **Baseline:** Competes. The "Quick Export" section with two action buttons turns the review panel into an export launcher. It imports `@tauri-apps/api/core` and `@tauri-apps/plugin-dialog`, calls `invoke('export_sprite_sheet')` directly. This duplicates the Export mode's purpose and creates a second path to export.
- **Constrained:** Supports. One "Go to Export" button navigates to the Export mode. The panel provides information; Export mode handles the action. Clear separation of concerns.

### Is preview vs commit still explicit?

- **Baseline:** Blurred. The panel simultaneously reviews readiness AND executes exports. The "Quick Export" buttons commit an irreversible file-write action from what feels like a review surface. No "preview only" language.
- **Constrained:** Explicit. Header states "Preview only — no changes applied." The only action navigates away to the dedicated export mode.

### Would a reviewer trust the constrained result more?

**Yes.** The constrained run:
- Respects mode boundaries (edit mode shows info, export mode handles action)
- Uses the token system completely (0 violations vs 9)
- Maintains budgets (2 actions vs 3)
- Avoids the stat-tile pattern
- Makes preview/commit semantics explicit in copy

---

## Structural Comparison

| Dimension | Baseline | Constrained |
|-----------|----------|-------------|
| Component size | 514 lines | 323 lines |
| CSS size | 287 lines | 249 lines |
| Stores consumed | 6 (spriteEditor, layer, timeline, slice, project, export) | 1 (spriteEditor) |
| External imports | 3 (@tauri-apps/api, dialog, domain types) | 0 (only @glyphstudio/state) |
| Mutations | Writes to exportStore.setReadiness + triggers file saves | None (read-only) |
| UI pattern | Dashboard grid + sectioned checks + quick-export actions | Property list + layer inventory + checks + navigate button |
| Readiness checks | 12 checks, always-computed | 7 checks, on-demand (Run Checks button) |
| Mode integration | Registered in edit AND export mode tabs | Registered in edit mode only (overflow) |

---

## Verdict

**The pack materially improved the output.**

The baseline run produced a competent panel but drifted in three predictable ways:
1. **Token bypass** — 9 raw color literals including rgba() for status backgrounds and #fff/#000 for indicator text
2. **Dashboard creep** — 2x2 stat grid with centered metrics (canvas, frames, layers, slices)
3. **Action creep** — "Quick Export" section with two export buttons turning a review panel into an export launcher, blurring the preview/commit boundary

The constrained run avoided all three drift patterns. It produced a simpler, more focused panel that stays within its role (inform, don't act), uses the token system completely, and respects the workspace mode structure.

### Scores

| Category | Baseline | Constrained |
|----------|----------|-------------|
| Token violations | 9 | 0 |
| Forbidden pattern hits | 1 (dashboard grid) | 0 |
| Budget breaches | 1 (3 primary actions) | 0 |
| Golden failures | 0 | 0 |
| Copy violations | 0 | 0 |
| Preview/commit clarity | Blurred | Explicit |
| **Total violations** | **11** | **0** |

**Classification: Strong catch.** The taste pack prevented exactly the kind of drift it was designed to catch.
