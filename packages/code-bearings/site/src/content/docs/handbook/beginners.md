---
title: Beginners Guide
description: Everything you need to get started with Code Bearings in your first 5 minutes.
sidebar:
  order: 99
---

## What Is This Tool?

Code Bearings is a static analysis tool that indexes TypeScript projects into a graph of files, symbols, modules, and dependencies. It then uses that graph to generate evidence-backed change briefs, module cards, and function cards.

It works across three surfaces:
- **CLI** — run `code-bearings analyze` to index, `code-bearings review` to generate change briefs from git diffs
- **VS Code extension** — hover tooltips, CodeLens annotations, gutter decorations, interactive review panels, and tree views for modules and review briefs
- **CI** — generate review artifacts (Markdown, JSON, HTML) and optionally fail builds when risk scores exceed a threshold

Code Bearings never fabricates information. Every claim traces back to source code evidence. It reads your code through AST parsing, stores the graph in a local SQLite database, and never modifies your source files or makes network requests.

## Who Is This For?

- **Developers reviewing pull requests** who want risk-scored, evidence-backed change briefs instead of reading raw diffs
- **Team leads** who want CI-generated review artifacts to catch high-risk changes before merge
- **Developers onboarding to a new codebase** who want to explore module structure, function call graphs, and system maps
- **Solo developers** who want to understand the blast radius of their changes before pushing

Code Bearings works with any TypeScript or JavaScript project that has a `tsconfig.json`.

## Prerequisites

- **Node.js 20 or later** — check with `node --version`
- **Git** — required for the `review`, `compare`, and `ci` commands
- **A TypeScript project** with a `tsconfig.json` file in the project root
- **VS Code 1.85+** (only if using the VS Code extension)

## Your First 5 Minutes

### 1. Install the CLI

```bash
npm install -g @code-bearings/cli
```

Or run without installing:

```bash
npx @code-bearings/cli analyze
```

### 2. Index your project

Navigate to a TypeScript project and run:

```bash
code-bearings analyze
```

This creates a `.code-bearings/bearings.db` SQLite file containing your project's code graph. The output shows how many files and modules were found.

### 3. Explore the graph

```bash
# List all detected modules
code-bearings modules

# View details for a specific module
code-bearings module store

# Inspect a specific function
code-bearings function handleRequest

# See the full system map
code-bearings overview
```

### 4. Review your changes

Make some changes, then:

```bash
# Review all uncommitted changes
code-bearings review

# Review only staged changes
code-bearings review --staged

# Compare branches
code-bearings compare main feature-branch
```

The change brief shows which modules were affected, risk scores, symbol explanations, and reviewer tips.

### 5. Try a purpose mode

```bash
# Look for potential bugs
code-bearings review --mode bug-hunter

# Learn what the code means
code-bearings review --mode learning

# Understand module relationships
code-bearings review --mode architecture
```

## Common Mistakes

**Running review before analyze.** The `review`, `module`, `function`, `overview`, `compare`, and `ci` commands all require an indexed database. Run `code-bearings analyze` first. You will see the error "No bearings database found" if you skip this step.

**Forgetting to re-analyze after major refactors.** The database is a snapshot of your code at the time you ran `analyze`. If you rename files, move modules, or change exports, run `analyze` again so the graph stays accurate. The VS Code extension's freshness tracker warns you when the index may be stale.

**Expecting runtime behavior analysis.** Code Bearings is a static analysis tool. It reads your AST and call graph but does not execute your code. Risk scores are computed from structural properties (fan-in, exported symbols, test coverage) not from runtime traces.

**Using the wrong tsconfig.** If your project has multiple tsconfig files, pass the correct one: `code-bearings analyze --tsconfig tsconfig.app.json`. If omitted, the tool auto-detects from the project root.

**Ignoring unknowns.** The change brief includes an "unknowns" section listing things Code Bearings could not fully resolve (dynamic calls, unresolved exports, framework wiring). These are areas where the tool's confidence is lower and manual review is especially important.

## Next Steps

- Read the [Getting Started](/code-bearings/handbook/getting-started/) page for a deeper walkthrough of all commands
- Check the [CLI Reference](/code-bearings/handbook/reference/) for every flag and option
- Explore the [Architecture](/code-bearings/handbook/architecture/) page to understand how the indexer, graph store, and review engine work internally
- Review the [Security](/code-bearings/handbook/security/) page for the full threat model
- Install the VS Code extension by searching "Code Bearings" in the extensions panel

## Glossary

| Term | Definition |
|------|-----------|
| **Analyze** | The indexing step that parses your TypeScript project and stores the code graph in SQLite |
| **BearingsStore** | The SQLite database (`.code-bearings/bearings.db`) containing files, symbols, edges, modules, and metrics |
| **Barrel** | An `index.ts` file that re-exports symbols from other files in its directory, creating a module boundary |
| **Change Brief** | A structured review artifact generated from a git diff, containing risk scores, symbol explanations, and reviewer tips |
| **Confidence** | How much of a change or module boundary Code Bearings fully understands — high, medium, or low |
| **Edge** | A relationship between two symbols (imports, calls, called_by, references, implements, extends, reads, writes, exposes, verified_by) |
| **Fan-in** | The number of other modules that depend on a given module |
| **Fan-out** | The number of modules that a given module depends on |
| **Function Card** | A detailed view of a single function showing callers, callees, side effects, linked tests, and evidence |
| **Module** | A group of related source files detected by boundary analysis (override, package, barrel, directory, or file) |
| **Module Card** | A detailed view of a module showing public surface, dependencies, metrics, and risk notes |
| **Purpose Mode** | A lens over the canonical change brief — General (default), Bug Hunter, Learning, Architecture, or Exploration |
| **Risk Score** | A 0-100 score computed from changed symbols, fan-in, test coverage, and change kinds |
| **Symbol** | A named code entity: function, class, interface, type, enum, variable, or constant |
| **System Map** | A high-level overview showing subsystems, hotspots, and modules with weak test linkage |
| **Unknown** | Something Code Bearings could not fully resolve — dynamic calls, unresolved exports, framework wiring, etc. |
