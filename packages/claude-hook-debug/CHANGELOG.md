# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## 1.0.3 (2026-03-25)

### Added

- `HOOK_NO_TIMEOUT` diagnostic — warns when command/http hooks lack explicit timeout (may hang session)
- 4 new tests for timeout detection rule (28 total)

## 1.0.2 (2026-03-20)

### Added

- README translations: ja, zh, es, fr, hi, it, pt-BR
- Language selector in README header

## 1.0.1 (2026-03-20)

### Added

- CI workflow with vitest coverage + codecov upload
- Landing page (site-theme) + Starlight handbook (5 pages)
- Coverage badge in README
- `--help` and `--version` CLI flags
- vitest.config.ts scoping coverage to src/

### Fixed

- Exit code logic moved outside format branch so JSON mode also returns exit code 1 on errors

## 1.0.0 (2026-03-19)

### Added

- Settings scanner — reads all 4 Claude Code settings scopes (managed, user, project, local)
- Plugin state extraction — tracks enabled/disabled state across scopes with merge resolution
- Hook extraction — maps all user-defined hooks by event type with provenance
- 8 diagnostic rules detecting known Claude Code bugs:
  - `GHOST_HOOK_PREVIEW` — disabled claude-preview plugin still fires hooks (#19893)
  - `GHOST_HOOK_GENERIC` — any disabled plugin with potential ghost hooks
  - `LOCAL_ONLY_PLUGINS` — enabledPlugins in local-only settings silently dropped (#25086)
  - `SCOPE_CONFLICT` — plugin enabled/disabled conflict across scopes
  - `STOP_CONTINUE_LOOP` — Stop hook with continue:true causes infinite loop (#1288)
  - `DISABLE_ALL_HOOKS_ACTIVE` — disableAllHooks suppresses all hooks including managed
  - `BROKEN_SETTINGS_JSON` — invalid JSON silently disables all settings from that file
  - `LARGE_SETTINGS_FILE` — settings file >100KB may cause slow startup
  - `PLUGIN_HOOKS_INVISIBLE` — no user hooks but plugins enabled
- CLI with ANSI table and JSON output formats
- Library API (`debug()` function) for programmatic use
- 24 tests across 2 test suites
