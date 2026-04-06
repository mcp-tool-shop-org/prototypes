# Changelog

All notable changes to Context Window Manager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2026-03-25

### Added
- CLI flags: `--version` / `-V`, `--diagnose`, `--help` / `-h`
- `--diagnose` prints version, Python info, storage config, vLLM URL, log level
- Unit tests for all CLI flags (9 tests)

### Fixed
- Version mismatch: `__init__.py` now matches `pyproject.toml` (1.0.1)

## [1.0.0] - 2026-02-27

### Added
- SECURITY.md with vulnerability reporting and data scope
- SHIP_GATE.md quality gates (all hard gates pass)
- SCORECARD.md with pre/post remediation scores
- Security & Data Scope section in README

### Changed
- Promoted from v0.6.4 to v1.0.0 (stable release)
- Development Status classifier updated to Production/Stable

## [0.6.2] - 2026-01-24

### Added
- **MCP Server** - Full MCP protocol implementation
  - `window_freeze` - Save context to persistent storage
  - `window_thaw` - Restore context with zero information loss
  - `window_clone` - Branch conversations for exploration
  - `window_list` - Browse available windows
  - `window_status` - Detailed window information
  - `window_delete` - Clean up old windows
  - `session_list` - View active sessions
  - `cache_stats` - KV cache metrics
  - `health_check` - System health
  - `auto_freeze_config` - Automatic context management
  - `auto_freeze_check` - Threshold monitoring
  - `get_metrics_data` - Prometheus/JSON metrics
- **vLLM Integration** - Prefix caching with cache_salt isolation
- **LMCache Support** - Tiered storage (GPU → CPU → Disk → Redis)
- **Auto-Freeze** - Automatic context preservation at thresholds
- **Metrics & Observability** - Prometheus-compatible metrics
- **366 Tests** - Comprehensive test coverage

### Infrastructure
- GitHub Actions CI/CD
- PyPI publishing
- MIT License

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 0.6.2 | 2026-01-24 | Full MCP implementation |

[Unreleased]: https://github.com/mcp-tool-shop/context-window-manager/compare/v0.6.2...HEAD
[0.6.2]: https://github.com/mcp-tool-shop/context-window-manager/releases/tag/v0.6.2
