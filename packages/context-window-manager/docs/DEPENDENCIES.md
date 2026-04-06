# Context Window Manager - Dependencies

> **Purpose**: Document all dependencies, their purposes, and version constraints.
> **Last Updated**: 2026-01-22

---

## 2026 Best Practices Applied

> **Sources**: [pip-audit for vulnerability scanning](https://pypi.org/project/pip-audit/), [Dependabot security updates](https://docs.github.com/en/code-security/dependabot), [pip-tools for reproducible builds](https://pip-tools.readthedocs.io/)

This dependency management follows 2026 security and maintenance best practices:

1. **Minimum Version Pinning**: Direct dependencies pin minimum versions (`>=X.Y.Z`), allowing security patches. Lock files pin exact versions for reproducibility.

2. **Continuous Vulnerability Scanning**: `pip-audit` runs in CI on every PR. GitHub Dependabot monitors for CVEs and auto-creates PRs.

3. **Security Update SLA**: Critical vulnerabilities patched within 24 hours. Non-critical within 1 week.

4. **Dependency Rationale**: Every dependency has documented justification. Avoids "dependency creep" and makes auditing easier.

5. **Platform Compatibility Matrix**: All dependencies tested on Windows, Linux, and macOS. Windows compatibility is mandatory.

6. **Lock File Strategy**: Use `pip-compile` to generate `requirements.lock`. CI installs from lock for reproducibility. Dev can install from `pyproject.toml` for flexibility.

7. **Optional Dependency Groups**: Core dependencies minimal. Features like Redis, encryption, and LMCache are optional extras.

8. **Regular Dependency Reviews**: Monthly review of outdated dependencies. Quarterly evaluation of major version upgrades.

---

## Runtime Dependencies

### Core Dependencies

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| `mcp` | >=1.0.0 | MCP protocol implementation | MIT |
| `aiohttp` | >=3.9.0 | Async HTTP client for vLLM | Apache-2.0 |
| `aiosqlite` | >=0.19.0 | Async SQLite for session registry | MIT |
| `pydantic` | >=2.5.0 | Data validation and settings | MIT |
| `structlog` | >=24.1.0 | Structured logging | Apache-2.0 |
| `tenacity` | >=8.2.0 | Retry logic | Apache-2.0 |

### Optional Dependencies

| Package | Version | Purpose | When Needed |
|---------|---------|---------|-------------|
| `redis` | >=5.0.0 | Redis storage backend | `pip install .[redis]` |
| `lmcache` | >=0.1.0 | Direct LMCache integration | `pip install .[lmcache]` |
| `cryptography` | >=41.0.0 | Encryption at rest | `pip install .[encryption]` |

---

## Development Dependencies

### Testing

| Package | Version | Purpose |
|---------|---------|---------|
| `pytest` | >=7.4.0 | Test framework |
| `pytest-asyncio` | >=0.23.0 | Async test support |
| `pytest-cov` | >=4.1.0 | Coverage reporting |
| `pytest-benchmark` | >=4.0.0 | Performance benchmarks |
| `hypothesis` | >=6.92.0 | Property-based testing |
| `respx` | >=0.20.0 | HTTP mocking for aiohttp |

### Code Quality

| Package | Version | Purpose |
|---------|---------|---------|
| `ruff` | >=0.1.9 | Linting and formatting |
| `pyright` | >=1.1.340 | Type checking |
| `pre-commit` | >=3.6.0 | Git hooks |

### Documentation

| Package | Version | Purpose |
|---------|---------|---------|
| `mkdocs` | >=1.5.0 | Documentation site |
| `mkdocs-material` | >=9.5.0 | Material theme |
| `mkdocstrings[python]` | >=0.24.0 | API docs from docstrings |

---

## pyproject.toml

```toml
[project]
name = "context-window-manager"
version = "0.1.0"
description = "MCP server for lossless LLM context restoration via KV cache persistence"
readme = "README.md"
license = {text = "MIT"}
requires-python = ">=3.11"
authors = [
    {name = "Your Name", email = "your@email.com"}
]
keywords = ["mcp", "llm", "vllm", "context", "kv-cache"]
classifiers = [
    "Development Status :: 3 - Alpha",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Operating System :: Microsoft :: Windows",
    "Operating System :: POSIX :: Linux",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Topic :: Scientific/Engineering :: Artificial Intelligence",
]

dependencies = [
    "mcp>=1.0.0",
    "aiohttp>=3.9.0",
    "aiosqlite>=0.19.0",
    "pydantic>=2.5.0",
    "pydantic-settings>=2.1.0",
    "structlog>=24.1.0",
    "tenacity>=8.2.0",
]

[project.optional-dependencies]
redis = ["redis>=5.0.0"]
lmcache = ["lmcache>=0.1.0"]
encryption = ["cryptography>=41.0.0"]
all = [
    "context-window-manager[redis,lmcache,encryption]",
]

dev = [
    # Testing
    "pytest>=7.4.0",
    "pytest-asyncio>=0.23.0",
    "pytest-cov>=4.1.0",
    "pytest-benchmark>=4.0.0",
    "hypothesis>=6.92.0",
    "respx>=0.20.0",

    # Code quality
    "ruff>=0.1.9",
    "pyright>=1.1.340",
    "pre-commit>=3.6.0",

    # Documentation
    "mkdocs>=1.5.0",
    "mkdocs-material>=9.5.0",
    "mkdocstrings[python]>=0.24.0",
]

[project.scripts]
cwm = "context_window_manager.__main__:main"

[project.urls]
Homepage = "https://github.com/your-org/context-window-manager"
Documentation = "https://your-org.github.io/context-window-manager"
Repository = "https://github.com/your-org/context-window-manager"
Issues = "https://github.com/your-org/context-window-manager/issues"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/context_window_manager"]

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
markers = [
    "integration: marks tests requiring external services",
    "benchmark: marks performance benchmark tests",
    "slow: marks tests as slow running",
]
filterwarnings = [
    "ignore::DeprecationWarning",
]

[tool.coverage.run]
source = ["src/context_window_manager"]
branch = true
omit = ["*/tests/*", "*/__main__.py"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise NotImplementedError",
    "if TYPE_CHECKING:",
    "if __name__ == .__main__.:",
]

[tool.ruff]
target-version = "py311"
line-length = 88
src = ["src", "tests"]

[tool.ruff.lint]
select = [
    "E",     # pycodestyle errors
    "W",     # pycodestyle warnings
    "F",     # Pyflakes
    "I",     # isort
    "B",     # flake8-bugbear
    "C4",    # flake8-comprehensions
    "UP",    # pyupgrade
    "ARG",   # flake8-unused-arguments
    "SIM",   # flake8-simplify
    "TCH",   # flake8-type-checking
    "PTH",   # flake8-use-pathlib
    "ERA",   # eradicate (commented code)
    "PL",    # pylint
    "RUF",   # Ruff-specific
]
ignore = [
    "PLR0913",  # Too many arguments
    "PLR2004",  # Magic value comparison
]

[tool.ruff.lint.per-file-ignores]
"tests/*" = ["ARG", "PLR2004"]

[tool.pyright]
include = ["src"]
exclude = ["**/node_modules", "**/__pycache__", ".venv"]
pythonVersion = "3.11"
typeCheckingMode = "strict"
reportMissingTypeStubs = false
reportUnknownMemberType = false
```

---

## Dependency Rationale

### Why `mcp` instead of building protocol from scratch?
The official MCP package provides tested, spec-compliant protocol handling. Building from scratch would be error-prone and time-consuming.

### Why `aiohttp` instead of `httpx`?
- Better performance for high-volume requests
- More mature async support
- Well-tested connection pooling

### Why `aiosqlite` instead of raw SQLite?
- Non-blocking database operations
- Prevents event loop blocking
- Same API as synchronous sqlite3

### Why `pydantic` instead of dataclasses?
- Built-in validation
- JSON serialization
- Settings management via pydantic-settings
- Better error messages

### Why `structlog` instead of standard logging?
- Structured output (JSON-compatible)
- Context binding (log.bind())
- Better for log aggregation
- Minimal overhead

### Why `tenacity` instead of custom retry logic?
- Battle-tested retry patterns
- Configurable backoff strategies
- Good async support
- Decorator-based API

---

## Version Pinning Strategy

### Direct Dependencies
- Pin minimum version only: `>=X.Y.Z`
- Allow patch/minor updates for security fixes
- Test with latest versions in CI

### Development Dependencies
- Pin to known-working versions in CI
- Document minimum versions in pyproject.toml
- Update regularly with security patches

### Lock File
We use `pip-tools` to generate `requirements.lock`:

```bash
# Generate lock file
pip-compile pyproject.toml -o requirements.lock

# Install from lock
pip install -r requirements.lock
```

---

## Security Considerations

### Dependency Scanning
- GitHub Dependabot enabled
- `pip-audit` in CI pipeline
- Regular manual review

### Known Vulnerabilities
None currently.

### Update Policy
- Security updates: Within 24 hours
- Feature updates: Monthly review
- Major version updates: Quarterly evaluation

---

## Platform Compatibility

| Package | Windows | Linux | macOS |
|---------|---------|-------|-------|
| mcp | ✅ | ✅ | ✅ |
| aiohttp | ✅ | ✅ | ✅ |
| aiosqlite | ✅ | ✅ | ✅ |
| pydantic | ✅ | ✅ | ✅ |
| structlog | ✅ | ✅ | ✅ |
| tenacity | ✅ | ✅ | ✅ |
| redis | ✅ | ✅ | ✅ |
| lmcache | ⚠️ | ✅ | ✅ |
| cryptography | ✅ | ✅ | ✅ |

⚠️ lmcache has limited Windows support - use CPU storage backend.

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-01-22 | Initial dependencies documentation |
