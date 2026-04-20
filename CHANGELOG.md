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
