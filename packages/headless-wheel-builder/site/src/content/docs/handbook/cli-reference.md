---
title: CLI Reference
description: All Headless Wheel Builder commands — what they do and when to use them.
sidebar:
  order: 3
---

Every command follows the pattern `hwb <command> [options]`. Run `hwb <command> --help` for full usage details.

## Global options

These flags apply to every command:

| Flag | Effect |
|------|--------|
| `--version` | Show version and exit |
| `-v, --verbose` | Increase verbosity (stackable) |
| `-q, --quiet` | Suppress non-error output |
| `--json` | Output in JSON format |
| `--no-color` | Disable colored output |

## Commands

### `hwb build`

Build wheels from a local directory, git URL, or tarball. Supports Python version targeting (`--python`), venv or Docker isolation (`--isolation`), sdist generation (`--sdist`), and output directory selection (`-o`).

### `hwb publish`

Publish built wheels to PyPI, TestPyPI, or custom registries. Supports API token authentication (`--token` or `PYPI_TOKEN` env var), dry-run mode, skip-existing, and PEP 740 attestations.

### `hwb inspect`

Examine a Python project and display its metadata, dependencies, and configuration. Supports text, JSON, and table output formats.

### `hwb github`

Headless GitHub operations: create releases with assets, open pull requests, file issues, and trigger workflow runs without leaving the terminal.

### `hwb release`

Draft, submit, approve, publish, and roll back releases using configurable approval workflows. Subcommands: `create`, `list`, `show`, `submit`, `approve`, `reject`, `publish`, `rollback`, `delete`, `pending`, `stats`, `templates`.

### `hwb pipeline`

Orchestrate build-to-release pipelines. Subcommands: `release` (full pipeline), `build-only`, `status`.

### `hwb deps`

Dependency graph analysis: tree visualization, license compliance checking, cycle detection, conflict detection, full analysis, and topological build ordering. Subcommands: `tree`, `analyze`, `licenses`, `conflicts`, `cycles`, `order`.

### `hwb actions`

Generate GitHub Actions workflow files from your project configuration. Subcommands: `list`, `show`, `generate`, `init`.

### `hwb multirepo`

Coordinate builds and version syncs across multiple repositories using a manifest file. Subcommands: `init`, `add`, `remove`, `list`, `order`, `build`, `sync`.

### `hwb notify`

Send build and release notifications to Slack, Discord, or generic webhooks. Subcommands: `send`, `test`, `providers`, `events`.

### `hwb security`

Run security scans: vulnerability auditing and code security analysis. Subcommands: `scan`, `check`, `tools`.

### `hwb metrics`

Track build performance over time: success rates, build durations, trends, and export. Subcommands: `summary`, `report`, `trends`, `list`, `export`, `clear`.

### `hwb cache`

Manage the local LRU artifact cache. Subcommands: `stats`, `list`, `packages`, `get`, `add`, `remove`, `clear`, `prune`, `info`.

### `hwb changelog`

Generate changelogs from Conventional Commits between two tags or refs. Outputs grouped Markdown.

### `hwb version`

Show the installed version of Headless Wheel Builder.

### `hwb version-next`

Calculate the next version number. Two modes: manual (`hwb version-next 1.0.0 --part minor`) or git-aware (`hwb version-next --path .`) which parses Conventional Commits since the last tag.

### `hwb images`

List available Docker images for manylinux/musllinux builds. Use `--check` to verify Docker daemon availability.
