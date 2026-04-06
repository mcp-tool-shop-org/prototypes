# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-03-25

### Added

- `validate-schemas` command — validates all JSON schemas in spec/schemas/ are well-formed
- `self-test` command — runs all built-in validation checks (schemas, vectors, catalog)
- Promoted to v1.0.0 stable release

### Changed

- SPEC_VERSION bumped from 0.1.0 to 1.0.0

## [0.1.1] - 2026-02-23

### Fixed
- Repository URLs pointing to wrong GitHub org throughout documentation
- Schema identifier in SETUP.md (`mcp-tool-shop/prov-capabilities@v0.1` → `prov-capabilities@v0.1`)
- Clone URL in README (`prov-spec/prov-spec` → `mcp-tool-shop-org/prov-spec`)
- Mypy type errors in validator (6 `Optional[str]` narrowing issues)

### Added
- CI: ruff lint and mypy type checking steps
- CI: paths filters, concurrency group, `workflow_dispatch` fallback
- Ruff configuration (`ruff.toml`) with expanded rule set

### Changed
- Modernized type annotations in validator (`Dict` → `dict`, `List` → `list`, etc.)
- CI: reduced Python matrix from 4 to 2 versions (3.10 + 3.12)

## [0.1.0] - 2025-01

### Added

- **PROV_METHODS_SPEC.md** — Normative specification for provenance method IDs
  - Method ID grammar (ABNF + regex)
  - Semantic contracts for all namespaces
  - Canonicalization rules (JCS-subset)
  - Versioning and compatibility policy
  - Conformance levels

- **Method Catalog** — 19 stable method IDs across 4 namespaces
  - `adapter.*` (5 methods) — envelope wrapping, transport
  - `engine.*` (6 methods) — evidence extraction, provenance construction
  - `integrity.*` (6 methods) — hashing, signatures, verification
  - `lineage.*` (2 methods) — parent linking, graph operations

- **Reserved Namespaces** — 4 namespaces reserved for future use
  - `policy.*`, `attestation.*`, `execution.*`, `audit.*`

- **JSON Schemas**
  - `prov.record.schema.v0.1.json` — Provenance record
  - `artifact.schema.v0.1.json` — Artifact metadata
  - `artifact.ref.schema.v0.1.json` — Artifact references
  - `evidence.schema.v0.1.json` — Evidence anchors
  - `mcp.envelope.schema.v0.1.json` — MCP envelope wrapper
  - `mcp.request.schema.v0.1.json` — MCP request format
  - `prov-capabilities.schema.json` — Capability manifest
  - `methods.schema.json` — Method catalog format

- **Test Vectors**
  - `integrity.digest.sha256` — Digest computation
  - `adapter.wrap.envelope_v0_1` — Envelope wrapping
  - `engine.extract.evidence.json_pointer` — Evidence extraction
  - `method_id_syntax` — Grammar validation
  - Negative vectors for must-fail cases

- **Conformance Levels**
  - Level 1: Integrity
  - Level 2: Engine
  - Level 3: Lineage

- **Reference Tools**
  - Python validator (`prov_validator`)

- **Documentation**
  - CONFORMANCE_LEVELS.md
  - MCP_COMPATIBILITY.md
  - PROV_METHODS_CATALOG.md

### Security

- All method IDs are stable and append-only
- No semantic changes without major version bump
- Canonicalization prevents hash ambiguity

---

## Stability Guarantee

> Method IDs marked `stable` are append-only and will never change semantics.
> Compatibility is guaranteed within a major version.

[Unreleased]: https://github.com/mcp-tool-shop-org/prov-spec/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/mcp-tool-shop-org/prov-spec/compare/v0.1.1...v1.0.0
[0.1.1]: https://github.com/mcp-tool-shop-org/prov-spec/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/mcp-tool-shop-org/prov-spec/releases/tag/v0.1.0
