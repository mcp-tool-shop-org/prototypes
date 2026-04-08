# Changelog

All notable changes to File Compass will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-03-25

### Fixed
- `--version` flag added to CLI (was missing entirely)
- `__main__.py` added for `python -m file_compass` support
- GitHub Actions versions downgraded to existing releases (v6→v4/v5)
- `__author__` corrected from "AI Development Lab" to "mcp-tool-shop"

### Added
- `diagnose` command — checks Ollama connectivity, model availability, HNSW index and SQLite DB health (supports `--json` output, 6 new tests)

## [1.0.0] - 2026-02-27

### Added
- Shipcheck compliance: SHIP_GATE.md, SCORECARD.md
- Security & Data Scope section in README

### Changed
- Promoted from v0.1.3 to v1.0.0

## [0.1.3]

### Fixed
- Minor bug fixes and stability improvements

## [0.1.0] - 2026-01-24

### Added
- **Core Semantic Search** - HNSW-based vector search for files
  - Find files by describing what you're looking for
  - Sub-100ms search across 10K+ file chunks
  - Result explanations showing why each file matched
- **Quick Search** - Instant filename/symbol search
  - No embedding required
  - <10ms response time
- **Multi-Language AST Chunking** - Tree-sitter support
  - Python, JavaScript, TypeScript, Rust, Go
  - Function and class-level chunks
  - Markdown heading-based sections
- **MCP Server** (`gateway.py`) - Integration with Claude Code
  - `file_search` - Semantic search with explanations
  - `file_preview` - Code preview with syntax highlighting
  - `file_quick_search` - Fast filename/symbol search
  - `file_actions` - Context, usages, related, history, symbols
  - `file_index_status` - Index statistics
  - `file_index_scan` - Build/rebuild index
- **Local Embeddings** - Ollama integration
  - nomic-embed-text model (768 dimensions)
  - No API keys required
- **Security Hardening**
  - Input validation on all MCP inputs
  - Path traversal protection
  - SQL injection prevention
  - Error sanitization
- **CLI Interface**
  - `file-compass index` - Build index
  - `file-compass search` - Semantic search
  - `file-compass scan` - Quick index
  - `file-compass status` - Check status
- **Git-Aware Filtering** - Optional filter to git-tracked files only
- **Merkle Tree Updates** - Incremental index updates

### Infrastructure
- GitHub Actions CI/CD pipeline
- 298 tests with 91% coverage
- MIT License

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 0.1.0 | 2026-01-24 | Initial release |

[Unreleased]: https://github.com/mcp-tool-shop/file-compass/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/mcp-tool-shop/file-compass/releases/tag/v0.1.0
