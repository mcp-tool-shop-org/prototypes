# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-03-25

### Added
- `--version` / `-V` flag on CLI
- 3 new tests (68 total)

## [1.0.0] - 2026-02-27

### Added
- Full-featured CLI: `init`, `sync`, `serve`, `compile`, `auth` commands
- MCP server integration (`llm-sync-drive-mcp`)
- Google Drive sync with ADC, Service Account, and OAuth auth modes
- `.gitignore` and `.llmsignore` support for file filtering
- Watchdog-based file monitoring with configurable debounce
- CI pipeline with secret scanning, lint, and tests
- PyPI publish workflow (trusted publishing)
- Starlight handbook and landing page
- 65 tests
