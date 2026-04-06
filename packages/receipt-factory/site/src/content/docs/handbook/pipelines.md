---
title: Pipelines
description: 5 receipt kinds for CI, releases, audits, and more.
sidebar:
  order: 3
---

## Pipeline overview

Each pipeline produces a specific kind of receipt, proving a different operation happened.

| Pipeline | Receipt Kind | What it proves | Automated collection |
|----------|-------------|----------------|---------------------|
| `ci-receipts` | `ci_run` | A CI build/test happened with specific inputs and results | Yes |
| `release-receipts` | `release` | A release was published with specific assets and commits | Yes |
| `registry-sync` | `registry_sync` | What's published vs what's in the repo — drift classification | Manual |
| `security-audit` | `audit` | What was scanned, with what tool, what vulnerabilities were found | Manual |
| `sbom` | `sbom` | Software bill of materials generated and attested | Manual |

## Two-step workflow

Pipelines support two creation paths:

**Direct (one step):** Fetch data and create the receipt in a single command.

```bash
rf make ci --from github --run 12345678
```

**Collect-then-make (two steps):** First collect raw evidence, then create the receipt from the local evidence pack. Useful for offline environments or when you need to review evidence before receipt creation.

```bash
# Step 1: Collect raw data into an evidence pack
rf collect ci --from github --run 12345678

# Step 2: Create the receipt from the local evidence
rf make ci --from evidence --pack evidence/ci/2026-03-03/12345678/
```

## CI receipts

Creates a receipt from a CI run. Captures workflow name, trigger, commit SHA, test results, build artifacts, and timing.

```bash
rf make ci --from github --run 12345678
```

## Release receipts

Captures release metadata: tag, assets, changelog, commit range, and publication timestamp.

```bash
rf make release --from github --tag v1.2.0
```

## Registry sync

Compares what's published in registries (npm, PyPI, etc.) against the repo state. Classifies drift as: in-sync, ahead, behind, or diverged. Collection is manual — write evidence JSON, then create the receipt.

```bash
rf make registry-sync --from evidence --pack evidence/registry-sync/
```

## Security audit

Records what was scanned, with which tool (npm audit, pip-audit, etc.), and what vulnerabilities were found. Collection is manual.

```bash
rf make security-audit --from evidence --pack evidence/audit/
```

## SBOM

Generates a software bill of materials receipt — listing all dependencies, their versions, and licenses. Collection is manual.

```bash
rf make sbom --from evidence --pack evidence/sbom/
```
