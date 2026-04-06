# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.6] - 2026-03-25

### Added
- `--version` / `-V` flag — outputs `consensusos <version>` from package.json
- Version in help output — help now shows version and `--version` flag docs
- 4 new CLI tests (353 total)

## [1.0.5] - 2026-02-27

### Added
- SHIP_GATE.md quality gates (all hard gates pass)
- SCORECARD.md with pre/post remediation scores
- Security & Data Scope section in README

### Changed
- Patch bump from v1.0.4 to v1.0.5

## [1.0.0] - 2026-02-14

### Added

- Plugin-based control plane with shared event bus
- Frozen Plugin API v1
- Fail-closed invariant engine
- Deterministic replay from event history
- Resource-bounded execution via tokens
- Health Sentinel, Release Verifier, Config Guardian modules
- Sandbox engine with replay and amendments
- Governor with token-based execution, policy enforcement, build queue
- Chain adapters: XRPL, Ethereum, Cosmos
- 295 tests (architecture, security, stress, unit)
- Docker and npm publish workflows
- llms.txt for AI agent context

[Unreleased]: https://github.com/mcp-tool-shop-org/ConsensusOS/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/mcp-tool-shop-org/ConsensusOS/releases/tag/v1.0.0
