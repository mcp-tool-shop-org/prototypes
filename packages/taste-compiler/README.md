<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/taste-compiler/readme.png" width="400" alt="Taste Compiler" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/taste-compiler/actions"><img src="https://github.com/mcp-tool-shop-org/taste-compiler/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/taste-compiler/"><img src="https://img.shields.io/badge/Landing_Page-live-brightgreen" alt="Landing Page" /></a>
</p>

Compile product taste into enforceable constraints that preserve visual coherence, identity boundaries, copy discipline, complexity limits, workflow invariants, and golden-path truth under AI-generated change.

## What It Does

AI code generation produces output fast. It does not preserve product identity, UX safety, or design coherence. Taste Compiler closes that gap.

**Input:** A human-authored Taste Source (principles, anti-examples, flows, budgets, forbidden patterns)

**Output:** A compiled Taste Pack — a versioned, machine-readable artifact that constrains AI-generated work

**Enforcement:** 6 evaluators check generated code against the pack and report violations with evidence, rationale, and suggested fixes

## The 6 Artifact Classes

| Class | What it catches | Rule IDs |
|-------|----------------|----------|
| **Visual Tokens** | Raw hex colors, off-scale spacing, unauthorized typography | TOK-001 to TOK-003 |
| **Component Grammar** | Banned components, unknown categories, composition violations | GRAM-001 to GRAM-006 |
| **Interaction Laws** | Destructive actions without confirmation, submit without validation, lost drafts, dead-end empty states | LAW-001 to LAW-004 |
| **Copy Rules** | Banned phrases, tone drift, unqualified claims, reading level | COPY-001 to COPY-004 |
| **Complexity Budgets** | Too many nav items, actions, modal layers, or interaction modes | BUD-001 to BUD-004 |
| **Forbidden Patterns** | Explicitly banned layouts, components, or imports | FP-001 to FP-003 |

Plus **golden flow** contracts that protect critical user paths from silent regression.

## Proof

All 6 artifact classes are live-proven across 7 paired trials on 3 real repositories.

### Trial Results

| Trial | Repo | Focus | Baseline | Constrained |
|-------|------|-------|----------|-------------|
| 1 | GlyphStudio | Export readiness surface | 11 | 0 |
| 2 | CommandUI | Command guidance surface | 7 | 0 |
| 3 | World Forge | Entity inspector panel | 85 | 0 |
| 4 | CommandUI | Error recovery (copy-stress) | 56 | 0 |
| 5 | GlyphStudio | Onboarding tooltips (copy-stress) | 31 | 0 |
| 6 | World Forge | Export diff (golden-stress) | 44 | 0 |
| 7 | CommandUI | Session history (interaction-law) | 11 | 0 |
| **Total** | | | **245** | **0** |

### What the trials proved

**The pack changes what gets built.** Constrained runs produced structurally different solutions — read-only surfaces instead of editing panels, informational advisories instead of action-heavy dashboards. This is not lint behavior. The pack steers product decisions.

**Token bypass is the highest-volume violation.** 96+ raw color literals across baselines. Inline-style architectures are ~10x more vulnerable than CSS-file architectures.

**Forbidden patterns and budgets are the highest-value catches.** Dashboard creep, competing editing surfaces, action-budget breaches, and dual-confirmation gates were all prevented.

**Copy rules catch persona drift.** Autonomy overclaiming ("I'll retry..."), assistant persona in non-chat tools, and marketing voice in creative products were caught by copy rules alone.

**Golden flows catch silent mutations.** A read-only export surface that mutated project state was the highest-severity finding across all trials. Rare but catastrophic.

**Interaction laws catch behavioral failures no other class detects.** In the isolation trial, budgets, forbidden patterns, copy, and goldens all scored 0–0. The 4 interaction-law violations (destructive without confirm, submit without validation, no draft preservation, dead-end empty state) were the only behavioral failures.

### Strongest 3 catches

1. **Silent mutation from read-only surface** (World Forge, Trial 6) — An "Auto-Fix Drift" button in the export preview called `updateZone()`, mutating project state from what should be a read-only context. Golden flow invariant `canvas-not-modified-by-export` caught it. No other rule class would have.

2. **Dashboard creep in a creative tool** (GlyphStudio, Trial 1) — Baseline produced a stat grid with export launcher (2 primary actions). Constrained run produced a read-only review surface with 0 actions. The forbidden pattern `fp-dashboard-metrics` and budget `maxPrimaryActionsPerScreen: 1` together prevented the identity violation.

3. **Destructive action without confirmation** (CommandUI, Trial 7) — "Clear All History" button deleted all sessions in one click with no confirmation dialog. LAW-001 caught it cleanly. The constrained run added two-phase confirmation with cancel. This is the class of bug users remember.

## Quick Start

```bash
# Initialize a taste workspace in your project
npx taste-compiler init

# Author your taste source (YAML files in taste/source/)
# Edit: product.yaml, principles.yaml, anti-examples.yaml, flows.yaml, budgets.yaml

# Compile to a Taste Pack
npx taste-compiler compile

# Check generated code against the pack
npx taste-compiler check --dir src/

# Diff-only mode for PRs
npx taste-compiler diff --base main --dir src/
```

## CLI Commands

| Command | Purpose |
|---------|---------|
| `taste init` | Create starter workspace (source/, pack/, goldens/) |
| `taste validate-source` | Check authoring inputs before compile |
| `taste compile` | TasteSource YAML -> TastePack JSON |
| `taste explain` | Human-readable rationale for every compiled rule |
| `taste check` | Static checks against app artifacts |
| `taste diff` | Changed-files-only checks (PR gate) |
| `taste goldens verify` | Confirm golden flows' routes/invariants are intact |

## Architecture

TypeScript monorepo (pnpm), 6 packages:

```
packages/
  core/           Schemas (zod), types, rule IDs, diagnostics
  compiler/       TasteSource -> TastePack pipeline
  check/          6 evaluators + orchestrator
  goldens/        Golden flow format + baseline validators
  adapters-web/   React/JSX, CSS-var, route, copy scanning
  cli/            7 commands + formatters
```

236 tests across all packages. See [TEST-DOCTRINE.md](TEST-DOCTRINE.md) for coverage policy.

## Status

| Phase | Goal | Status |
|-------|------|--------|
| 1 — Compiler Proof | Compile valid packs, static checks, golden flows | Complete (v0.1.0) |
| 2 — Real Repo Trials | Pressure-test on live AI-generated diffs | Complete (v0.2.0) |
| 3 — Full Proof | Resolve all open hypotheses across 6 classes | Complete (v0.3.0) |
| 4 — External Alpha | Pilot on external repos with external maintainers | Next |

### Open Questions

- **OH-4: Pack vs workflow isolation** — The trials tested a bundle (pack + plan-first + diff-first). How much value comes from the pack alone vs the discipline? This is a positioning question, not a product gap.

## Security

Taste Compiler is a **local-only static analysis tool**. It reads source files and YAML configuration, then produces JSON/Markdown reports.

- **Data touched:** YAML taste source files, compiled JSON taste packs, TSX/JSX/CSS source files (read-only)
- **Data NOT touched:** no network requests, no databases, no user credentials, no runtime state
- **No telemetry** is collected or sent
- **No secrets handling** — does not read, store, or transmit credentials

See [SECURITY.md](SECURITY.md) for the full policy and vulnerability reporting.

## License

MIT

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
