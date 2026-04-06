# Changelog

All notable changes to MCP App Builder will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-03-19

### Added
- **Tool Playground**: Interactive webview panel for connecting to MCP servers, browsing tools, invoking them with auto-generated forms, and reviewing session history
  - Supports stdio and HTTP/SSE transports
  - Auto-generates form fields from tool parameter schemas (string, number, boolean, enum, array, object)
  - Displays tool results with duration timing
  - Session history with replay support
  - New command: `MCP: Tool Playground` (`Ctrl+Alt+P` / `Cmd+Alt+P`)
- 16 new tests for PlaygroundPanel (188 total)

### Fixed
- Publish workflow now passes `--run` flag to vitest (prevents hanging in CI)
- Dependency audit now fails on high/critical vulnerabilities instead of swallowing all
- MCP client version updated from hardcoded `0.2.0` to `1.0.1`
- Stale version references in SHIP_GATE.md and site hero badge
- Upgraded `softprops/action-gh-release` from v1 to v2

## [1.0.0] - 2026-02-27

### Added
- Structured error class (`AppBuilderError`) with code, message, hint, cause, retryable
- SECURITY.md with vulnerability reporting policy
- Threat model section in README (data touched, data NOT touched, permissions)
- `verify` script in package.json (compile + lint + test + build)
- Coverage reporting with `@vitest/coverage-v8` and Codecov
- Dependency audit job in CI
- VSIX packaging verification in CI
- SHIP_GATE.md and SCORECARD.md for product standards tracking

### Changed
- Command error handler now surfaces structured error codes via VS Code notifications
- Promoted to v1.0.0 — all Shipcheck hard gates pass

## [0.2.1] - 2026-02-27

### Added
- Publish workflow for automated VSIX packaging and Marketplace release

## [0.2.0] - 2026-02-26

### Changed
- **Real MCP transport** — Test Server command now connects to actual MCP servers via stdio or HTTP instead of returning simulated responses
- MCPTestClient rewritten to wrap the official `@modelcontextprotocol/sdk` Client
- TestRunner connects, executes real tool calls, and validates real responses

### Fixed
- DiagnosticCollection leak — shared single instance instead of creating one per validation
- OutputChannel leak — test output channel created once and reused
- Dropped promise in MCPConfigProvider constructor
- Webview CSP hardened: nonce-based `style-src` replaces `unsafe-inline`
- Nonce generation uses `crypto.randomBytes` instead of `Math.random`
- Template interpolation sanitized with `sanitizeName()` for defense in depth

### Removed
- Unused `zod-to-json-schema` dependency

### Added
- 55 unit tests across 5 test files (schema validation, type generation, templates, test generator, UI primitives)
- CI now runs tests alongside compile and lint
- `MCPTransportConfig` extended with `command` and `args` fields for stdio servers

## [0.1.1] - 2026-02-23

### Added
- **Keyboard shortcuts** — `Ctrl+Alt+N` for New Server, `Ctrl+Alt+V` for Validate Schema
- **Auto-validate on save** — schemas validated automatically when saving `mcp.json` or `mcp-tools.json` (controlled by `autoValidate` setting)
- Extension icon and marketplace metadata (homepage, bugs URL)
- CI workflow (paths-gated, TypeScript compile + ESLint)
- GitHub Pages landing page
- `.vscodeignore` for lean VSIX packaging

## [0.1.0] - 2026-02-02

### Added

#### Scaffolding
- New Server wizard with interactive prompts
- Three templates: basic, with-ui, full
- Auto-generation of mcp.json, mcp-tools.json, TypeScript sources
- Transport selection (stdio, HTTP)

#### Schema System
- JSON Schemas for mcp.json and mcp-tools.json
- Zod-based runtime validation
- VS Code diagnostic integration
- IntelliSense support for config files

#### Type Generation
- Generate TypeScript types from mcp-tools.json
- Strongly-typed tool input interfaces
- ToolInputMap and ToolName union types
- Type-safe createToolCaller factory

#### UI Components
- 20+ primitive components (text, table, chart, form, etc.)
- Higher-level builders (dashboard, wizard, confirmation, etc.)
- MCP Apps standard compliance (January 2026)
- Event handler support for tool callbacks

#### Testing
- Test harness with output channel
- Auto-generated tests from tool definitions
- Output validation (type, contains, regex, custom)
- Test suite with pass/fail reporting

#### Dashboard
- Webview-based visual interface
- Quick action buttons for all commands
- VS Code theme integration
- Keyboard shortcuts

### Infrastructure
- VS Code extension scaffold
- TypeScript configuration
- MCP SDK integration
- Comprehensive type definitions
