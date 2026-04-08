# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.1] - 2026-03-25

### Added

- 4 version consistency tests (semver, >= 1.0.0, CHANGELOG, version command)
- CI workflow (pytest on push/PR)
- SHA-pinned GitHub Actions in pages workflow

## [1.0.0] - 2026-02-27

### Overview

**First stable release.** MCP server health and security testing toolkit.

### Added

- Shipcheck audit — SHIP_GATE.md, SCORECARD.md, SECURITY.md
- Security & Data Scope section in README

### Changed

- CLI version promoted from 0.1.0 to 1.0.0

## [0.1.0] - 2026-02-15

### Added

- StressKit CLI engine with load testing, security scanning, and compliance checks
- Profile system (mcp-core, security, performance, stability, compliance)
- Target configuration with schema validation
- JSON report generation with provenance
- Evidence generation for MCP server readiness
