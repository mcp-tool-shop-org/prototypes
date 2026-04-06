# Changelog

All notable changes to this project are documented here.

## [1.1.1] — 2026-03-25

### Added
- `--version` / `-V` flag — prints wrapper version and exits
- CHANGELOG.md included in npm tarball
- 2 new CLI flag tests (10 total)

### Fixed
- Version test no longer couples wrapper version to upstream binary version

## [1.1.0] — 2026-03-19

### Added
- Auto-resume: `start` picks up where you left off
- Interactive memo prompt in guided flow
- `status` command with rich visual checklist
- Lesson timing tracked in certificate and proof pack
- Beginner-friendly handbook pages (What Is XRPL, FAQ, After Camp)

## [1.0.6] — 2026-03-02

### Added
- `support-bundle` command — write a zip for bug reports
- Canary release support

## [1.0.5] — 2026-03-02

### Fixed
- `self-check` diagnostic improvements
- XRPL-specific data collection for troubleshooting

## [1.0.4] — 2026-03-02

### Added
- `self-check` command — diagnose your environment
- `--print-cache-path` and `--clear-cache` flags

## [1.0.3] — 2026-03-02

### Fixed
- PyInstaller fix for rich unicode rendering

## [1.0.2] — 2026-03-02

### Added
- First live release with prebuilt binaries
- SHA256 checksum verification via npm-launcher
- Cross-platform support: Linux x64, macOS ARM64/x64, Windows x64
- 7 language translations (ja, zh, es, fr, hi, it, pt-BR)
