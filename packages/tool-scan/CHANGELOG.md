# Changelog

All notable changes to Tool-Scan will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-03-25

### Fixed
- SHA-pin CI workflow actions (checkout, setup-python, codecov, docker/*, setup-node, upload/download-artifact, pages actions) for supply chain security

### Added
- Version alignment test suite (3 tests)

## [1.1.0] - 2026-03-19

### Added

- **Rule plugin system** (Issue #7): Extension point for custom security rules, compliance checks, and quality validators
  - `SecurityRulePlugin`, `ComplianceRulePlugin`, `QualityRulePlugin` base classes
  - `PluginRegistry` with programmatic registration, entry point discovery, and directory loading
  - `--plugin-dir` CLI flag to load custom rule .py files
  - Plugins integrate seamlessly with SecurityScanner and MCPToolGrader
- **SARIF v2.1.0 output** (Issue #6): `--format sarif` for integration with GitHub Code Scanning, Azure DevOps, VS Code SARIF Viewer
  - Security threats, compliance failures, and quality remarks all mapped to SARIF results
  - Rule deduplication, fix suggestions, and severity mapping
- **JSON output schema** (Issue #4): Formal JSON Schema 2020-12 definition for `--json` output
  - `--output-schema` CLI flag to print the schema
  - Schema bundled as package data (`output_schema.json`)
- **Concurrent scanning** (Issue #5/#6 from punchlist): `--jobs N` for parallel file processing
  - Thread pool executor, deterministic output regardless of concurrency
  - `--jobs 1` matches sequential behavior exactly
- **Compact JSON** (punchlist P1): `--compact-json` flag for minimal JSON output (no indentation)
  - Reduces output size ~50% for large batches
- **Streaming JSON** (punchlist P1): `--stream` flag for incremental JSON writing
  - Reduces peak memory for batches with thousands of tools
  - Periodic flush to avoid buffering

### Changed

- SecurityScanner now accepts `plugin_patterns` parameter for plugin-provided threat patterns
- MCPToolGrader now accepts `plugin_registry` parameter for full plugin integration
- CLI `files` argument is now optional (required only when not using `--output-schema`)
- `--format` flag added (`text`, `json`, `sarif`) as alternative to `--json`

## [1.0.5] - 2026-02-27

### Added
- SHIP_GATE.md and SCORECARD.md (Shipcheck compliance)
- Makefile with `verify` target (test + lint + typecheck + build)
- Dependency audit job in CI workflow (pip-audit)
- pip-audit added to dev dependencies
- Security & Data Scope section in README (replaces Privacy section)

### Changed
- SECURITY.md updated with standard email reporting and expanded data scope
- Scorecard 48/50 → 50/50

## [1.0.4] - 2026-02-27

### Added

- SECURITY.md — vulnerability reporting policy
- Quality scorecard in README and landing page
- Privacy / no-telemetry statement in README
- Updated translations (7 languages)

### Changed

- Landing page footer standardized to MCP Tool Shop link

## [1.0.3] - 2026-02-23

### Changed

- Version bump for landing page deployment

## [1.0.2] - 2026-02-22

### Changed

- Added brand logo, fixed PyPI author metadata

## [1.0.1] - 2026-02-22

### Changed

- CI: added concurrency groups, dependency caching, paths filters
- Normalized README badges to org standard
- Added CITATION.cff for academic attribution
- Added tag-triggered release workflow
- Derived `__version__` from pyproject.toml via importlib.metadata

## [1.0.0] - 2025-01-24

### Added

- Initial release
- Security scanning for MCP tools
  - Prompt injection detection
  - Tool poisoning prevention
  - Command injection detection
  - SQL injection detection
  - XSS detection
  - SSRF detection
  - Path traversal detection
  - Data exfiltration detection
- MCP 2025-11-25 specification compliance checking
- Quality scoring system (1-100 with letter grades A+ to F)
- Actionable remediation remarks
- CLI tool (`tool-scan`) for CI/CD integration
- Python API for programmatic usage
- JSON output format for automation
- Batch scanning support
- Strict mode for security-critical environments

### Security Patterns

- 50+ patterns for prompt injection detection
- 15+ patterns for command injection
- 10+ patterns for SQL injection
- 10+ patterns for XSS
- 8+ patterns for SSRF
- 5+ patterns for path traversal
- Hidden unicode character detection
- Homoglyph attack detection
- Base64/hex encoded content scanning
