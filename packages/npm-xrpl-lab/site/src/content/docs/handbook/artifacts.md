---
title: Artifacts
description: Verifiable artifacts and proof packs produced by XRPL Lab modules.
sidebar:
  order: 3
---

Every XRPL Lab module produces a verifiable artifact. Artifacts are the proof that you completed the module -- not just that you ran it, but that you understood the material and produced a correct result.

## What is an artifact?

An artifact is a structured output from a completed module. Depending on the module, an artifact may include:

- **Transaction IDs** -- on-ledger proof that a transaction was submitted and settled
- **Audit packs** -- batch verification results across multiple transactions
- **Proof packs** -- combined evidence bundles with SHA-256 integrity checksums

## Verifying artifacts

Use the built-in audit command to batch verify all your artifacts against the ledger:

```bash
npx @mcptoolshop/xrpl-lab audit
```

This checks every transaction ID against the XRPL testnet and reports any discrepancies.

## Checking your last run

```bash
# Show details from the most recent module run
npx @mcptoolshop/xrpl-lab last-run
```

This displays the module name, timestamp, artifact summary, and the exact audit command to re-verify.

## SHA-256 integrity

Proof packs include SHA-256 checksums for every piece of evidence. This means:

- Artifacts cannot be tampered with after generation
- You can verify integrity at any time without network access
- Checksums are computed locally and stored alongside the artifact

## Progress tracking

Track your completion across all three tracks:

```bash
npx @mcptoolshop/xrpl-lab status
```

This shows which modules you have completed, which are in progress, and which are remaining -- along with artifact counts for each.

## Offline artifacts

Modules run in `--dry-run` mode produce simulated artifacts. These follow the same structure and integrity checks as live artifacts, but are clearly marked as simulated. They are useful for learning the workflow before working with testnet.
