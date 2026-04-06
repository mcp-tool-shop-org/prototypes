# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.1] - 2026-03-25

### Fixed
- Aligned `__version__` with pyproject.toml (was 0.4.1, now matches)

### Added
- `--version` / `-V` flag on CLI
- `diagnose` subcommand with `--json` output for environment health checks
- 3 new CLI tests (version, diagnose text, diagnose JSON)

## [1.0.0] - 2026-02-27

### Added
- Shipcheck compliance: SECURITY.md, CHANGELOG.md, SHIP_GATE.md, SCORECARD.md
- Security & Data Scope section in README

### Changed
- Promoted from v0.3.4 to v1.0.0

## [0.3.4]

### Fixed
- Minor bug fixes and stability improvements

## [0.3.0]

### Added
- Async component engine with event bus
- State machines with SQLite persistence
- Minimal CLI interface
- Observability subscriptions and retention pruning

## [0.1.0]

### Added
- Initial release
