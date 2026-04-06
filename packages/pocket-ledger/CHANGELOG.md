# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.1] - 2026-03-25

### Added
- CI workflow (.NET build + test, paths-gated, SHA-pinned actions)
- `Diagnostics` class in Infrastructure (runtime, OS, version, assembly checks)
- 3 diagnostics tests in Infrastructure.Tests

### Fixed
- Missing `Microsoft.Extensions.Logging.Console` and `Debug` packages (build failure)

## [1.0.0] - 2026-02-27

### Changed
- Promoted to v1.0.0 — production-stable release
- Added version to Directory.Build.props
- Shipcheck audit pass: SECURITY.md, threat model, structured errors, operator docs

### Added
- SECURITY.md with vulnerability reporting policy
- SHIP_GATE.md quality gate checklist
- SCORECARD.md with pre/post remediation assessment

## [0.1.0] - 2026-02-22

### Added
- Initial project structure with Clean Architecture
- Domain layer (PocketLedger.Domain)
- Application layer (PocketLedger.Application)
- Infrastructure layer (PocketLedger.Infrastructure)
- Landing page and translations
