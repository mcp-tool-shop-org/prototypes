# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.1] - 2026-03-25

### Added
- `--version` / `-V` flag to print version and exit
- `--help` / `-h` flag with usage documentation
- `--diagnose` command with environment health checks (Node version, config, UE5 ping, knowledge library)
- `--diagnose --json` for machine-readable diagnostic output
- 6 CLI tests (29 total)

### Fixed
- Server version was hardcoded at 0.2.0 instead of reading from package.json

## [1.0.0] - 2026-02-27

### Added
- Shipcheck compliance: SECURITY.md, CHANGELOG.md, SHIP_GATE.md, SCORECARD.md
- Security & Data Scope section in README

### Changed
- Promoted from v0.2.1 to v1.0.0

## [0.2.1]

### Fixed
- Minor bug fixes and stability improvements

## [0.2.0]

### Added
- Unreal Engine 5 Remote Control API integration
- 14 MCP tools for level, actor, property, blueprint operations
- Environment variable configuration (host, port, timeout, log level)
- HANDBOOK.md with full walkthrough

## [0.1.0]

### Added
- Initial release with core MCP server framework

[1.0.1]: https://github.com/mcp-tool-shop-org/game-dev-mcp/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/mcp-tool-shop-org/game-dev-mcp/releases/tag/v1.0.0
