---
title: Getting Started
description: Install the CLI and create your first receipt.
sidebar:
  order: 1
---

## What is a receipt?

A receipt is a signed, timestamped, reproducible record of what happened:

- **What was done** — actions, inputs, outputs
- **Why it was done** — intent, policy, context
- **Who/what did it** — actor, runner, tool versions
- **Proof it happened** — hashes, links, checksums, logs
- **How to verify it** — commands, re-run instructions

You can read a receipt in 30 seconds and verify it in 2 minutes.

## Prerequisites

- Node.js 20 or later
- The `gh` CLI (for GitHub Actions data fetching)

## Install

```bash
npm install -g @receipt-factory/cli
```

Verify the installation:

```bash
rf --version
```

## Initialize your receipts directory

```bash
rf init
```

This creates the `receipts/` directory where all generated receipts are stored.

## Create a receipt

```bash
# From a GitHub Actions run
rf make ci --from github --run 12345678
```

The receipt is written to `receipts/ci/<date>/<run-id>.json`. It contains the full CI run metadata: workflow, trigger, commit SHA, test results, build artifacts, and timing.

## Render it

```bash
# As Markdown
rf render receipts/ci/2026-03-03/12345678.json

# As standalone HTML
rf render receipts/ci/2026-03-03/12345678.json --format html
```

## Verify it

```bash
# Basic verification (schema + hash + link checks)
rf verify receipts/ci/2026-03-03/12345678.json

# Strict with policy enforcement (adds lint checks)
rf verify receipts/ci/2026-03-03/12345678.json --strict --policy policy.json
```

Verification checks four things:
1. **Schema** — Does the receipt match the expected structure?
2. **Hash** — Does the content hash match the stored digest?
3. **Links** — Are referenced URLs reachable? (skip with `--offline`)
4. **Lint** — Does it meet quality rules? (only with `--strict`)

## Bundle and sign

```bash
# Bundle receipts into a portable capsule
rf bundle create receipts/ci/2026-03-03/12345678.json --follow --policy policy.json

# Sign the bundle
rf bundle sign bundles/abc123.bundle.zip --keyless
```

Bundles are self-verifying zip files that package receipts, evidence, and policy together. Signing adds a detached cosign signature so you can prove who created the bundle.

## Next steps

- Read about all [receipt kinds (pipelines)](/receipt-factory/handbook/pipelines/) you can generate
- Explore the [trust layer architecture](/receipt-factory/handbook/trust-layers/)
- See the full [CLI reference](/receipt-factory/handbook/cli-reference/)
- Use individual [packages](/receipt-factory/handbook/packages/) in your own code
