# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-02-27

### Added
- SECURITY.md with vulnerability reporting and data scope
- SHIP_GATE.md quality gates (all hard gates pass)
- SCORECARD.md with pre/post remediation scores
- Security & Data Scope section in README
- `verify` script in package.json
- CHANGELOG.md to npm package files

### Changed
- Promoted from v0.1.1 to v1.0.0 (stable release)

## [0.1.1] - 2026-02-23

### Fixed
- CI workflow configuration
- Landing page deployment

### Added
- Translations (7 languages) via polyglot-mcp
- Landing page using @mcptoolshop/site-theme

## [0.1.0] - 2026-02-20

### Added
- Initial release
- 7 MCP tools: decision, snapshot, resume, timeline_event, query, pulse, forget
- 4 Claude Code skills: resume, snapshot, decisions, pulse
- 4 PostToolUse hooks for auto-timeline (Bash, Write, Edit, TodoWrite)
- Pattern detection (repeated failure, file churn, long session)
- 4 MCP resources for live dashboards
- Local JSON store with project-local and global fallback
