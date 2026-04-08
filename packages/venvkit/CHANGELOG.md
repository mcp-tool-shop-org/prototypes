# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-02-27

### Added
- SECURITY.md with real data scope (Python subprocess spawning, file scanning)
- README threat model paragraph (Security & Data Scope section)
- `verify` script for one-command test + typecheck + build + pack check
- `engines.node` field (>=18) in package.json
- SHIP_GATE.md and SCORECARD.md (Shipcheck compliance)

### Changed
- Bumped to 1.0.0 — production ready

## [0.2.5] - 2026-02-26

### Added
- Codecov coverage integration in CI
- Dependency review action for PRs

## [0.2.0] - 2026-02-20

### Added
- `venvkit-map` CLI with `--root`, `--httpsProbe`, `--output` flags
- mapRender with Mermaid, HTML, and JSON graph outputs
- runLog and taskCluster modules for execution history tracking
- Interactive HTML viewer for ecosystem maps

## [0.1.0] - 2026-02-15

### Added
- Initial release
- doctorLite — fast health check for Python interpreters
- scanEnvPaths — discover Python environments on disk
- 19 finding codes covering SSL, DLL, ABI, pip, and path issues
- Vitest test suite with coverage thresholds (80%)
