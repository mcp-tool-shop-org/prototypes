# Changelog

All notable changes to Witness are documented here.

## [1.0.1] — 2026-03-25

### Added
- 4 version consistency tests (semver, >= 1.0.0, CHANGELOG, LICENSE)

### Security
- SHA-pinned all GitHub Actions across ci.yml, pages.yml, publish.yml

## [1.0.0] — 2026-02-27

### Changed
- Promoted to v1.0.0 — production-ready release
- Added SHIP_GATE.md, SCORECARD.md
- Added Security & Data Scope and Scorecard to README
- Updated SECURITY.md supported versions

## [Unreleased]

### Added
- Internal spike for Track 2B pipeline composition (not public API)
- Public API snapshot test to prevent accidental surface area expansion

## [0.1.0] — 2026-01-30

### Phase 1 Complete
- Canonical JSON serialization (sorted keys, no whitespace, UTF-8)
- Ed25519 signatures over canonical bytes
- SHA-256 digests with `sha256:` prefix
- Append-only SQLite storage with triggers preventing UPDATE/DELETE
- Timeline analysis with 4 flags:
  - `CONTINUITY_BROKEN`
  - `TEMPORAL_ANOMALY_AFTER_ROTATION`
  - `KEY_REACTIVATION`
  - `ROTATION_ACTOR_TYPE_UNEXPECTED`
- CLI: `init`, `record`, `inspect`, `verify`, `export`, `rotate-key`, `testify`
- Golden fixture-driven development
- 87 core tests

### Phase 2A: Testimony as First-Class Artifact
- Deterministic `--generated-at` timestamp override
- `--emit-artifact DIR` creates json + md + manifest
- `--include-events` embeds exact store bytes as Base64
- Stable Markdown headings: Scope, Summary, Key Summary, Timeline, Findings, Citations
- CITE lines for grep-able verification
- JSON schema: `schemas/testimony.schema.v0.1.json`
- Manifest includes SHA-256 digests and file sizes
- Privacy note in VERIFICATION.md
- 124 total tests

### Documentation
- CONTRACT.md — normative vs example
- IMPLEMENTATION_NOTES.md — locked invariants
- VERIFICATION.md — crypto rules and worked examples
- RFC for Phase 2 pipelines (Track B paused)
- ADR-0003: Testimony pipeline deferral

---

## Version History

| Version | Date | Milestone |
|---------|------|-----------|
| 0.1.0 | 2026-01-30 | Phase 1 + Phase 2A complete |
