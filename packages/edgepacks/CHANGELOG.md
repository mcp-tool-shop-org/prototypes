# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-03-28

### Added
- Schema layer: PackSpec, Example, HardNegative, SplitConfig, EvalProtocol
- Foundry layer: pipeline, generate, mutate, validate, deduplicate, split, balance
- Export formats: JSONL, HuggingFace datasets, Unsloth, torchtune
- Launch packs: tool-routing, structured-extraction, error-triage
- CLI: list, info, preview, generate, mutate, validate, build, export, stats, check-leakage
- Structured error handling with EdgepacksError base class
- SECURITY.md, CHANGELOG.md, verify script
- CI with Python 3.11 + 3.12

[1.0.0]: https://github.com/mcp-tool-shop-org/edgepacks/releases/tag/v1.0.0
