---
title: Architecture
description: How the 6 packages in the Taste Compiler monorepo fit together.
sidebar:
  order: 4
---

Taste Compiler is a TypeScript monorepo managed with pnpm. It contains 6 packages, each with a focused responsibility.

## Package Map

```
packages/
  core/           Schemas (zod), types, rule IDs, diagnostics
  compiler/       TasteSource → TastePack pipeline
  check/          6 evaluators + orchestrator
  goldens/        Golden flow format + baseline validators
  adapters-web/   React/JSX, CSS-var, route, copy scanning
  cli/            7 commands + formatters
```

## Data Flow

```
YAML Source Files
      │
      ▼
  ┌──────────┐
  │ compiler │  TasteSource → TastePack
  └──────────┘
      │
      ▼
  taste-pack.json (versioned, machine-readable)
      │
      ▼
  ┌──────────┐     ┌──────────────┐
  │  check   │ ◄── │ adapters-web │  (extraction)
  └──────────┘     └──────────────┘
      │
      ▼
  Violations Report (rule ID, severity, evidence, fix)
```

## Package Details

### `@taste-compiler/core`

The foundation layer. Defines:
- **Zod schemas** for TasteSource and TastePack
- **Type exports** used by all other packages
- **Rule ID registry** (TOK-001 through FP-003)
- **Diagnostic types** for structured violation reporting

### `@taste-compiler/compiler`

The compilation pipeline:
1. Reads YAML source files
2. Validates against core schemas
3. Resolves rule references and cross-links
4. Emits a versioned TastePack JSON

### `@taste-compiler/check`

The enforcement engine with 6 evaluators:
- **Token checker** — visual token violations (TOK-*)
- **Grammar checker** — component grammar violations (GRAM-*)
- **Law checker** — interaction law violations (LAW-*)
- **Copy checker** — copy rule violations (COPY-*)
- **Budget checker** — complexity budget violations (BUD-*)
- **Forbidden checker** — forbidden pattern violations (FP-*)

Plus an orchestrator that runs all evaluators and merges results.

### `@taste-compiler/goldens`

Golden flow management:
- Flow definition format (routes, invariants, assertions)
- Baseline capture and storage
- Verification against current state

### `@taste-compiler/adapters-web`

Extraction layer for web projects:
- React/JSX component scanning
- CSS variable and inline style extraction
- Route structure analysis
- Copy text extraction

### `@taste-compiler/cli`

The user-facing interface:
- 7 commands (init, validate-source, compile, explain, check, diff, goldens)
- Structured output formatters
- Exit code management

## Test Coverage

236 tests across all packages. See [TEST-DOCTRINE.md](https://github.com/mcp-tool-shop-org/taste-compiler/blob/main/TEST-DOCTRINE.md) for the coverage policy: behavioral fixtures as canonical, line/branch coverage informative.
