<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/brain-dev/readme.png" width="400" alt="brain-dev" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/brain-dev/actions/workflows/test.yml"><img src="https://github.com/mcp-tool-shop-org/brain-dev/actions/workflows/test.yml/badge.svg" alt="Tests" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/brain-dev"><img src="https://codecov.io/gh/mcp-tool-shop-org/brain-dev/branch/main/graph/badge.svg" alt="Codecov" /></a>
  <a href="https://pypi.org/project/dev-brain/"><img src="https://img.shields.io/pypi/v/dev-brain" alt="PyPI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/brain-dev/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

**Intelligence layer for developer insights** — coverage analysis, test generation, refactoring suggestions, security audits, and UX insights via MCP.

## Features

- **9 MCP Tools** — Coverage gaps, behavior analysis, test generation, refactoring, UX insights, security audits, documentation analysis, and server stats
- **AST-Based Test Generation** — Automatically generate pytest tests with mocks that actually compile
- **Security Vulnerability Detection** — OWASP-style scanning for SQL injection, command injection, hardcoded secrets
- **Documentation Analysis** — Find missing docstrings and suggest templates
- **MCP Native** — Integrates seamlessly with Claude and other MCP clients

## Installation

```bash
pip install dev-brain
```

Or for development:

```bash
git clone https://github.com/mcp-tool-shop-org/brain-dev.git
cd brain-dev
pip install -e ".[dev]"
```

## Quick Start

```bash
# Run the MCP server
dev-brain
```

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "dev-brain": {
      "command": "dev-brain"
    }
  }
}
```

## Tools

### Analysis Tools

| Tool | Description |
|------|-------------|
| `coverage_analyze` | Compare observed patterns to test coverage, find gaps |
| `behavior_missing` | Find user behaviors not handled in code |
| `refactor_suggest` | Suggest refactoring based on complexity, duplication, naming |
| `ux_insights` | Extract UX insights from behavior patterns (dropoff, errors) |

### Generation Tools

| Tool | Description |
|------|-------------|
| `tests_generate` | Generate test suggestions for coverage gaps |
| `smart_tests_generate` | AST-based pytest generation with proper mocks and fixtures |
| `docs_generate` | Generate documentation templates for undocumented code |

### Security Tools

| Tool | Description |
|------|-------------|
| `security_audit` | Scan for vulnerabilities (SQL injection, command injection, secrets, etc.) |

### Utility Tools

| Tool | Description |
|------|-------------|
| `brain_stats` | Get server statistics and configuration |

## Example Usage

### Security Audit

```python
# Via MCP client
result = await client.call_tool("security_audit", {
    "symbols": [
        {
            "name": "execute_query",
            "file_path": "db.py",
            "line": 10,
            "source_code": "cursor.execute(f\"SELECT * FROM users WHERE id = {user_id}\")"
        }
    ],
    "severity_threshold": "medium"
})
# Returns: SQL injection vulnerability detected (CWE-89)
```

### Smart Test Generation

```python
result = await client.call_tool("smart_tests_generate", {
    "file_path": "/path/to/your/module.py"
})
# Returns complete pytest file with fixtures and mocks
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DEV BRAIN MCP SERVER                    │
├─────────────────────────────────────────────────────────────┤
│  Analyzers                                                   │
│  ├─ CoverageAnalyzer    (test gaps)                         │
│  ├─ BehaviorAnalyzer    (unhandled flows)                   │
│  ├─ RefactorAnalyzer    (complexity, naming)                │
│  ├─ UXAnalyzer          (dropoff, errors)                   │
│  ├─ DocsAnalyzer        (missing docs)                      │
│  └─ SecurityAnalyzer    (vulnerabilities)                   │
├─────────────────────────────────────────────────────────────┤
│  Generators                                                  │
│  ├─ TestGenerator       (skeleton tests)                    │
│  └─ SmartTestGenerator  (AST-based pytest)                  │
└─────────────────────────────────────────────────────────────┘
```

## Security Patterns Detected

| Category | Severity | CWE |
|----------|----------|-----|
| SQL Injection | Critical | CWE-89 |
| Command Injection | Critical | CWE-78 |
| Insecure Deserialization | Critical | CWE-502 |
| Hardcoded Secrets | High | CWE-798 |
| Path Traversal | High | CWE-22 |
| Insecure Crypto | Medium | CWE-327 |

## Development

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=dev_brain --cov-report=html

# Type checking (optional)
mypy dev_brain
```

## Security & Data Scope

- **Data touched:** reads Python source files via safe `ast.parse()` for analysis. Returns JSON results with coverage gaps, test suggestions, and security findings. No code execution.
- **Data NOT touched:** no file writes, no network requests, no data persistence, no databases, no external services. Read-only analysis only.
- **Permissions required:** read access to Python source files in the project directory.

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10/10 |
| B. Error Handling | 10/10 |
| C. Operator Docs | 10/10 |
| D. Shipping Hygiene | 10/10 |
| E. Identity (soft) | 10/10 |
| **Overall** | **50/50** |

> Assessed with [`@mcptoolshop/shipcheck`](https://github.com/mcp-tool-shop-org/shipcheck)

## License

MIT License — see [LICENSE](LICENSE) for details.

---

Built by [MCP Tool Shop](https://mcp-tool-shop.github.io/)
