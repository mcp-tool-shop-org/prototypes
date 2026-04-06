.PHONY: verify test lint typecheck build

verify: lint typecheck test
	@echo "✓ All checks passed"

test:
	pytest tests/ -v --cov=dev_brain --cov-report=term-missing

lint:
	ruff check dev_brain tests

typecheck:
	mypy dev_brain --ignore-missing-imports

build:
	python -m build --sdist --wheel
