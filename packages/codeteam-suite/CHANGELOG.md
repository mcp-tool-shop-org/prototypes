# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.3] - 2026-03-25

### Added
- `codeteam diagnose` command — reports runtime, OS, version, and crypto capability status
- Supports `--json` output for CI integration

### Fixed
- Version fallback in VersionCommand changed from `0.1.0` to `1.0.3`

## [1.0.2] - 2026-02-27

### Added
- SECURITY.md with vulnerability reporting and data scope
- SHIP_GATE.md quality gates (all hard gates pass)
- SCORECARD.md with pre/post remediation scores
- Security & Data Scope section in README

### Changed
- Patch bump from v1.0.1 to v1.0.2

## [1.0.1] - 2026-02-26

### Added
- Landing page using @mcptoolshop/site-theme
- Translations (7 languages) via polyglot-mcp
- NuGet Trusted Publishing via OIDC

## [1.0.0] - 2026-02-25

### Added
- Initial stable release
- .NET CLI for package verification, approval, and signing
- CodeTeam.Core library with Ed25519 + SHA-256 cryptography
- CodeTeam.Crypto with NSec.Cryptography integration
- CodeTeam.Packaging for manifest and schema validation
- Structured exit codes (0-6) for verification outcomes
- Quorum-based approval policy enforcement
- Interop smoke test suite
