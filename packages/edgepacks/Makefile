.PHONY: verify lint test test-all build clean

verify: lint test build
	@echo "All checks passed"

lint:
	python -m ruff check src/ tests/

test:
	python -m pytest tests/ -v --tb=short -m "not integration and not slow"

test-all:
	python -m pytest tests/ -v --tb=short

build:
	python -m build

clean:
	rm -rf dist/ build/ *.egg-info src/*.egg-info
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
