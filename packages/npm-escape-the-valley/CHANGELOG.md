# Changelog

All notable changes to the npm wrapper for Escape the Valley.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [1.0.3] — 2026-03-25

### Added

- `--version` / `-V` flag on CLI (prints wrapper version)
- 5 version consistency tests (semver, >= 1.0.0, CHANGELOG, --version, -V)

### Fixed

- CI now runs `npm test` instead of just a require check
- CI paths now include `test/**` so test changes trigger builds

## [1.0.2] — 2026-03-18

### Added

- Security remediation: lockfile, CI workflow, SECURITY.md, dependabot config
- Starlight handbook (docs site)

### Changed

- Bump for translated README availability (7 languages)

## [1.0.1] — 2026-03-09

### Added

- 7-language README translations (es, fr, hi, it, ja, pt-BR, zh)
- Landing page with site-theme + amber accent

## [1.0.0] — 2026-03-04

### Added

- Initial release — zero-prerequisite npx launcher for escape-the-valley
- Downloads platform binary (Linux x64, macOS ARM64, Windows x64) on first run
- SHA256 checksum verification
- Local caching in `~/.cache/mcptoolshop/`
- Full CLI arg passthrough to Python binary
