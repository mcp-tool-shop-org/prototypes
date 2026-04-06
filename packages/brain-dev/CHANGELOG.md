# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] — 2026-03-25

### Added
- `--version` / `-V` and `--help` / `-h` CLI flags
- Classifier upgraded from Beta to Production/Stable

### Fixed
- 8 ruff lint errors (unused imports, extraneous f-prefixes)
- Version sync between `__init__.py` and `pyproject.toml`

## [1.0.1] — 2026-02-27

### Added
- SHIP_GATE.md and SCORECARD.md (Shipcheck audit — 50/50)
- Makefile with `verify` target (lint + typecheck + test)
- Security & Data Scope section + Codecov badge in README
- Dependency audit job in CI (pip-audit)
- Standard report email in SECURITY.md

## [1.0.0] — 2026-02-22

### Added

- **9 Analysis Tools** for comprehensive developer insights:
  - Coverage gap detection and analysis
  - Behavior analysis for functions and modules
  - Automated pytest test generation with mocks
  - Refactoring suggestions and recommendations
  - Security vulnerability scanning (OWASP-style)
  - Documentation analysis and missing docstring detection
  - UX insights and interaction analysis
  - Complexity metrics and performance analysis
  - Code quality scoring

- **AST-Based Test Generation** — Automatically generate pytest tests with proper mocks that compile and run
- **Security Vulnerability Detection** — Detect SQL injection, command injection, hardcoded secrets, and other OWASP vulnerabilities
- **MCP Integration** — Native Model Context Protocol support for Claude and other MCP clients
- **Python 3.11+** support

### Infrastructure

- GitHub Actions CI/CD with pytest coverage tracking
- Type checking with mypy
- Linting with ruff

## [Unreleased]

_No unreleased changes._
