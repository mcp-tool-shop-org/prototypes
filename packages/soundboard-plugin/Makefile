.PHONY: verify lint test audit

verify: lint test audit

lint:
	python -m ruff check voice_soundboard_plugin/

test:
	python -m pytest tests/ -v --tb=short

audit:
	pip-audit --strict --desc || true
