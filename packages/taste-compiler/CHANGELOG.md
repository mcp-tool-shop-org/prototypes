# Changelog

## [1.0.0] — 2026-04-02

First stable release. All 6 artifact classes live-proven, Full Treatment applied.

### Added

- Landing page (site-theme + GitHub Pages)
- Starlight handbook with 6 pages (overview, getting-started, artifact-classes, CLI reference, architecture, security)
- SECURITY.md with threat model and vulnerability reporting
- LICENSE (MIT)
- CI workflow (Node 20+22, pnpm, build + test + CLI smoke)
- `verify.sh` one-command build+test+smoke script
- SHIP_GATE.md with all hard gates (A–D) passing

### Changed

- Version promoted from 0.3.0 to 1.0.0 across all 6 packages
- All packages require `engines.node >= 20`
- README updated with centered logo, CI/MIT/Landing Page badges, and MCP Tool Shop footer
- GitHub repo metadata: description, homepage, topics

## [0.3.0] — 2026-04-02

All 6 artifact classes live-proven. Phase 3 complete.

### Added

- **Interaction-law evaluator** (`packages/check/src/evaluators/law-checker.ts`) — detects LAW-001 through LAW-004 (destructive without confirmation, submit without validation, draft preservation, empty-state CTA)
- **`ExtractedInteraction` type** — guard-based extraction for interaction patterns (`hasConfirmation`, `hasValidationGate`, `hasDraftPreservation`, `hasPrimaryAction`)
- Interaction-law checker wired into `runChecks()` orchestrator — all 6 evaluators now fire in the standard pipeline
- `interactions` field on `ExtractedTarget` — all consumers must provide interaction data
- 12 new interaction-law tests (4 violation, 4 clean-pass, multi-violation, pack-aware skip, severity, all-clean)
- Test doctrine document (`TEST-DOCTRINE.md`) — behavioral fixtures, regression fixture contract, coverage policy
- README with canonical proof section, strongest-3-catches, quick start

### Changed

- Test fixture `makePack()` now includes all 4 default interaction laws (was only 1)
- `runChecks` integration test now asserts LAW-001 alongside the other 5 rule classes
- PILOT-VERDICT.md updated: all hypotheses resolved except OH-4

### Trial results

| Trial | Focus | Baseline | Constrained |
|-------|-------|----------|-------------|
| 7 — CommandUI Session History | Interaction-law isolation | 11 (4 LAW + 7 TOK) | 0 |

**Cumulative:** 7 paired trials, 245 baseline violations → 0 constrained. All 6 artifact classes live-proven.

### Proof status

| Class | Status |
|-------|--------|
| Visual Tokens | Live-proven (7 trials) |
| Component Grammar | Live-proven (3 trials) |
| Interaction Laws | Live-proven (1 isolation trial) |
| Copy Rules | Live-proven (2 copy-stress trials) |
| Complexity Budgets | Live-proven (5 trials) |
| Forbidden Patterns | Live-proven (4 trials) |
| Golden Flows | Live-proven (1 golden-stress trial) |

### Strongest truthful claim

Taste Compiler compiles product taste into enforceable constraints that preserve visual coherence, identity boundaries, copy discipline, complexity limits, workflow invariants, and golden-path truth under AI-generated change. All 6 artifact classes are proven in paired trials on real repositories.

## [0.2.0] — 2026-04-02

Phase 2 pilot complete. Taste Compiler is proven on real repos.

### What is proven

**Token enforcement works at scale.** The CSS-var adapter catches raw color literals in both CSS files and inline CSSProperties objects. Inline-styles architectures are ~10x more vulnerable to token bypass than CSS-file architectures — the adapter catches both.

**Forbidden patterns prevent structural drift.** Dashboard creep, competing editing surfaces, and action-budget breaches were all prevented by pack constraints. These are product-shape catches, not cosmetic ones.

**Budgets prevent action sprawl.** The `maxPrimaryActionsPerScreen` budget caught 5-action panels that should have had 2, and dual-confirmation gates that competed with existing flows.

**Pack-guided generation outperforms unconstrained generation.** Across 3 repos and 3 paired trials, constrained runs (pack + plan-first + diff-first) produced 0 violations against 103 baseline violations. The pack changed the shape of the solutions, not just the styling.

### What is not yet proven

- **Copy rules** — not meaningfully stressed by the pilot task set
- **Interaction laws** — showed indirect effect, not yet cleanly attributable
- **Golden flows** — zero failures in 3 trials (tasks may not have hit golden-sensitive seams)
- **Pack vs workflow isolation** — tested as a bundle, not individually

### Added

- CSS-var token-bypass adapter (`packages/adapters-web/src/cssvar/`) — scans CSS files with `:root`-awareness and TSX/JSX for inline style color literals
- Forbidden pattern seeds in source schema (`forbiddenPatternSeeds` field with auto-derived detection hints)
- Flexible golden flow steps (string or `{route, purpose}` union)
- Baseline snapshot script (`scripts/baseline-snapshot.mjs`) for freezing historical violation debt
- Taste packs for 3 pilot repos: GlyphStudio, CommandUI, World Forge
- Trial artifacts: 3 paired trials with baseline/constrained outputs, manifests, and scored reports
- Pilot verdict document (`trials/PILOT-VERDICT.md`)

### Fixed

- Tailwind scanner no longer double-counts CSS files (CSS-only scanning moved to CSS-var adapter)
- Tailwind scanner skips CSS custom property definitions (`--` prefix)
- CLI `check` command sends status messages to stderr when `--format json`
- Compiler handles string | object union in golden flow steps

### Pilot results

| Repo | Baseline violations | Constrained | Catch type |
|------|-------------------|-------------|------------|
| GlyphStudio | 11 | 0 | Strong (dashboard + action creep + token bypass) |
| CommandUI | 7 | 0 | Moderate (token bypass + budget breach) |
| World Forge | 85 | 0 | Strong (inline-styles + dashboard + editing surface + budget) |

### Strongest truthful claim

Taste Compiler constrains AI-generated product work so it stays inside a product's visual system, identity boundaries, and complexity limits.

## [0.1.0] — 2026-04-01

Initial release. Compiler proof complete.

- 6 packages: core, compiler, check, goldens, adapters-web, cli
- 7 CLI commands: init, validate-source, compile, explain, check, diff, goldens verify
- 5 evaluators: token, grammar, copy, budget, forbidden pattern
- 5 acceptance gates passing (A-E)
- 166 tests
