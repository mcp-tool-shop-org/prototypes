# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.4] - 2026-03-25

### Fixed
- MAUI host `ApplicationDisplayVersion` synced to match library versions (was `0.1.0`)

### Added
- Version consistency tests: 3 tests verify all csproj versions match, MAUI host matches, and CHANGELOG references current version

## [1.1.3] - 2026-02-27

### Changed
- Added SHIP_GATE.md, SCORECARD.md for product standards compliance
- Added Security & Data Scope section to README
- Added SECURITY.md with full fields

## [1.1.2] - 2026-02-14

### Added
- Deterministic 60Hz fixed-timestep simulation engine
- Composable blueprint mutators (NarrowMargin, RhythmLock, etc.)
- xorshift32 RNG with FNV-1a 64-bit run identity
- Replay recording and verification (`.mtr` binary format)
- Deterministic audio cue system
- Four modular assemblies with enforced one-way dependencies
- NuGet packages: MouseTrainer.Domain, MouseTrainer.Simulation, MouseTrainer.Audio
