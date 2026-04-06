# Changelog

## 1.0.1 — 2026-03-25

### Fixed
- SHA-pin CI workflow actions (checkout, setup-node, upload-artifact, pages actions) for supply chain security

### Added
- Version alignment test suite (4 tests, added by prior audit)

## 1.0.0 — 2026-02-27

### Changed
- Promoted to v1.0.0 — production-ready release
- Added SECURITY.md, SHIP_GATE.md, SCORECARD.md
- Added Security & Data Scope and Scorecard to README

## 0.2.0

- **feat**: Configurable limits via Settings (maxDepth, maxNodes, maxStringLength)
- **feat**: Options page (`chrome.storage.sync`)
- **feat**: Warning banner in popup when capture is truncated
- **feat**: `schemaVersion` in capture metadata
- **docs**: Getting Started workflow, configurable limits in features
- **docs**: CHANGELOG.md
- **chore**: Bump websketch-ir to ^0.3.0

## 0.1.0

- Initial release
- One-click page capture with clipboard copy
- DOM tree capture with styles and bounds
- Depth and node count limits from websketch-ir defaults
