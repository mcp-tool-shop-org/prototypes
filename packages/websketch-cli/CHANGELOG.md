# Changelog

## 1.0.1 — 2026-03-25

### Added

- 5 version consistency tests (semver, >= 1.0.0, CHANGELOG, scope, --version flag)
- SHA-pinned GitHub Actions in all 3 workflows

## 1.0.0 — 2026-02-27

### Changed
- Promoted to v1.0.0 — production-ready release
- Added SECURITY.md, SHIP_GATE.md, SCORECARD.md
- Added Security & Data Scope and Scorecard to README

## 0.4.0 — 2026-02-18

### Added
- HANDBOOK.md — deep-dive guide covering architecture, commands, pipeline patterns, integration, and FAQ

### Changed
- README.md — rewritten with "At a Glance" section, ecosystem links, docs table, standardized badge row

## 0.3.0

- **feat**: `bundle` subcommand -- package captures into shareable `.ws.json` files
- **feat**: Warnings surfaced from captures in `validate` output
- **docs**: Getting Started quickstart block
- **docs**: CHANGELOG.md
- **chore**: Bump websketch-ir to ^0.3.0

## 0.2.1

- **feat**: `--json` global flag for machine-readable pipeline output
- **feat**: `validate` subcommand
- **feat**: `render` and `diff` promoted as first-class command names
- **feat**: Exit codes documented (0=success, 1=validation, 2=filesystem)
- **fix**: CI build order (build before test)

## 0.2.0

- **feat**: Structured error handling with `WebSketchException`
- **feat**: All error codes mapped to exit codes
- **chore**: Bump websketch-ir to ^0.3.0

## 0.1.0

- Initial release
- Commands: render-ascii, fingerprint, diff
