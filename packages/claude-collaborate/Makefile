.PHONY: verify lint typecheck test

verify: lint typecheck test
	@echo "All checks passed"

lint:
	python -m ruff check server.py ws_bridge.py tests/

typecheck:
	python -m mypy server.py ws_bridge.py --ignore-missing-imports

test:
	python -m pytest tests/
