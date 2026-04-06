# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.4] - 2026-03-25

### Added
- `--version` / `-V` flag on CLI
- Help output now includes flags section

## [1.0.3] - 2026-02-27

### Changed
- Added SHIP_GATE.md, SCORECARD.md for product standards compliance
- Added Security & Data Scope section to README
- Added SECURITY.md with full fields

## [1.0.2] - 2026-02-14

### Added
- NuGet package: DevOpTyper.Content
- Deterministic content pipeline with SHA-256 content addressing
- Language detection for 20+ languages
- Difficulty-aware metrics (symbol density, indent depth, line count)
- Interface-driven architecture (IContentSource, IExtractor, IMetricCalculator, IContentLibrary)
- Smart extraction for practice blocks
- CLI tool for content ingestion
