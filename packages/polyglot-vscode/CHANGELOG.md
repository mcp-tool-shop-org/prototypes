# Changelog

## 1.0.3 — 2026-03-25

### Fixed
- CHANGELOG gap — added missing entries for 1.0.1 and 1.0.2

### Added
- Version alignment test suite (3 tests)

### Changed
- SHA-pin CI workflow actions (checkout, setup-node, codecov) for supply chain security

## 1.0.2 — 2026-03-25

### Changed
- Patch release (details not previously documented)

## 1.0.1 — 2026-03-25

### Changed
- Patch release (details not previously documented)

## 1.0.0 — 2026-02-27

### Added

- Structured error handling with typed error codes (OLLAMA_UNAVAILABLE, MODEL_NOT_FOUND, UNSUPPORTED_LANGUAGE, TRANSLATE_ERROR)
- Verify script: test + build + VSIX package in one command
- Dependency audit job in CI
- Threat model paragraph in README (Security & Data Scope)
- Shipcheck compliance: SHIP_GATE.md, SCORECARD.md

### Changed

- Bumped to v1.0.0 — production-stable
- SECURITY.md updated for 1.0.0 support
- `friendlyError()` now classifies errors into structured ErrorInfo shape with code, message, hint, cause, retryable

## 0.1.3 — 2026-02-27

### Added

- SECURITY.md — vulnerability reporting policy
- Quality scorecard in README and landing page
- Codecov badge and coverage in CI
- Updated translations (7 languages)

### Changed

- Standardized README footer to MCP Tool Shop link
- Landing page footer and version badge updated

## 0.1.2 — 2026-02-24

### Added

- Test suite: 88 tests covering all commands, status bar, status tree, and utilities
- Separated marketplace publish into manual-dispatch-only job

## 0.1.1 — 2026-02-23

### Added

- Publish workflow for VS Code Marketplace (release + manual dispatch)

### Fixed

- Version strings and homepage consistency
- Interval leak in status checking

## 0.1.0 — 2026-02-22

### Added

- Initial release
- Translate Selection, Translate File, Translate README commands
- Sidebar panel with globe icon, Ollama status, action buttons
- Editor title bar and context menu integration
- 55 language support via TranslateGemma 12B + Ollama
- Smart README segmentation (preserves code blocks, badges, URLs)
- Landing page via @mcptoolshop/site-theme
- 7 translations (ja, zh, es, fr, hi, it, pt-BR)
