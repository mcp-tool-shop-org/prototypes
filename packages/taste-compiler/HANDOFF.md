# Taste Compiler — Handoff Package

**Version:** 0.2.0
**Date:** 2026-04-02
**Status:** Strong qualified pass — 5 of 6 rule classes proven

---

## What This Is

Taste Compiler compiles subjective design taste into enforceable, testable, versioned artifacts (Taste Packs). Taste Packs constrain AI-generated product work so it stays inside a product's visual system, identity boundaries, and complexity limits.

## Repo

https://github.com/mcp-tool-shop-org/taste-compiler

## Architecture

TypeScript monorepo (pnpm), 6 packages:

| Package | Purpose |
|---------|---------|
| `core` | Schemas (zod), types, diagnostics model |
| `compiler` | TasteSource YAML → TastePack (ingest → normalize → compile → explain) |
| `check` | Static + diff-based violation detection against compiled packs |
| `goldens` | Golden flow format + baseline validators |
| `adapters-web` | React/JSX, Tailwind, CSS-var, route, copy block scanning |
| `cli` | 7 commands: init, validate-source, compile, explain, check, diff, goldens verify |

**182 tests, all passing.**

## What Is Proven

6 paired trials (baseline vs constrained) across 3 repos:

| Trial | Repo | Task | Baseline | Constrained |
|-------|------|------|----------|-------------|
| 1 | GlyphStudio | Export readiness surface | 11 | 0 |
| 2 | CommandUI | Command guidance surface | 7 | 0 |
| 3 | World Forge | Entity inspector panel | 85 | 0 |
| 4 | CommandUI | Failed-command recovery (copy-stress) | 56 | 0 |
| 5 | GlyphStudio | Onboarding tooltips (copy-stress) | 31 | 0 |
| 6 | World Forge | Export preview diff (golden-stress) | 44 | 0 |
| **Total** | | | **234** | **0** |

**5 of 6 rule classes proven:**

| Class | Status | Evidence |
|-------|--------|----------|
| Visual tokens | Proven | All 6 trials — dominant volume (token bypass) |
| Forbidden patterns | Proven | 4 trials — dashboard creep, styles.ts bypass, chatbot-as-shell |
| Complexity budgets | Proven | 5 trials — action-count breaches |
| Copy rules | Proven | 2 copy-stress trials — autonomy overclaiming, persona drift, marketing voice |
| Golden flows | Proven | 1 golden-stress trial — silent mutation from read-only surface |
| Interaction laws | **Not yet proven** | Indirect effects only, needs dedicated trial |

## Key Findings

1. **The pack changes solution shape, not just styling.** Baselines built dashboards, editing surfaces, and chatbot UIs. Constrained runs built read-only inspectors, terse status lines, and canvas-serving panels.

2. **Token bypass is highest-volume.** 196 of 234 baseline violations were raw color literals. Inline-styles architectures (World Forge) are ~10× more vulnerable than CSS-file architectures.

3. **Copy rules catch what tokens cannot.** "I noticed that this command failed" vs "Permission denied" — same component, fundamentally different product identity. Copy violations cluster by product archetype (shell tools: autonomy overclaiming; creative tools: marketing voice).

4. **Goldens are rare but highest-severity.** 2 golden violations in 1 of 6 trials. The silent `updateZone()` mutation from an export preview panel is the most dangerous finding across all trials — it's a data-integrity bug that looks like a feature.

5. **CR-1 shipped.** Token checker now groups consecutive inline-style violations (6-entry constant map = 1 finding, not 6).

## What Is NOT Proven

- **Interaction laws** (OH-2) — showed indirect effects but no clean attribution
- **Pack vs workflow isolation** (OH-4) — tested as bundle (pack + plan-first + diff-first)
- **Pack maintenance burden** — no trial has stressed whether pack upkeep costs exceed review savings
- **Cross-stack robustness** — all 3 repos are React; no Vue/Svelte/Angular evidence

## File Map

```
taste-compiler/
  packages/
    core/           — schemas, types, diagnostics
    compiler/       — YAML → TastePack pipeline
    check/          — evaluators (token, grammar, copy, budget, forbidden)
    goldens/        — golden flow validation
    adapters-web/   — CSS-var scanner, Tailwind scanner, React/JSX extraction
    cli/            — user-facing commands
  examples/
    ritual-app/     — demo taste source + seeded violation app
  trials/
    PILOT-VERDICT.md          — full verdict with promoted truths + open hypotheses
    glyphstudio/              — Phase 2 trial (export readiness)
    commandui/                — Phase 2 trial (command guidance)
    worldforge/               — Phase 2 trial (entity inspector)
    commandui-copy/           — Phase 3 trial (failed-command recovery)
    glyphstudio-copy/         — Phase 3 trial (onboarding tooltips)
    worldforge-golden/        — Phase 3 trial (export preview diff)
  scripts/
    baseline-snapshot.mjs     — per-file violation baseline generator
  CHANGELOG.md
```

## Taste Packs Created (Not Committed to Pilot Repos)

Taste packs were authored in each pilot repo's `taste/source/` directory but not committed to those repos. They exist only in the trial artifacts.

| Repo | Principles | Anti-examples | Flows | Forbidden Patterns | Budgets |
|------|-----------|---------------|-------|-------------------|---------|
| GlyphStudio | 5 | 5 | 2 | 3 | 4 |
| CommandUI | 5 | 4 | 2 | 3 | 4 |
| World Forge | 5 | 4 | 2 | 3 | 4 |

## Next Boundary

The right next step is **not** the 9-trial matrix. It is:

1. **Resolve OH-2** — Run 1 interaction-law trial (World Forge zone template quick-apply or GlyphStudio animation preview with edit controls). This completes 6/6 rule classes.

2. **Ship CR-5** — Automate copy-pattern detection (first-person "I" voice, autonomy claims, hedging qualifiers, emoji in labels). Currently scored by human judgment only.

3. **Then** widen to the 9-trial matrix covering all 6 artifact classes across all 3 repos.

## Strongest Truthful Claim

> Taste Compiler constrains AI-generated product work so it stays inside a product's visual system, identity boundaries, and complexity limits.

Not yet: "fully preserves product soul", "solves coherence", or "proves all six artifact classes equally."

## Git State

```
main @ 1338ddf
v0.2.0 tag @ c46e858
All pushed to origin.
```
