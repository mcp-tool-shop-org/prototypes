# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.4.7] — 2026-03-25

### Added
- `--version` / `-V` flag on wrapper (reads from package.json)

### Changed
- Config version and tag now read dynamically from package.json instead of hardcoded

## [1.4.6] — 2026-03-02

### Added
- `support-bundle` command passthrough for diagnostics zip
- CI workflow with npm audit and config validation tests
- SECURITY.md with threat model
- Landing page and Starlight handbook
- 7 translated READMEs (ja, zh, es, fr, hi, it, pt-BR)

### Changed
- Bumped to match sovereignty v1.4.6

## [1.4.5] — 2026-02-28

### Fixed
- `self-check` fix and XRPL data collection passthrough

## [1.4.4] — 2026-02-27

### Added
- `self-check` and `--print-cache-path` / `--clear-cache` passthrough

## [1.4.3] — 2026-02-26

### Fixed
- PyInstaller fix for rich unicode data in upstream binary

## [1.4.2] — 2026-02-25

### Changed
- Version bump to match sovereignty v1.4.2 release

## [1.0.0] — 2026-02-24

### Added
- Initial npm wrapper for sovereignty
- Zero-prerequisite `npx` install via `@mcptoolshop/npm-launcher`
- SHA256 checksum verification
- Cross-platform support (Linux x64, macOS ARM64/x64, Windows x64)
- Automatic binary caching in `~/.cache/mcptoolshop/sovereignty/`
- Full argument passthrough to sovereignty binary
- Troubleshooting docs with version pinning

[1.4.6]: https://github.com/mcp-tool-shop-org/npm-sovereignty/compare/v1.4.5...v1.4.6
[1.4.5]: https://github.com/mcp-tool-shop-org/npm-sovereignty/compare/v1.4.4...v1.4.5
[1.4.4]: https://github.com/mcp-tool-shop-org/npm-sovereignty/compare/v1.4.3...v1.4.4
[1.4.3]: https://github.com/mcp-tool-shop-org/npm-sovereignty/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/mcp-tool-shop-org/npm-sovereignty/compare/v1.0.0...v1.4.2
[1.0.0]: https://github.com/mcp-tool-shop-org/npm-sovereignty/releases/tag/v1.0.0
