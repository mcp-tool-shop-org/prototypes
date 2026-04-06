# Context Window Manager - Contributing Guide

> **Purpose**: Development guidelines, coding standards, and contribution workflow.
> **Last Updated**: 2026-01-22

---

## 2026 Best Practices Applied

> **Sources**: [CLAUDE.md Windows Constraints](/docs/CLAUDE.md), [Python 3.11+ Type Hints](https://docs.python.org/3/library/typing.html), [Ruff Linter](https://docs.astral.sh/ruff/), [Conventional Commits](https://www.conventionalcommits.org/)

This guide reflects 2026 Python development best practices:

1. **Windows-First Development**: All code must work on Windows. No `fork()`, no POSIX signals, no multiprocessing workers > 0 in data loaders. Use `freeze_support()` in entry points.

2. **Modern Type Hints**: Use Python 3.10+ syntax (`str | None` not `Optional[str]`, `list[str]` not `List[str]`). Type hints required for all public APIs.

3. **Ruff Over Black+Flake8+isort**: Single tool for linting and formatting. Faster, more consistent, better error messages.

4. **Pyright for Type Checking**: Strict mode enabled. Catches type errors that mypy misses.

5. **Structured Logging with structlog**: JSON-compatible output, context binding, better for log aggregation than stdlib logging.

6. **Async-First Design**: Use `async/await` for all I/O. Never block the event loop. Use `asyncio.gather()` for concurrency.

7. **Pre-commit Hooks**: Catch issues before commit. Includes ruff, pyright, and test runners.

8. **Conventional Commits**: Standardized commit messages enable automatic changelog generation and semantic versioning.

---

## Development Environment Setup

### Prerequisites

- Python 3.11+
- Git
- vLLM (for integration testing)
- LMCache (for integration testing)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-org/context-window-manager.git
cd context-window-manager

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (Unix)
source .venv/bin/activate

# Install development dependencies
pip install -e ".[dev]"

# Install pre-commit hooks
pre-commit install

# Verify setup
pytest tests/unit --quick
```

### Windows-Specific Notes

**CRITICAL**: This project must work on Windows. Follow these rules:

1. **No multiprocessing workers in tests**
   ```python
   # WRONG
   dataloader = DataLoader(dataset, num_workers=4)

   # CORRECT
   dataloader = DataLoader(dataset, num_workers=0)
   ```

2. **Use `if __name__ == "__main__":`**
   ```python
   # REQUIRED for any script with multiprocessing
   if __name__ == "__main__":
       from multiprocessing import freeze_support
       freeze_support()
       main()
   ```

3. **Path handling**
   ```python
   # WRONG
   path = "foo/bar/baz"

   # CORRECT
   from pathlib import Path
   path = Path("foo") / "bar" / "baz"
   ```

4. **No POSIX-only signals**
   ```python
   # WRONG
   signal.signal(signal.SIGTERM, handler)

   # CORRECT
   if sys.platform != "win32":
       signal.signal(signal.SIGTERM, handler)
   signal.signal(signal.SIGINT, handler)  # Works on Windows
   ```

---

## Project Structure

```
context-window-manager/
├── pyproject.toml           # Project metadata and dependencies
├── README.md                # User-facing documentation
├── docs/
│   ├── ROADMAP.md          # Development phases
│   ├── test_todo.md        # Test tracking
│   ├── SECURITY.md         # Security documentation
│   ├── ERROR_HANDLING.md   # Error taxonomy
│   ├── ARCHITECTURE.md     # Technical architecture
│   ├── API.md              # API reference
│   └── CONTRIBUTING.md     # This file
├── src/
│   └── context_window_manager/
│       ├── __init__.py
│       ├── __main__.py     # Entry point
│       ├── server.py       # MCP server
│       ├── config.py       # Configuration
│       ├── tools/
│       │   ├── __init__.py
│       │   ├── freeze.py
│       │   ├── thaw.py
│       │   ├── list.py
│       │   ├── status.py
│       │   ├── clone.py
│       │   └── delete.py
│       └── core/
│           ├── __init__.py
│           ├── session_registry.py
│           ├── window_manager.py
│           ├── kv_store.py
│           └── vllm_client.py
└── tests/
    ├── conftest.py         # Shared fixtures
    ├── unit/
    │   ├── core/
    │   └── tools/
    ├── integration/
    ├── e2e/
    ├── performance/
    ├── security/
    └── platform/
```

---

## Coding Standards

### Style Guide

We follow PEP 8 with these additions:

```python
# Line length: 88 characters (Black default)
# Use double quotes for strings
# Use trailing commas in multi-line structures

# Example function
async def freeze_session(
    session_id: str,
    window_name: str,
    *,
    description: str = "",
    tags: list[str] | None = None,
) -> FreezeResult:
    """
    Freeze a session's context to persistent storage.

    Args:
        session_id: The ID of the session to freeze.
        window_name: Name for the created window.
        description: Optional description.
        tags: Optional list of tags.

    Returns:
        FreezeResult with operation details.

    Raises:
        SessionNotFoundError: If session doesn't exist.
        WindowAlreadyExistsError: If window name is taken.
    """
    pass
```

### Type Hints

**Required** for all public APIs:

```python
from typing import Any

# Use | for unions (Python 3.10+)
def process(value: str | None) -> dict[str, Any]:
    pass

# Use list, dict, set directly (not List, Dict, Set)
def get_items() -> list[str]:
    pass

# Use Self for return type of methods returning self
from typing import Self

class Builder:
    def with_name(self, name: str) -> Self:
        self.name = name
        return self
```

### Docstrings

Use Google style:

```python
def complex_function(
    param1: str,
    param2: int,
    param3: dict[str, Any] | None = None,
) -> tuple[bool, str]:
    """
    Short description of what the function does.

    Longer description if needed, explaining the purpose,
    behavior, and any important details.

    Args:
        param1: Description of param1.
        param2: Description of param2.
        param3: Description of param3. Defaults to None.

    Returns:
        A tuple containing:
            - success: Whether the operation succeeded.
            - message: A status message.

    Raises:
        ValueError: If param1 is empty.
        ConnectionError: If unable to connect.

    Example:
        >>> result = complex_function("test", 42)
        >>> print(result)
        (True, "Success")
    """
    pass
```

### Error Handling

Follow the patterns in `ERROR_HANDLING.md`:

```python
# Always use specific exceptions
from context_window_manager.errors import (
    SessionNotFoundError,
    ValidationError,
)

# Validate early
def freeze(session_id: str, window_name: str) -> FreezeResult:
    # Validation first
    if not session_id:
        raise ValidationError("session_id is required")

    # Then business logic
    session = await self.registry.get(session_id)
    if not session:
        raise SessionNotFoundError(session_id)
```

### Async/Await

- Use `async/await` for I/O operations
- Use `asyncio.gather()` for concurrent operations
- Never block the event loop with synchronous I/O

```python
# CORRECT: Concurrent fetching
async def get_all_data():
    results = await asyncio.gather(
        fetch_sessions(),
        fetch_windows(),
        fetch_stats(),
    )
    return results

# WRONG: Sequential when could be concurrent
async def get_all_data():
    sessions = await fetch_sessions()
    windows = await fetch_windows()
    stats = await fetch_stats()
    return sessions, windows, stats
```

### Logging

Use structured logging:

```python
import structlog

logger = structlog.get_logger()

async def freeze_session(session_id: str, window_name: str):
    log = logger.bind(
        operation="freeze",
        session_id=session_id,
        window_name=window_name,
    )

    log.info("Starting freeze operation")

    try:
        result = await do_freeze()
        log.info("Freeze completed", block_count=result.block_count)
        return result
    except Exception as e:
        log.error("Freeze failed", error=str(e))
        raise
```

---

## Testing

### Test Organization

```
tests/
├── conftest.py              # Shared fixtures
├── unit/                    # Fast, isolated tests
│   ├── core/
│   │   ├── test_session_registry.py
│   │   ├── test_kv_store.py
│   │   └── test_vllm_client.py
│   └── tools/
│       ├── test_freeze.py
│       ├── test_thaw.py
│       └── ...
├── integration/             # Tests with real services
│   ├── test_vllm_integration.py
│   └── test_lmcache_integration.py
├── e2e/                     # Full workflow tests
│   └── test_workflows.py
├── performance/             # Benchmarks
│   └── test_benchmarks.py
└── security/                # Security tests
    └── test_security.py
```

### Writing Tests

```python
import pytest
from unittest.mock import AsyncMock, MagicMock

from context_window_manager.core import SessionRegistry
from context_window_manager.errors import SessionNotFoundError


class TestSessionRegistry:
    """Tests for SessionRegistry."""

    @pytest.fixture
    def registry(self, tmp_path):
        """Create a registry with temp database."""
        db_path = tmp_path / "test.db"
        return SessionRegistry(db_path)

    async def test_create_session(self, registry):
        """Should create a new session."""
        session = await registry.create(
            session_id="test-123",
            model="llama-3.1-8b",
        )

        assert session.id == "test-123"
        assert session.model == "llama-3.1-8b"
        assert session.state == SessionState.ACTIVE

    async def test_get_nonexistent_session(self, registry):
        """Should return None for nonexistent session."""
        result = await registry.get("nonexistent")
        assert result is None

    @pytest.mark.parametrize("invalid_id", [
        "",
        "a" * 100,  # Too long
        "has spaces",
        "has/slash",
    ])
    async def test_create_invalid_session_id(self, registry, invalid_id):
        """Should reject invalid session IDs."""
        with pytest.raises(ValidationError):
            await registry.create(
                session_id=invalid_id,
                model="llama-3.1-8b",
            )
```

### Running Tests

```bash
# Run all unit tests
pytest tests/unit/

# Run with coverage
pytest tests/unit/ --cov=src/context_window_manager --cov-report=html

# Run specific test file
pytest tests/unit/core/test_session_registry.py -v

# Run tests matching pattern
pytest tests/ -k "freeze" -v

# Run integration tests (requires services)
pytest tests/integration/ --run-integration

# Run performance benchmarks
pytest tests/performance/ --benchmark
```

### Test Fixtures

Common fixtures in `conftest.py`:

```python
import pytest
from pathlib import Path


@pytest.fixture
def temp_db(tmp_path) -> Path:
    """Temporary database file."""
    return tmp_path / "test.db"


@pytest.fixture
def mock_vllm_client():
    """Mock vLLM client for unit tests."""
    client = AsyncMock()
    client.generate.return_value = GenerateResponse(
        text="test output",
        tokens=10,
    )
    return client


@pytest.fixture
def mock_kv_store():
    """Mock KV store for unit tests."""
    store = AsyncMock()
    store.store.return_value = StoreResult(stored=["hash1", "hash2"], failed=[])
    store.retrieve.return_value = RetrieveResult(found={"hash1": b"data"}, missing=[])
    return store


@pytest.fixture
async def registry(temp_db):
    """Session registry with temp database."""
    registry = SessionRegistry(temp_db)
    await registry.initialize()
    yield registry
    await registry.close()
```

---

## Git Workflow

### Branch Naming

```
feature/short-description    # New features
fix/issue-number-description # Bug fixes
docs/what-changed           # Documentation
refactor/what-changed       # Code refactoring
test/what-added             # Test additions
```

### Commit Messages

Follow conventional commits:

```
type(scope): short description

Longer description if needed.

Closes #123
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Maintenance tasks

Examples:
```
feat(tools): implement window_freeze tool

Add the window_freeze tool that snapshots session KV cache
to persistent storage using LMCache.

- Add freeze.py with main implementation
- Add unit tests for freeze operation
- Update API documentation

Closes #42
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes, commit with conventional commits
3. Run tests locally: `pytest tests/unit/`
4. Run linting: `ruff check . && ruff format --check .`
5. Run type checking: `pyright`
6. Push and create PR
7. Wait for CI checks to pass
8. Request review
9. Address feedback
10. Squash and merge

### PR Template

```markdown
## Summary
Brief description of changes.

## Changes
- Change 1
- Change 2

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests (if applicable)
- [ ] Manual testing performed

## Documentation
- [ ] Docstrings updated
- [ ] API.md updated (if API changed)
- [ ] README updated (if user-facing)

## Checklist
- [ ] Tests pass locally
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Windows compatible
```

---

## Code Review Guidelines

### For Authors

- Keep PRs small and focused
- Provide context in PR description
- Respond to feedback promptly
- Don't take feedback personally

### For Reviewers

- Be constructive and respectful
- Explain the "why" behind suggestions
- Approve when good enough, not perfect
- Use conventional comments:
  - `nit:` - Minor style suggestion
  - `question:` - Asking for clarification
  - `suggestion:` - Optional improvement
  - `issue:` - Must be addressed

---

## Release Process

### Versioning

We use semantic versioning (SemVer):

- MAJOR: Breaking API changes
- MINOR: New features, backward compatible
- PATCH: Bug fixes, backward compatible

### Release Checklist

1. Update version in `pyproject.toml`
2. Update CHANGELOG.md
3. Create release PR
4. After merge, tag release: `git tag v1.2.3`
5. Push tag: `git push origin v1.2.3`
6. CI builds and publishes to PyPI

---

## Getting Help

- **Questions**: Open a discussion on GitHub
- **Bugs**: Open an issue with reproduction steps
- **Features**: Open an issue describing the use case
- **Security**: See SECURITY.md for responsible disclosure

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-01-22 | Initial contributing guide |
