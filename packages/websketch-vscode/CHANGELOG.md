# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.2] — 2026-03-25

### Added

- 5 version consistency tests (semver, >= 1.0.0, CHANGELOG, publisher, engine)
- SHA-pinned GitHub Actions in all 3 workflows

## [1.0.1] — 2026-03-05

### Changed

- Bumped to v1.0.1, republished to VS Code Marketplace

## [1.0.0] — 2026-02-27

### Added

- Verify script: test + typecheck + build + VSIX package
- Dependency audit job in CI
- Test step + Codecov upload in CI
- Codecov badge in README
- Threat model paragraph in README (Security & Data Scope)
- Shipcheck compliance: SHIP_GATE.md, SCORECARD.md, SECURITY.md

### Changed

- Bumped to v1.0.0 — production-stable
- SECURITY.md filled with real data scope
- CI separated from pages deploy

## [0.2.4] — 2026-02-26

### Added

- Landing page via @mcptoolshop/site-theme
- 7 translations (ja, zh, es, fr, hi, it, pt-BR)
- Brand logo in README

## [0.2.0] — 2026-02-24

### Added

- Four views: LLM tree, ASCII wireframe, collapsible tree, JSON
- Copy LLM Tree to Clipboard command
- Export commands (JSON, ASCII, LLM)
- CI with typecheck + build

## [0.1.0] — 2026-02-22

### Added

- Initial release
- Capture URL command with puppeteer-core
- 23-role semantic grammar
- 5-tier element classifier
- Settings: chromePath, viewport, timeout, waitAfterLoad
