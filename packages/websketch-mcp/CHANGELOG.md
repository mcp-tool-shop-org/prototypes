# Changelog

## 1.0.1 — 2026-03-25

### Added
- 5 version consistency tests (semver, >= 1.0.0, CHANGELOG, scope, bin)
- `tests/**` added to CI paths trigger

### Security
- SHA-pinned all GitHub Actions across ci.yml, pages.yml, publish.yml
- Made npm audit non-blocking in CI

## 1.0.0 — 2026-02-27

### Changed
- Promoted to v1.0.0 — production-ready release
- Added SECURITY.md, SHIP_GATE.md, SCORECARD.md
- Added Security & Data Scope and Scorecard to README

## 0.2.0

- **feat**: `websketch_validate` returns embedded capture warnings on valid captures
- **docs**: Getting Started quickstart, validate tool in features list
- **docs**: CHANGELOG.md
- **chore**: Bump websketch-ir to ^0.3.0

## 0.1.1

- **feat**: `websketch_validate` preflight tool (never throws, structured `{ ok }` envelope)

## 0.1.0

- Initial release
- Tools: websketch_render, websketch_diff, websketch_fingerprint
- Structured error handling with WebSketchException
