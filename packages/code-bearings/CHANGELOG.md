# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-03-25

### Fixed
- CLI `--version` now reads from `package.json` dynamically instead of hardcoded value
- Added `coverage/` to `.gitignore`

## [1.0.0] - 2026-03-25

### Added

- **Core** (`@code-bearings/core`): Shared product logic — extraction, graph, review, rendering, cursor context
  - TypeScript/JavaScript indexer via ts-morph (files, symbols, edges, modules)
  - Module boundary detection (barrel, directory, namespace, file)
  - Module cards, function cards, system maps
  - Change briefs from git diffs with risk scoring, symbol explanations, reviewer tips
  - Five purpose modes (general, bug-hunter, learning, architecture, exploration) as lenses over canonical truth
  - HTML, Markdown, compact, and JSON output formats
  - SVG dependency graphs
  - Cursor context resolver for editor integration

- **CLI** (`@code-bearings/cli`): Thin command-line interface
  - `code-bearings analyze` — index a TypeScript project
  - `code-bearings module <name>` — show module card
  - `code-bearings function <name>` — show function card
  - `code-bearings review [target]` — generate change brief from git diff
  - `code-bearings compare [base] [head]` — compare branches
  - `code-bearings overview` — system map
  - `code-bearings modules` — list all modules
  - `code-bearings ci` — generate review artifacts for CI/CD

- **VS Code Extension** (`@code-bearings/vscode`): In-editor review surface
  - Activity bar with Modules and Review Brief tree views
  - Interactive review panel with postMessage bridge
  - Source jumps from evidence locations
  - Mode switching within the review panel
  - Cursor context: status bar, hover provider, CodeLens, gutter decorations
  - Freshness tracking with stale-state detection and atomic refresh
  - Welcome views for first-run guidance

[1.0.1]: https://github.com/mcp-tool-shop-org/code-bearings/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/mcp-tool-shop-org/code-bearings/releases/tag/v1.0.0
