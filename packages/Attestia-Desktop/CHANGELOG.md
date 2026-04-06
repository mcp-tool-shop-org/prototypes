# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.3] - 2026-03-25

### Added
- `AccountRef.Validate()` — validates Id, Name, and AccountType
- `LedgerEntry.Validate()` — validates all required fields, propagates Money validation
- 26 new tests for AccountRef and LedgerEntry validation

### Fixed
- Version alignment: `Directory.Build.props` now matches CHANGELOG version

## [1.0.1] - 2026-02-27

### Changed

- Promoted assembly version from 0.1.0-alpha to 1.0.0 (aligns with NuGet packages and CHANGELOG)
- Added SECURITY.md with vulnerability reporting process and data scope
- Added SHIP_GATE.md and SCORECARD.md for product standards compliance
- Updated README with Security & Data Scope section and scorecard

## [1.0.0] - 2026-02-14

### Added

- Attestia.Core — Domain models, enums, and shared types for intent verification
- Attestia.Client — HTTP client SDK with typed clients for Intents, Proofs, Reconciliation, Compliance, Events
- Attestia.Sidecar — Node.js process management (spawn, health checks, auto-restart, graceful shutdown)
- Attestia.App — WinUI 3 desktop application (reference UI)
- NuGet package publishing via GitHub Actions
- llms.txt for AI agent context

[Unreleased]: https://github.com/mcp-tool-shop-org/Attestia-Desktop/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/mcp-tool-shop-org/Attestia-Desktop/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/mcp-tool-shop-org/Attestia-Desktop/releases/tag/v1.0.0
