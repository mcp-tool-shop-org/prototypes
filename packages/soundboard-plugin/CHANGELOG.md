# Changelog

## 1.1.3 — 2026-03-25

### Fixed
- Version alignment between `__init__.py` (was 1.0.0) and `pyproject.toml`

### Added
- Version alignment test suite (3 tests)

### Changed
- SHA-pin all CI workflow actions (checkout, setup-python, codecov, docker/login, docker/metadata, docker/build-push, setup-node, upload-pages-artifact, deploy-pages) for supply chain security

## 1.1.2 — 2026-02-27

### Improvements

- Added CI workflow with lint, test coverage, and dependency audit
- Added Codecov integration for coverage tracking
- Added Makefile with `verify` target (lint + test + audit)
- Added SHIP_GATE.md and SCORECARD.md for product standards
- Added pytest-cov and ruff to dev dependencies
- Updated README with coverage badge, scorecard, and Security & Data Scope section

## 1.0.0 — 2026-02-12

Initial release.

### Features

- **Stdio MCP bridge** wrapping voice-soundboard engine tools
- **5 slash commands**: `/soundboard:speak`, `/soundboard:narrate`,
  `/soundboard:notify`, `/soundboard:voices`, `/soundboard:voice-status`
- **Code narration** with adaptive pacing via `voice.narrate` tool
- **Workflow notifications** with context-aware emotion via `voice.workflow_notify` tool
- **PostToolUse hook** for automatic build/test result announcements
- **Graceful degradation** when voice engine is unavailable
- Delegates to all 5 existing voice-soundboard MCP tools:
  `voice.speak`, `voice.stream`, `voice.interrupt`, `voice.list_voices`, `voice.status`
