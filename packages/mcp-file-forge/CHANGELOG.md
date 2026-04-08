# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-03-25

### Fixed
- Server version was hardcoded at 0.2.0 — now reads dynamically from package.json

### Added
- `version.ts` module with dynamic VERSION/NAME exports
- 3 version tests (semver, >= 1.0.0, package name)

## [1.0.0] - 2026-02-27

### Changed

- Promoted to v1.0.0 stable release
- Ship Gate compliance (security, docs, identity)

## [0.2.0] - 2026-02-17

### Fixed

- Fixed npm scope name throughout documentation: corrected `@mcp-tool-shop/file-forge` (invalid) to `@mcptoolshop/file-forge` (actual published package name).

### Added

- Comprehensive README with badges, tool reference tables, environment variable reference, config file format, and security overview.
- HANDBOOK.md with full tool parameter documentation, security model deep-dive, template system guide, architecture overview, error code reference, and FAQ.
- CHANGELOG.md (this file).

### Changed

- Bumped version from 0.1.0 to 0.2.0.

## [0.1.0] - 2026-02-12

### Added

- Initial release of MCP File Forge.
- 17 tools across five categories: reading, writing, search, metadata, and scaffolding.
- Sandbox security layer with allowed paths, denied paths, symlink protection, path traversal detection, and size/depth limits.
- Read-only mode via `MCP_FILE_FORGE_READ_ONLY` environment variable.
- Configuration from environment variables, JSON config file (`mcp-file-forge.json`), and built-in defaults.
- Template engine with `{{var}}` / `${var}` content substitution and `__var__` path renaming.
- Built-in `typescript-starter` template.
- Structured error handling with typed error codes.
- Structured logging to stderr (STDIO transport compatible) with optional file output.
- Windows-first path handling with cross-platform support.

[0.2.0]: https://github.com/mcp-tool-shop-org/mcp-file-forge/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/mcp-tool-shop-org/mcp-file-forge/releases/tag/v0.1.0
