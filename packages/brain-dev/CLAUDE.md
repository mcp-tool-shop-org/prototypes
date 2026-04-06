# Dev Brain MCP Server

## What This Server Does

An intelligence layer for developer insights. Provides 9 analysis tools via MCP:
coverage gaps, test generation, refactoring suggestions, security audits, 
documentation analysis, UX insights, complexity metrics, and code quality scoring.

## MCP Tools Available

| Tool | Purpose |
|------|---------|
| `smart_coverage_analyze` | Identify coverage gaps in test suites |
| `smart_tests_generate` | Auto-generate pytest tests with proper mocks |
| `smart_refactor_suggest` | Suggest refactoring improvements |
| `smart_security_audit` | OWASP-style vulnerability scanning |
| `smart_doc_analyze` | Find missing docstrings, suggest templates |
| `smart_ux_analyze` | UX insights and interaction analysis |
| `smart_complexity_analyze` | Measure code complexity metrics |
| `smart_quality_score` | Overall code quality scoring |
| `coverage_explain` | Explain why coverage gaps exist |

## Architecture

- AST-based analysis (Python focus, tree-sitter compatible)
- Mock-aware test generation (creates compilable pytest tests)
- OWASP-aligned security scanning
- Graceful degradation (missing dependencies don't crash)

## Dependencies

- Python >= 3.11
- mcp >= 1.0.0
- pytest >= 7.0.0 (for test generation)
- mypy (optional, for type checking)
- ruff (optional, for linting)

## Key Notes

- Tests in `tests/` directory
- Entry point: `dev_brain.server:run_server()`
- All tools async-first (pytest-asyncio compatible)
