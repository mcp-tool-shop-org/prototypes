# World Forge Trial #1 — Entity Inspector

**Date:** 2026-04-02
**Task:** Add an entity inspector panel (selected entity details, zone context, connections, validation)
**Type:** Paired trial (baseline vs constrained)

---

## Compiler-Side Scoring

### Token Bypass (TOK-001)

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| Raw color violations | **81** | **0** |
| Files with violations | 1 (EntityInspector.tsx) | 0 |

**Baseline violations (all inline CSSProperties in EntityInspector.tsx):**

The baseline defines ALL colors as raw hex/rgba literals in inline style objects. Major categories:

| Category | Count | Examples |
|----------|-------|---------|
| ROLE_COLORS constant | 6 | `#58a6ff`, `#f85149`, `#d29922`, `#3fb950`, `#bc8cff`, `#ff7b72` |
| SeverityBadge colors | 9 | `rgba(248, 81, 73, 0.15)`, `#f85149`, `#d29922` |
| Background/border literals | 18 | `#161b22`, `#30363d`, `#1c2128`, `#0d1117`, `#21262d` |
| Text color literals | 22 | `#8b949e`, `#c9d1d9`, `#6e7681`, `#fff` |
| Semantic color literals | 8 | `#238636`, `#da3633`, `#58a6ff` |
| Issue tint rgba values | 6 | `rgba(248, 81, 73, 0.08)`, `rgba(210, 153, 34, 0.08)` |
| Action button colors | 12 | repeated `#21262d`, `#30363d`, `#c9d1d9`, `#f85149` |

**Constrained approach:** All colors use `var(--wf-*)` tokens. Severity tints use `color-mix(in srgb, var(--wf-danger) 8%, transparent)`. Imports and uses `styles.ts` primitives (`inspectorShell`, `sectionHeader`, `badgePill`, `cardItem`, `hintText`).

**Key insight:** Inline-styles architecture (CSSProperties objects) is **far more vulnerable** to token bypass than CSS-file architecture. There is no `:root` block to signal "these are definitions" — every color is a string literal in JavaScript. GlyphStudio had 9 violations in CSS; CommandUI had 6 in CSS; World Forge has 81 in inline styles, all from the same fundamental failure.

### Forbidden Patterns

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| fp-dashboard-metrics | **Yes** — 3-card stat row (Zone Entities / Connections / Issues) | **No** |
| fp-styles-ts-raw | **Yes** — entire component ignores styles.ts primitives | **No** — imports 5 primitives |
| fp-token-bypass | **Yes** — 81 raw literals | **No** |

The baseline hit 2 of 3 forbidden patterns. The constrained hit none.

### Budget Breaches

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| Distinct actions | **6** (edit name, change role, edit position, duplicate, select zone, delete) | **1** (select parent zone — navigation only) |
| Primary mutations | **5** (name, role, position, duplicate, delete) | **0** |
| Max budget | 2 | 2 |
| Budget breached? | **Yes** — 5 mutation actions vs 2 budget | **No** |

### Copy/Language

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| Autonomy overclaiming | None detected | None detected |
| Language tone | Neutral/technical | Uses "inspect", "diagnose" per read-only framing |

### Golden Flows

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| "Create and Export" golden | Intact | Intact |
| "Zone to Entity" golden | **Weakened** — inspector becomes alternate editing surface for entities | Intact |

The baseline's inline editing (name, position, role reassignment, duplicate, delete) creates a competing entity-editing surface alongside the existing EntityProperties panel and canvas. This weakens the "Zone to Entity" flow where entity placement and properties are meant to flow through the canvas → properties panel path.

---

## Human-Side Scoring

### Does the canvas stay central?

- **Baseline:** Weakened. The inspector contains name editing, position editing (number inputs), role reassignment, duplication, and deletion — all spatial/structural operations that should happen on or through the canvas. A user could manage entities entirely from the inspector without touching the canvas.
- **Constrained:** Yes. Inspector is read-only. The only action navigates the user back to the canvas (select parent zone). Editing stays in the established surfaces (EntityProperties, canvas).

### Is the inspector serving the canvas?

- **Baseline:** No — it is a competing editing surface. It consumes `updateEntity`, `removeEntity`, and `addEntity` from the project store. It manages its own edit states (`editingName`, `showConfirmDelete`, `selectedRole`).
- **Constrained:** Yes. It consumes `project` read-only. The only store method used is `setSelection` (canvas navigation).

### Does it respect the existing panel hierarchy?

- **Baseline:** No. World Forge already has `EntityProperties.tsx` for entity role filtering and listing. The baseline inspector duplicates role display and adds editing that belongs in the properties panel. It also introduces a delete flow that conflicts with the existing selection-based delete (`removeSelected`).
- **Constrained:** Yes. Shows context only. Editing stays in EntityProperties. Delete stays in the selection toolbar.

### Are style primitives reused?

- **Baseline:** No. Zero imports from `styles.ts`. All styles are fresh inline CSSProperties objects. This means the inspector will drift from the rest of the UI if theme tokens change, because it hardcodes the current dark theme values rather than referencing tokens.
- **Constrained:** Yes. Imports `inspectorShell`, `sectionHeader`, `badgePill`, `cardItem`, `hintText` from styles.ts. Remaining styles all reference `var(--wf-*)` tokens.

### Would a reviewer trust the constrained result more?

**Strongly yes.** This is the most dramatic difference of the three trials. The baseline is a fully self-contained editing panel that:
- Bypasses the token system entirely (81 raw colors)
- Duplicates editing surfaces that already exist
- Creates 5 mutation actions in a panel budgeted for 2
- Includes a stat dashboard in an authoring tool
- Ignores the `styles.ts` primitive library completely

The constrained version is a focused, read-only context display that serves the canvas.

---

## Structural Comparison

| Dimension | Baseline | Constrained |
|-----------|----------|-------------|
| Lines | 730 | 275 |
| Stores consumed | 2 (project + editor), 3 mutation methods | 2, read-only (project) + 1 navigation method |
| Sub-components | 2 inline (`StatCard`, `SeverityBadge`) | 1 inline (`PropRow`) |
| Local state | 4 (`editingName`, `nameValue`, `showConfirmDelete`, `selectedRole`) | 1 (`expanded`) |
| Actions / mutations | 6 / 5 | 1 / 0 |
| styles.ts imports | 0 | 5 (`inspectorShell`, `sectionHeader`, `badgePill`, `cardItem`, `hintText`) |
| Raw color literals | 81 | 0 |
| Severity tint technique | Raw rgba values | `color-mix()` with CSS variables |
| Dashboard elements | 3-card stat row | None |

---

## Verdict

**The pack produced a fundamentally different — and clearly better — output. This is the strongest catch of the three trials.**

The baseline drifted in every category the pack was designed to prevent:

1. **Token bypass at scale** — 81 raw color literals. The inline-styles architecture amplifies this: without CSS variables as a natural gravity well, every color decision defaults to a hex literal. The constrained run used `var(--wf-*)` for everything and `color-mix()` for tints.

2. **Dashboard creep** — The `StatCard` row (zone entities / connections / issues) is a KPI dashboard. World Forge is an authoring tool; its validation panel already surfaces issues. The constrained run omitted it.

3. **styles.ts bypass** — The baseline imported zero primitives from `styles.ts`, reinventing every layout pattern inline. The constrained run imported 5 existing primitives.

4. **Action-budget explosion** — 5 mutations in a 2-action budget. The inspector became an alternate editing surface competing with EntityProperties and the canvas. The constrained run stayed read-only with one navigation action.

5. **Spatial-first erosion** — The baseline's inline editing (name, position, role, duplicate, delete) lets users manage entities without touching the canvas. This erodes World Forge's core principle: the canvas is primary, panels serve it. The constrained run explicitly deferred all editing to the existing surfaces.

### Scores

| Category | Baseline | Constrained |
|----------|----------|-------------|
| Token violations | 81 | 0 |
| Forbidden pattern hits | 2 (dashboard + styles.ts bypass) | 0 |
| Budget breaches | 1 (5 mutations vs 2 budget) | 0 |
| Golden failures | 1 (zone-to-entity weakened) | 0 |
| Copy violations | 0 | 0 |
| **Total violations** | **85** | **0** |

**Classification: Strong catch — strongest of the three trials.** The inline-styles architecture makes World Forge the most drift-vulnerable of the three pilot repos. The pack didn't just prevent cosmetic violations — it prevented a structural mistake (inspector-as-editor) that would have created a competing surface hierarchy.

---

## Cross-Trial Summary

| Trial | Baseline | Constrained | Classification |
|-------|----------|-------------|----------------|
| GlyphStudio (Export Readiness) | 11 | 0 | Strong catch |
| CommandUI (Command Guidance) | 7 | 0 | Moderate catch |
| **World Forge (Entity Inspector)** | **85** | **0** | **Strong catch (strongest)** |
| **Total across 3 trials** | **103** | **0** | |

The pattern is consistent: every trial shows zero constrained violations against a non-zero baseline. The magnitude of improvement correlates with architecture vulnerability — inline-styles (World Forge) drift harder than CSS-file architectures (GlyphStudio, CommandUI).
