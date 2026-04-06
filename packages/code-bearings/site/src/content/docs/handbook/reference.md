---
title: CLI Reference
description: Complete reference for all Code Bearings CLI commands, flags, and options.
sidebar:
  order: 2
---

## Global Options

All commands accept these options:

| Flag | Default | Description |
|------|---------|-------------|
| `-p, --project <path>` | `.` | Project root directory |
| `-d, --db <path>` | `.code-bearings/bearings.db` | Database path |

## `analyze`

Index a TypeScript project and build the code graph.

```bash
code-bearings analyze [options]
```

| Flag | Description |
|------|-------------|
| `-t, --tsconfig <path>` | Path to tsconfig.json (auto-detected if omitted) |

The indexer uses ts-morph to parse your project's AST. It extracts:
- **Files** — path, line count
- **Symbols** — functions, classes, interfaces, types, variables, enums, constants
- **Edges** — imports, calls, called_by, references, implements, extends, reads, writes, exposes, verified_by
- **Tests** — test records linked to the symbols they exercise
- **Entrypoints** — exports, CLI entry points, API routes, jobs, event handlers
- **Modules** — boundary detection using a priority chain: override, package, barrel, directory, file

## `review`

Generate a change brief from a git diff.

```bash
code-bearings review [target] [options]
```

| Flag | Description |
|------|-------------|
| `--staged` | Review staged changes only |
| `--stdin` | Read diff from stdin |
| `--json` | Output as JSON |
| `--format <mode>` | Output format: `full`, `compact`, `markdown`, `html` |
| `--mode <lens>` | Purpose mode: `general`, `bug-hunter`, `learning`, `architecture`, `exploration` |
| `-o, --output <path>` | Write output to file |

**Examples:**

```bash
code-bearings review                     # staged + unstaged vs HEAD
code-bearings review --staged            # staged only
code-bearings review HEAD~1..HEAD        # last commit
code-bearings review main..feature       # branch comparison
git diff main | code-bearings review --stdin  # piped diff
```

## `compare`

Compare two branches or commits.

```bash
code-bearings compare [base] [head] [options]
```

Auto-detects the base branch (main, master, or develop) if not specified.

```bash
code-bearings compare                    # current vs auto-detected base
code-bearings compare main               # current vs main
code-bearings compare main feature       # explicit base and head
code-bearings compare HEAD~5 HEAD        # last 5 commits
```

## `module`

Show the module card for a named module.

```bash
code-bearings module <name> [options]
```

| Flag | Description |
|------|-------------|
| `--json` | Output as JSON |

Includes: public surface, internal structure, dependencies, reverse dependencies, metrics, and evidence.

## `function`

Show the function card for a named function.

```bash
code-bearings function <name> [options]
```

| Flag | Description |
|------|-------------|
| `-f, --file <path>` | Filter by file path |
| `--json` | Output as JSON |

## `overview`

Show the system map overview.

```bash
code-bearings overview [options]
```

| Flag | Description |
|------|-------------|
| `--json` | Output as JSON |

## `modules`

List all indexed modules with their metrics.

```bash
code-bearings modules [options]
```

## `ci`

Generate review artifacts for CI/CD pipelines.

```bash
code-bearings ci [options]
```

| Flag | Default | Description |
|------|---------|-------------|
| `--base <ref>` | auto-detect | Base branch or commit |
| `--head <ref>` | `HEAD` | Head commit |
| `--out <dir>` | `.code-bearings/ci` | Output directory |
| `--fail-on-risk <level>` | — | Exit non-zero if risk exceeds: `high`, `medium`, `low` |

**Risk thresholds:**

| Level | Score |
|-------|-------|
| `low` | >= 5 |
| `medium` | >= 15 |
| `high` | >= 30 |

**Output files:**

- `change-brief.md` — full Markdown report
- `change-brief.json` — machine-readable JSON
- `change-brief.html` — interactive HTML report
- `change-brief-compact.txt` — one-line-per-module summary

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (missing database, failed diff, risk threshold exceeded) |
