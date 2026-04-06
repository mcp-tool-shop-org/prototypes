# tiny_python_cli

> Auto-generated metadata by zip-meta-map/0.2.0a0

## Summary

- **Profile**: `python_cli`
- **Files indexed**: 5
- **Spec version**: 0.2
- **Roles**: 1 config, 1 doc, 1 public_api, 1 entrypoint, 1 test

## Start here

- `README.md` — README is primary documentation
- `src/tiny_cli/main.py` — matches profile entrypoint pattern 'src/*/main.py'
- `pyproject.toml` — Python project configuration

## Plans

### `overview` (budget: ~32 KB)

Quick orientation — what is this tool and how is it structured?

   1. READ README.md for project purpose and usage
   2. READ pyproject.toml for dependencies and entry points
   3. READ entrypoint file to understand CLI structure
   4. LIST src/ directory structure for module layout

### `debug` (budget: ~64 KB)

Find and fix a bug

   1. READ entrypoint file for control flow
   2. LIST tests/ to understand coverage
   3. SCAN src/ for error handling patterns (try/except, raise)
   4. CHECK pyproject.toml for dependency versions

### `add_feature` (budget: ~48 KB)

Understand where to add new functionality

   1. READ README.md for project context
   2. READ entrypoint to understand CLI structure and subcommands
   3. LIST src/ modules to find related code
   4. READ tests/ for test patterns to follow

### `security_review` (budget: ~64 KB)

Identify security-sensitive code paths

   1. SCAN for subprocess, eval, exec, os.system, shlex calls
   2. CHECK for hardcoded secrets, tokens, or credentials
   3. REVIEW dependency list in pyproject.toml for known-vulnerable packages
   4. SCAN for file I/O operations on user-supplied paths (path traversal)

### `deep_dive` (budget: ~128 KB)

Read all source modules to understand full implementation

   1. READ start_here files for orientation
   2. READ each source module in dependency order (imports first)
   3. READ tests to understand expected behavior
   4. SUMMARIZE_THEN_CHOOSE_NEXT: after each chunk, decide if more detail is needed

## Modules

- `./` (2 files, config, doc) — Contains configuration, documentation
- `src/tiny_cli/` (2 files, public_api, entrypoint) — Contains public API surface, entry point; entry: main.py

---

*This file is for humans. Agents should prefer `META_ZIP_INDEX.json`.*
