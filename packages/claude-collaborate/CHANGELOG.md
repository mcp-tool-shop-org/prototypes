# Changelog

All notable changes to Claude Collaborate will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-28

Dogfood Swarm v2 release — 9-phase parallel agent play across health pass
(3 stages), feature pass (P0 + P1), re-audit, and final test pass.
Tests: 35 → 129. All quality gates green.

### Added — Backend
- Session identity: UUID `session_id` per WebSocket connection
- `/api/sessions` endpoint returning active sessions
- `/api/history` non-destructive ring-buffer read with `?limit=N&since_seq=M`
- Reconnection protocol: `resume` message replays missed messages
- `/api/ws/typing` HTTP endpoint for typing indicators
- `/api/ws/stream` HTTP endpoint for chunked streaming responses
- `/api/metrics` endpoint (uptime, counters, buffer size, version)
- Message IDs (UUID) on every message and acknowledgment
- Monotonic sequence numbers on all outbound messages
- WebSocket heartbeat (30s auto-ping, dead client detection)
- Graceful shutdown handler closing all WS connections
- Stale stream cleanup (5-minute TTL)
- False-ack fix: ack only after file write succeeds

### Added — Frontend
- Whiteboard: save/load (localStorage), export PNG, export/import JSON
- Whiteboard: zoom fix (canvas context transform, world-space coords)
- Whiteboard: fill toggle for shapes, select tool with delete
- Chess: save/load (localStorage), export/import PGN, export/import FEN
- Chess: threefold repetition + 50-move rule draw detection
- Code Playground: syntax highlighting (Prism.js, tomorrow-dark theme)
- Code Playground: keyboard shortcuts (Ctrl+Enter run, Ctrl+S save)
- Capture Viewer: real file support (File System Access API + fallback)
- Capture Viewer: clipboard paste capture
- Capture Viewer: basic annotation overlay (red pen)
- Dashboard: session persistence (remembers last environment)
- Dashboard: typing indicator ("Claude is thinking..." with animated dots)
- Dashboard: streaming response display (live chunk rendering)
- Dashboard: environment manifest loading from `environments.json`
- `collaborate-base.css` shared design tokens (~800 lines deduped)
- `<noscript>` fallback on all 8 HTML files
- GitHub Toolkit: localStorage form persistence with debounce

### Added — Infrastructure
- `environments.json` manifest for all environments
- GitHub issue templates (bug report + feature request)
- `requirements.txt` for runtime-only installs
- pip-audit dependency scanning in CI
- Test gate in publish workflow (lint + typecheck + tests before packaging)
- Release tarball now includes CSS, JSON, requirements, translations

### Changed
- Environment variables for both servers (CC_PORT/HOST, WS_BRIDGE_PORT/HOST)
- `--port` CLI flag with dynamic CORS allowlist
- Structured logging in ws_bridge.py (Python `logging` module)
- Concurrent broadcast via `asyncio.gather` (was sequential)
- Content type validation (isinstance str guard on all input paths)
- Error responses standardized to `{"status": "error", "message": "..."}`
- CORS middleware handles error responses (headers on HTTPException)
- Version included in `/health` and `/api/ws/status` responses
- SCORECARD updated to 46/50 (honest error handling score)
- 129 tests (up from 35), including 10 end-to-end integration tests

## [1.0.4] - 2026-03-27

### Security
- Fix directory traversal guard with proper path containment check
- Restrict CORS from wildcard to localhost origin
- Add 1MB message/body size limits to prevent DoS
- Add 50-client WebSocket connection cap
- Mask internal error details in API responses
- Fix XSS vectors: innerHTML replaced with safe DOM APIs across all environments
- Add postMessage source validation in code playground
- Replace Blob URL with data URI to prevent sandbox origin escape
- Remove allow-modals from code playground iframe sandbox
- Add path traversal validation for capture viewer

### Fixed
- Runtime crash from undefined speakInput reference in main UI
- Chess: castling rights now revoked when rook is captured
- Chess: proper move disambiguation (only when ambiguous)
- Chess: check/checkmate notation suffixes (+/#) added
- Chess: undo now uses position snapshots instead of resetting game
- Whiteboard: zoom coordinate compensation for CSS transform
- Whiteboard: eraser strokes recorded for undo support
- Whiteboard: shift-snap endpoints persisted correctly
- WebSocket bridge: malformed JSONL lines skipped instead of aborting batch
- WebSocket bridge: broadcast uses client snapshot to prevent mutation during iteration
- Message file race condition prevented with asyncio lock

### Added
- 22 new tests: server handlers, ws_bridge handlers, security checks (64 total)
- localStorage persistence for code playground editor state
- Exponential backoff WebSocket reconnection (no give-up limit)
- Touch/pointer event support for whiteboard, creative lab
- Keyboard accessibility for environment switcher
- Conversation panel capped at 200 messages
- Particle system capped at 300 with idle animation pause
- CI permissions block, Pages PR validation, release trigger fix

### Changed
- CONTRIBUTING.md corrected: URLs, port, framework name
- CHANGELOG version table updated through v1.0.3
- All timestamps now use UTC

## [1.0.3] - 2026-03-25

### Added
- `--version`/`-V` and `--help`/`-h` CLI flags for `server.py`
- CLI flag tests (4 new tests, 13 total)

### Fixed
- `server.py` now binds to `127.0.0.1` instead of `0.0.0.0` (security: local-first tool)
- SECURITY.md and README data scope corrected — bridge writes JSONL files to disk, not in-memory only

### Changed
- Import ordering fix in `server.py` (ruff I001)

## [1.0.2] - 2026-02-27

### Added
- SECURITY.md with vulnerability reporting and data scope
- SHIP_GATE.md quality gates (all hard gates pass)
- SCORECARD.md with pre/post remediation scores
- Makefile with `verify` target (lint + typecheck + test)
- Security & Data Scope section in README

## [1.0.1] - 2026-02-23

### Fixed
- Return type annotations in `server.py` (`FileResponse` vs `Response` mismatch)
- Unused import (`asyncio`) and f-strings without placeholders in `server.py`
- Unused variable in test file
- Repository URLs pointing to wrong GitHub org

### Added
- CI workflow with ruff lint, mypy type checking, and pytest (Python 3.11 + 3.12)
- Ruff configuration (`ruff.toml`) with expanded rule set
- pytest configuration (`pytest.ini`) for async test mode

### Changed
- Modernized type annotations (`Set` → `set` via `from __future__ import annotations`)
- Updated `softprops/action-gh-release` from v1 to v2 in publish workflow

## [1.0.0] - 2026-01-24

### Added
- **Main Interface** - Environment switcher with unified navigation
- **Whiteboard** - Interactive drawing and brainstorming canvas
- **Code Workshop** - HTML/CSS/JS editor with live preview
- **Chess Workshop** - Strategy and tactics playground
- **Capture Viewer** - Screenshots and recordings viewer
- **GitHub Toolkit** - README and marketing generators
- **Creative Lab** - Interactive experiments
- **Template** - Starter for creating new environments
- **WebSocket Bridge** - Real-time communication with Claude Code
- **aiohttp Server** - Lightweight Python web server

### Infrastructure
- GitHub repository setup
- MIT License

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.1.0 | 2026-03-28 | Dogfood Swarm v2: sessions, history, reconnect, streaming, save/load, syntax highlighting, 129 tests |
| 1.0.4 | 2026-03-27 | Security hardening, XSS fixes, chess/whiteboard fixes, 22 new tests |
| 1.0.3 | 2026-03-25 | CLI flags, security bind fix, data scope correction |
| 1.0.2 | 2026-02-27 | SECURITY.md, SHIP_GATE.md, Makefile, scorecard |
| 1.0.1 | 2026-02-23 | CI, lint fixes, URL corrections |
| 1.0.0 | 2026-01-24 | Initial release |

[1.1.0]: https://github.com/mcp-tool-shop-org/claude-collaborate/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/mcp-tool-shop-org/claude-collaborate/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/mcp-tool-shop-org/claude-collaborate/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/mcp-tool-shop-org/claude-collaborate/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/mcp-tool-shop-org/claude-collaborate/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/mcp-tool-shop-org/claude-collaborate/releases/tag/v1.0.0
