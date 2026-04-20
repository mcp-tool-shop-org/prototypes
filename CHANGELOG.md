# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased] — Seed Vault Wave 1

### Added
- Per-seed `passport.json` schema — composes CodeMeta 3.0 core, RO-Crate 1.1 profile,
  MCPD-style lifecycle facets, SBOM reference, Software Heritage SWHID slot, and
  ingest provenance. Source of truth at `schemas/passport.schema.json`.
- Canonical taxonomy at `taxonomy.json` — 13 frozen categories + tag registry to
  prevent drift (`typescript` vs `ts` vs `TypeScript`).
- `scripts/seed-new.mjs` — `pnpm seed:new <slug>` scaffolds a correct-by-construction
  seed folder with passport stub, package.json, and README.
- `scripts/seed-validate.mjs` — `pnpm seed:validate` enforces the schema, taxonomy,
  ID uniqueness, lifecycle invariants, and lineage cross-references.
- `scripts/seed-index.mjs` — `pnpm seed:index` regenerates
  `site/src/data/seeds.json`, a copy of taxonomy for the site, and README category
  tables (between `<!-- GENERATED:seeds-by-category -->` markers).
- `scripts/seed-doctor.mjs` — `pnpm seed:doctor` reports missing passports,
  low-confidence LLM-backfilled entries, TODO one-liners, and broken lineage.
- Astro `/seeds/` faceted browser + per-seed dynamic routes consuming `seeds.json`.
- Paths-gated `seed-validate.yml` CI workflow.

### Changed
- `verify.sh` now runs `pnpm seed:validate` as part of repo verification.
- README `Packages by category` section wrapped with generator markers. Content is
  still hand-maintained until Wave 2 backfill lands.

### Schema tuning (pre-Wave-2, informed by 2026 state-of-the-art research)
- **`patterns[]`** — structured pattern extraction with controlled-vocabulary
  category (from `taxonomy.json:patternCategories`). Replaces the free-prose
  `discovery.patternWorthStealing`. Makes "which seeds touched supply-chain
  tricks?" queryable across the vault.
- **`failureModes[]`** — structured lessons-learned (`tried` / `didntWorkBecause`
  / `pivoted?`). A prototype's most valuable payload is often what broke.
- **`agentCapsule`** — `{insight, excerpt}` — 10-second LLM-optimized summary
  plus a ≤400-char code excerpt of the core trick. Agents pick up the idea
  without parsing source.
- **`priorArt[]`** — papers, blog posts, prior tools that inspired each seed.
- **`health` block** — auto-computed signals split out of `technical`:
  `lineCount`, `lastCommitAt`, `commitRecencyDays`, `hasTests`, `hasReadme`,
  `hasLicense`, `buildable`. Fills at index time from git + filesystem; no
  manual upkeep.
- **`patternCategories`** registry added to `taxonomy.json` (24 canonical
  categories — signal-processing, caching, concurrency, supply-chain, etc.).
- **`/llms.txt`** generated at repo root by `seed:index` — follows the
  Answer.AI emerging spec for LLM-discoverable sites.
- Astro site: per-seed pages render patterns / failure modes / agent capsule /
  prior art / health signals; faceted browser adds "has tests / README /
  LICENSE / fresh ≤90d" filters and searches pattern names + summaries.

### Next
- Wave 2: backfill passports for the 104 existing packages via the Ollama Intern MCP
  (`ollama_extract`, hermes3:8b, JSON-schema-constrained generation). Low-confidence
  entries flagged for manual review.

## [1.0.1] — 2026-03-25

### Added
- Root `verify.sh` script (monorepo structure + per-package hygiene checks)
- `verify` npm script in root package.json

### Changed
- Bumped mcpt-publishing-assets from 0.3.1 to 1.0.0
- Bumped pathway from 0.2.2 to 1.0.0
- Bumped physics-svg from 0.1.1 to 1.0.0

## [1.0.0] — 2026-02-27

### Added
- Initial monorepo consolidation of 10 archived prototypes
- Root SECURITY.md, LICENSE, README
- CI workflow (structure validation only)
- Starlight handbook site
