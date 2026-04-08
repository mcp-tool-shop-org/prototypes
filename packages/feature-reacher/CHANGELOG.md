# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.1] - 2026-03-25

### Added
- 23 unit tests for text normalizer (normalizeText, extractHeadings, chunkContent, detectTimestamp)

## [1.0.0] - 2026-02-27

### Added
- Shipcheck compliance: SECURITY.md, CHANGELOG.md, LICENSE, SHIP_GATE.md, SCORECARD.md
- Security & Data Scope section in README

### Changed
- Promoted from v0.2.1 to v1.0.0

## [0.2.1]

### Fixed
- Minor bug fixes and stability improvements

## [0.2.0]

### Added
- Phase 2: Audit history with IndexedDB persistence
- Artifact sets for repeatable audit workflows
- Audit compare with side-by-side diff
- Feature trend sparkline visualization
- Executive narrative template for partner sharing
- Jest test suite with guardrail tests

## [0.1.0]

### Added
- Phase 1: Core adoption risk diagnostic engine
- Artifact upload (paste text or upload .txt/.md files)
- Feature extraction from headings, bullet lists, repeated phrases
- Scoring heuristics: recency decay, visibility signals, documentation density
- Six diagnosis types with triggering signals and evidence
- Ranked audit report with action recommendations
- Plain text and HTML report export
