---
title: Getting Started
description: Install Taste Compiler and run your first check in under 5 minutes.
sidebar:
  order: 1
---

## Prerequisites

- Node.js 20 or later
- A project with source files to check (TSX, JSX, CSS)

## Initialize a workspace

```bash
npx taste-compiler init
```

This creates the workspace structure:

```
taste/
  source/       # Your YAML taste definitions
    product.yaml
    principles.yaml
    anti-examples.yaml
    flows.yaml
    budgets.yaml
  pack/         # Compiled output (gitignored)
  goldens/      # Golden flow baselines
```

## Author your taste source

Edit the YAML files in `taste/source/`. Each file defines a different aspect of your product's taste:

- **product.yaml** — product identity, name, category, target audience
- **principles.yaml** — design principles with allowed/banned tokens, components, copy rules
- **anti-examples.yaml** — concrete examples of what violates your taste
- **flows.yaml** — golden flows that must not regress
- **budgets.yaml** — complexity limits (nav items, actions per screen, modal layers)

## Compile to a Taste Pack

```bash
npx taste-compiler compile
```

This reads your YAML sources and produces `taste/pack/taste-pack.json` — a versioned, machine-readable artifact.

## Validate before compiling

```bash
npx taste-compiler validate-source
```

Catches authoring errors (missing required fields, invalid rule references) before you compile.

## Check generated code

```bash
npx taste-compiler check --dir src/
```

Runs all 6 evaluators against your source files and reports violations with:
- **Rule ID** (e.g., `TOK-001`, `LAW-003`)
- **Severity** (error, warning)
- **Evidence** (file, line, snippet)
- **Rationale** (why this violates taste)
- **Suggested fix**

## Diff-only mode for PRs

```bash
npx taste-compiler diff --base main --dir src/
```

Only checks files changed since the base branch — ideal for CI/PR gates.

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | No violations found |
| 1 | User error (bad arguments, missing files) |
| 2 | Runtime error |
| 3 | Violations found (partial success) |
