# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.1] - 2026-03-25

### Fixed
- MCP server version was hardcoded to `0.1.0` — now reads dynamically from package.json

### Added
- `--version` / `-v` CLI flag
- `aside.stats` tool — usage statistics (accepted, rejected, deduped, rate-limited, empty-text counts)
- 9 new tests (3 version, 6 stats)

## [1.0.0] - 2026-02-27

### Added

- Initial stable release
- 4 MCP tools: aside.push, aside.configure, aside.clear, aside.status
- In-memory interjection inbox with guardrails (TTL, rate-limit, dedupe)
- Resource: interject://inbox
- Timer trigger for periodic check-ins
- Ship Gate compliance (security, docs, identity)

## [0.2.1] - 2026-02-25

### Fixed

- Landing page and translations

## [0.2.0] - 2026-02-20

### Added

- Initial pre-release with inbox and guardrails
