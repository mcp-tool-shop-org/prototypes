# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] — 2026-03-25

### Added
- Version alignment tests (3 new tests)

### Fixed
- SHA-pinned CI actions (checkout, setup-python)
- SECURITY.md supported version widened from "1.0.x" to "1.x"

## [1.1.0] — 2026-03-19

### Added

- **4 new profiles**: `rust_cli` (Cargo.toml), `go_cli` (go.mod), `dotnet_cli` (*.csproj/*.sln), `java_cli` (pom.xml/build.gradle) — each with 5 traversal plans and language-appropriate entrypoint detection
- **Custom role extensions**: profiles can define domain-specific roles with `CustomRole` (name, description, patterns, confidence) — e.g., `project_file` for .csproj, `go_generate` for generated Go files
- **Cross-repo comparison** (`compare` command): cosine similarity on role distributions, Jaccard on filenames/dirs/plans, archetype classification (near_identical / same_archetype / related / different)
- **MCP server**: 5 tools (`build_metadata`, `explain`, `diff_metadata`, `compare_repos`, `validate_index`) via `zip-meta-map serve` or `zip-meta-map-server` — requires optional `[mcp]` dependency
- **Performance benchmarks** (`benchmark` command): phase-by-phase timing (scan, roles, index, front, validate, end-to-end) with per-file throughput metrics and optional incremental cache benchmarks
- **Parallel scanner**: `scan_directory_parallel()` with ThreadPoolExecutor for large repos (100+ files)
- Rust/Go/.NET/Java name-based role recognition (Cargo.toml, go.mod, pom.xml, build.gradle, *.csproj, etc.)
- Glob-based detect_files for profile detection (supports `*.csproj` patterns)
- `custom_roles` field in index output advertising profile-defined roles
- Schema relaxed: role field uses pattern validation instead of strict enum to support custom roles

### Changed

- Profile detection order now checks Rust > Go > .NET > Java > Node/TS > Python (more specific markers first)
- 314 tests (up from ~100), 6 new test files, 4 new fixture directories

## [1.0.0] — 2026-02-27

### Changed
- Promoted to v1.0.0 — production-ready release
- Added SHIP_GATE.md, SCORECARD.md
- Added Security & Data Scope and Scorecard to README
- Updated SECURITY.md supported versions

## [0.2.2] — 2026-02-22

### Fixed

- PyPI metadata refresh and OIDC trusted publisher configuration
- Publish workflow environment setup for secure releases

## [0.2.1] — 2026-02-15

### Fixed

- Version bump for maintenance release

## [0.2.0] — 2026-02-10

### Phase 7: Multi-Profile Fixtures & Consumer Reference

- Multi-profile fixtures for comprehensive test coverage
- Scanner robustness improvements
- Consumer reference documentation and examples
- Action hardening for security

### Phase 6: Ecosystem Glue

- Diff command for comparing archives and metadata
- PR comments integration for automated context injection
- GitHub Actions integration
- Version 0.2.0 stable release

## [0.1.0] — 2026-01-20

### Phase 5: Public Launch Posture

- Public documentation with badges and install story
- Stability promise and commitment
- Comprehensive README

### Phase 4: GitHub-Native Ergonomics

- GitHub-native actions and workflows
- Report generation and formatting
- Repository hygiene improvements

### Phase 3: Packaging & Consumer Hooks

- PyPI packaging and distribution
- Consumer hooks for extensibility
- Capabilities declaration
- Security hardening

### Phase 2: Progressive Disclosure

- Smart chunking for context budgeting
- Module-level organization
- Safety constraints
- Scalability improvements

### Phase 1: Smart Index Foundations

- Confidence scoring for file classification
- Policy overrides and customization
- Explain command for guided navigation

### Phase 0: Specification & Skeleton

- Spec-driven architecture
- Working CLI foundation
- Schema validation
- GitHub Actions setup

## [Unreleased]

_No unreleased changes._

[1.1.0]: https://github.com/mcp-tool-shop-org/zip-meta-map/compare/v1.0.0...v1.1.0
