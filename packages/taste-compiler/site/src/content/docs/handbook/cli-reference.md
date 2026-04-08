---
title: CLI Reference
description: All Taste Compiler commands, flags, and usage patterns.
sidebar:
  order: 3
---

## Commands

### `taste init`

Create a starter workspace with source, pack, and goldens directories.

```bash
npx taste-compiler init
```

Creates:
- `taste/source/` — YAML source files with starter templates
- `taste/pack/` — output directory for compiled packs
- `taste/goldens/` — golden flow baselines

### `taste validate-source`

Check authoring inputs before compiling. Catches missing required fields, invalid rule references, and schema violations.

```bash
npx taste-compiler validate-source
```

### `taste compile`

Compile Taste Source YAML into a Taste Pack JSON artifact.

```bash
npx taste-compiler compile
npx taste-compiler compile --dir taste/source --out taste/pack
```

| Flag | Default | Description |
|------|---------|-------------|
| `--dir` | `taste/source` | Directory containing YAML source files |
| `--out` | `taste/pack` | Output directory for the compiled pack |

### `taste explain`

Generate human-readable rationale for every compiled rule. Useful for reviewing what the pack enforces before running checks.

```bash
npx taste-compiler explain
```

### `taste check`

Run all 6 evaluators against application source files. Reports violations with rule ID, severity, evidence, rationale, and suggested fix.

```bash
npx taste-compiler check --dir src/
npx taste-compiler check --pack taste/pack/taste-pack.json --dir src/
```

| Flag | Default | Description |
|------|---------|-------------|
| `--dir` | (required) | Directory of source files to check |
| `--pack` | `taste/pack/taste-pack.json` | Path to compiled taste pack |

### `taste diff`

Changed-files-only checks for PR gates. Only evaluates files modified since the base branch.

```bash
npx taste-compiler diff --base main --dir src/
```

| Flag | Default | Description |
|------|---------|-------------|
| `--base` | `main` | Base branch to diff against |
| `--dir` | (required) | Directory of source files to check |

### `taste goldens verify`

Confirm golden flow routes and invariants are intact. Verifies that critical user paths haven't silently regressed.

```bash
npx taste-compiler goldens verify
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success — no violations |
| 1 | User error — bad arguments, missing files |
| 2 | Runtime error — unexpected failure |
| 3 | Violations found — check output for details |

## Debug Mode

Add `--debug` to any command for verbose output including stack traces on errors:

```bash
npx taste-compiler check --dir src/ --debug
```
