# Contributing to Context Window Manager

Thank you for your interest in contributing to Context Window Manager!

## Development Setup

### Prerequisites
- Python 3.11+
- uv (recommended) or pip
- vLLM (for KV cache integration)

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/mcp-tool-shop-org/context-window-manager.git
   cd context-window-manager
   ```

2. Create virtual environment and install:
   ```bash
   uv venv
   source .venv/bin/activate  # or .venv\Scripts\activate on Windows
   uv pip install -e ".[dev]"
   ```

3. Run tests:
   ```bash
   pytest tests/ -v
   ```

## Architecture

Context Window Manager is an MCP server for KV cache persistence:
- `src/context_window_manager/` - Main package
- `src/context_window_manager/server.py` - MCP server entry point
- `src/context_window_manager/kv_store/` - KV cache storage
- `tests/` - Test suite (366+ tests)

## Code Style

- Python with type hints
- Ruff for linting and formatting
- pytest for testing

Run linting:
```bash
ruff check src/ tests/
ruff format src/ tests/
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes
4. Ensure all tests pass (`pytest tests/ -v`)
5. Run linting (`ruff check . && ruff format .`)
6. Commit with conventional commits (`feat:`, `fix:`, `docs:`, etc.)
7. Push to your fork
8. Open a Pull Request

## MCP Server Development

When adding new tools:
1. Add tool definition in the appropriate module
2. Register in the MCP server
3. Add comprehensive tests
4. Update documentation

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Include Python version and vLLM version
- Provide reproduction steps for bugs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
