.PHONY: verify test lint typecheck build

verify: test lint typecheck build
	@echo "✓ All checks passed"

test:
	pytest --cov=tool_scan --cov-report=term-missing

lint:
	ruff check src/

typecheck:
	mypy src/tool_scan --ignore-missing-imports

build:
	python -m build --sdist --wheel
