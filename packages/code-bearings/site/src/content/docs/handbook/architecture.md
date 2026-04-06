---
title: Architecture
description: How Code Bearings works — from source indexing to review surfaces.
sidebar:
  order: 3
---

## Overview

Code Bearings is a monorepo with three packages sharing a strict layering contract:

```
@code-bearings/core    ← Shared product logic
@code-bearings/cli     ← Thin CLI consuming core
@code-bearings/vscode  ← Thin editor surface consuming core
```

**Core owns truth.** CLI and extension are thin consumers. No forked product.

## Data Flow

```
Source files (TypeScript/JavaScript)
    │
    ▼
Indexer (ts-morph AST parsing)
    │
    ▼
BearingsStore (SQLite graph database)
    ├── files, symbols, edges, modules
    ├── module boundaries, metrics
    │
    ▼
Review Engine (diff → ChangeBrief)
    ├── risk scoring
    ├── symbol explanations
    ├── reviewer tips
    ├── contract shift detection
    │
    ▼
Rendering (HTML, Markdown, JSON)
    ├── CLI output
    ├── VS Code webview
    └── CI artifacts
```

## BearingsStore

The graph database is a SQLite file (`.code-bearings/bearings.db`) with these tables:

| Table | Contents |
|-------|----------|
| `files` | Source files with paths and line counts |
| `symbols` | Functions, classes, interfaces, types, variables, enums |
| `edges` | Relationships between symbols (imports, calls, called_by, references, implements, extends, reads, writes, exposes, verified_by) |
| `tests` | Test records with name, file, and line |
| `test_targets` | Links tests to the symbols they exercise |
| `entrypoints` | Exported symbols, CLI entry points, API routes, jobs, event handlers |
| `modules` | Detected module boundaries |
| `module_files` | Which files belong to which modules |
| `module_deps` | Module-level dependency edges with weight |
| `bearings_meta` | Key-value metadata (file count, index timestamp) |

## Module Boundary Detection

Code Bearings detects module boundaries using a priority chain. Higher-priority strategies win when boundaries overlap:

| Priority | Kind | How detected |
|----------|------|-------------|
| 1 | **Override** | User-defined boundaries via `.code-bearings/modules.json` or `code-bearings.modules.json` |
| 2 | **Package** | Directory containing a `package.json` (monorepo packages) |
| 3 | **Barrel** | Directory with `index.ts` re-exporting symbols (more re-exports than own logic) |
| 4 | **Directory** | Directory containing multiple related source files (fallback) |
| 4 | **File** | Single file with exported symbols (weakest boundary) |
| — | **Heuristic** | Fallback for ambiguous groupings |

Each boundary has a confidence level (low/medium/high) and a reason explaining why it was chosen.

### Module Overrides

You can define custom module boundaries by creating a config file at `.code-bearings/modules.json` or `code-bearings.modules.json` in your project root. Overrides take highest priority in the boundary chain.

```json
[
  {
    "name": "billing",
    "include": ["src/billing/**"],
    "exclude": ["src/billing/test/**"],
    "responsibility": "Payment processing and invoice generation"
  }
]
```

Each override accepts:
- `name` — module name
- `include` — glob patterns for files in this module
- `exclude` — (optional) glob patterns to exclude
- `responsibility` — (optional) human description of what this module owns

## Change Brief

A `ChangeBrief` is generated from a git diff and contains:

- **Summary** — one-line description of the change
- **Confidence** — how much of the change Code Bearings understands
- **Changed modules** — each with risk score, change kinds, symbol explanations, reviewer tips
- **Contract shifts** — API changes detected from signature modifications
- **Unknowns** — things Code Bearings couldn't fully resolve

### Risk Scoring

Risk scores range from 0-100 and are computed from:
- Number and kind of changed symbols
- Whether changed symbols are exported (public API)
- Number of callers (fan-in)
- Whether tests exist for changed symbols
- Error handling changes
- Control flow modifications

### Purpose Modes

General Review provides the canonical truth. Other modes are lenses:

| Mode | Additional content |
|------|-------------------|
| **Bug Hunter** | Failure hypotheses, blind spots, inspection prompts |
| **Learning** | Syntax translations, before/after explanations |
| **Architecture** | Module roles, boundary health, system position |
| **Exploration** | Guided questions for unfamiliar codebases |

## VS Code Extension Architecture

The extension is a thin surface over core:

- **Activity bar** — dedicated "Code Bearings" view container with Modules and Review Brief tree views
- **Tree views** — read from BearingsStore, no separate data model
- **Review panel** — renders core's HTML report in a webview, injects a postMessage bridge for interactivity
- **Cursor providers** — hover tooltips, CodeLens annotations, gutter decorations, and status bar context, all calling `resolveCursorContext()` which is pure computation over existing data
- **Freshness tracker** — monitors file saves and git state, shows stale indicators without disrupting reading; optionally auto-re-analyzes on save

### Extension Commands

| Command | What it does |
|---------|-------------|
| Analyze Project | Index the workspace and build the code graph |
| Review Changes | Generate a change brief from staged + unstaged changes |
| Review Branch | Compare the current branch against a chosen base branch |
| Show Module Card | Pick a module and view its card as JSON |
| Show Function Card | Enter a function name and view its card as JSON |
| System Overview | View the full system map as JSON |
| Show Symbol Detail | View the function or module card for the symbol at cursor |
| Refresh All | Re-index and/or re-review based on freshness state |

### Extension Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `codeBearings.dbPath` | `.code-bearings/bearings.db` | Path to the bearings database |
| `codeBearings.autoAnalyze` | `false` | Re-analyze automatically on file save |
| `codeBearings.reviewMode` | `general` | Default review mode lens |
| `codeBearings.cursorContext.enabled` | `true` | Show contextual intelligence at cursor |
| `codeBearings.cursorContext.codeLensEnabled` | `true` | Show CodeLens on changed symbols |
| `codeBearings.cursorContext.gutterEnabled` | `true` | Show gutter decorations on changed lines |

No new truth is created in the extension layer. Every surface traces back to BearingsStore.
