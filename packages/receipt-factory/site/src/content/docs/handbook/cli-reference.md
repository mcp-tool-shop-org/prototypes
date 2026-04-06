---
title: CLI Reference
description: Every rf command in detail.
sidebar:
  order: 5
---

The `rf` command covers the full receipt lifecycle: create, collect, render, verify, sign, bundle, search, index, and graph.

## rf init

Create the `receipts/` directory structure.

```bash
rf init
```

## rf make

Create a receipt from a data source.

```bash
rf make <kind> --from <source> [options]
```

**Kinds:** `ci`, `release`, `registry-sync`, `security-audit`, `sbom`

| Option | Description |
|--------|-------------|
| `--from <source>` | Data source (required). Supported: `github`, `evidence` |
| `--run <id>` | Run ID (defaults to `GITHUB_RUN_ID` in CI) |
| `--repo <owner/name>` | Repository (defaults to `GITHUB_REPOSITORY`) |
| `--tag <tag>` | Release tag (for `release` kind) |
| `--pack <dir>` | Evidence pack directory (for `--from evidence`) |
| `--output <dir>` | Output directory (default: `receipts`) |

**Examples:**

```bash
# CI receipt from a GitHub Actions run
rf make ci --from github --run 12345678

# Release receipt from a GitHub tag
rf make release --from github --tag v1.2.0

# Receipt from a local evidence pack
rf make audit --from evidence --pack evidence/audit/
```

## rf collect

Collect raw data into an evidence pack for offline receipt creation.

```bash
rf collect <kind> --from <source> [options]
```

**Kinds:** `ci`, `release` (automated). `registry-sync`, `security-audit`, `sbom` require manual evidence.

| Option | Description |
|--------|-------------|
| `--from <source>` | Data source (required). Supported: `github` |
| `--run <id>` | Run ID (for `ci` kind) |
| `--repo <owner/name>` | Repository |
| `--tag <tag>` | Release tag (for `release` kind) |
| `--output <dir>` | Output directory (default: `evidence`) |

**Example:**

```bash
rf collect ci --from github --run 12345678
```

## rf render

Render a receipt as Markdown or standalone HTML.

```bash
rf render <file> --format <md|html> [--output <path>]
```

**Examples:**

```bash
# Render to Markdown (default)
rf render receipts/ci/2026-03-03/12345678.json

# Render to standalone HTML
rf render receipts/ci/2026-03-03/12345678.json --format html

# Write to a specific file
rf render receipts/ci/2026-03-03/12345678.json --format html --output report.html
```

## rf verify

Validate schema, hash integrity, links, and policy compliance.

```bash
rf verify <file> [options]
```

| Option | Description |
|--------|-------------|
| `--strict` | Enable lint checks (fail on warnings, not just errors) |
| `--offline` | Skip link reachability checks |
| `--follow` | Recursively verify referenced receipts |
| `--refs-strict` | Fail verification on missing or unreadable references |
| `--policy <path>` | Path to a `policy.json` for governance checks |
| `--require-policy-signature` | Require a signed policy (cosign sidecar) |
| `--require-bundle-signature` | Require a signed bundle (for `.zip` bundles) |
| `--receipts-dir <dir>` | Directory for resolving reference paths |

**Examples:**

```bash
# Basic verification
rf verify receipts/ci/2026-03-03/12345678.json

# Strict with policy enforcement
rf verify receipts/ci/2026-03-03/12345678.json --strict --policy policy.json

# Recursive: follow references
rf verify receipts/ci/2026-03-03/12345678.json --follow --refs-strict
```

## rf lint

Alias for `rf verify --strict`. Runs schema, hash, link, and lint checks.

```bash
rf lint <file> [--offline] [--policy <path>]
```

## rf sign

Sign a receipt with cosign (detached sidecar).

```bash
rf sign <file> [options]
```

| Option | Description |
|--------|-------------|
| `--keyless` | Use keyless signing (OIDC, for CI environments) |
| `--key <path>` | Path to cosign private key |
| `--embed` | Embed the signature into the receipt integrity block |

## rf index

Build a receipt index (`index.json`) from a directory of receipts.

```bash
rf index [dir] [--output <path>] [--validate]
```

| Option | Description |
|--------|-------------|
| `--output <path>` | Output path for `index.json` |
| `--validate` | Run integrity checks on each receipt during indexing |

**Example:**

```bash
rf index receipts/ --validate --output receipts/index.json
```

## rf search

Search the receipt index by kind, repo, or date range. Requires a built index (run `rf index` first).

```bash
rf search [options]
```

| Option | Description |
|--------|-------------|
| `--kind <kind>` | Filter by receipt kind (`ci_run`, `release`, `registry_sync`, `audit`, `sbom`) |
| `--repo <name>` | Filter by repository name (partial match) |
| `--since <date>` | Receipts created after this date |
| `--until <date>` | Receipts created before this date |
| `--index <path>` | Path to `index.json` (default: `receipts/index.json`) |

**Example:**

```bash
rf search --kind ci_run --repo my-app --since 2026-01-01
```

## rf graph

Emit a JSON graph of receipt-to-receipt references (the provenance graph).

```bash
rf graph [dir]
```

## rf policy init

Scaffold a default `policy.json` file.

```bash
rf policy init [--output <path>]
```

## rf policy sign

Sign a policy file with cosign (detached sidecar).

```bash
rf policy sign <file> [--keyless] [--key <path>]
```

## rf bundle create

Package receipts and evidence into a self-verifying zip capsule.

```bash
rf bundle create <file> [options]
```

| Option | Description |
|--------|-------------|
| `--follow` | Include referenced receipts (follow the provenance graph) |
| `--include-evidence` | Include evidence packs referenced by receipts |
| `--policy <path>` | Embed a policy file for offline verification |
| `--out <path>` | Output path for the zip file |
| `--receipts-dir <dir>` | Directory for resolving reference paths |

## rf bundle verify

Verify a receipt bundle (hash manifest, receipt integrity, optional signature).

```bash
rf bundle verify <file> [--strict] [--require-bundle-signature]
```

## rf bundle sign

Sign a bundle with cosign (detached sidecar).

```bash
rf bundle sign <file> [--keyless] [--key <path>]
```

## rf bundle inspect

Show bundle manifest summary: receipts, evidence, policy, and signatures inside the zip.

```bash
rf bundle inspect <file>
```
