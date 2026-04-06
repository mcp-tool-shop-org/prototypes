---
title: Packages
description: All 10 composable packages.
sidebar:
  order: 2
---

## Package overview

receipt-factory is built from 10 composable packages — use one or all.

| Package | Description |
|---------|-------------|
| `@receipt-factory/core` | Receipt schema, canonicalization, SHA-256 hashing, fluent builder API |
| `@receipt-factory/render` | Markdown + standalone HTML renderers |
| `@receipt-factory/verify` | Schema validation, hash integrity, link verification, policy enforcement |
| `@receipt-factory/sign` | Cosign-based signing — receipts, policies, bundles (detached sidecars) |
| `@receipt-factory/evidence` | Evidence packs — portable, content-addressed evidence bundles |
| `@receipt-factory/index` | Receipt index — scan, search, filter receipt directories |
| `@receipt-factory/policy` | Policy packs — portable, versioned lint configuration |
| `@receipt-factory/bundle` | Receipt bundles — self-verifying truth capsules (zip) |
| `@receipt-factory/adapter-github` | GitHub Actions data fetching via `gh` CLI |
| `@receipt-factory/cli` | The `rf` command — create, collect, render, verify, sign receipts |

## Core

The foundation package. Defines the receipt schema (Zod), deterministic canonicalization, SHA-256 content-addressing, and a fluent builder API for programmatic receipt creation.

**Key exports:** `ReceiptBuilder`, `canonicalize`, `computeDigest`, `computeIntegrity`, `verifyIntegrity`, `validateReceipt`, `safeValidateReceipt`, `RfError`

**Receipt kinds:** `ci_run`, `release`, `registry_sync`, `audit`, `sbom`, `delivery`

```ts
import { ReceiptBuilder } from "@receipt-factory/core";

const receipt = new ReceiptBuilder("ci_run")
  .subject({ type: "repository", name: "my-app", ref: "abc123" })
  .intent("Verify that tests pass on main branch")
  .input("workflow", "ci.yml")
  .addOutput({ name: "test-results", digest: "sha256:..." })
  .addEvidence({ type: "log", description: "CI run log" })
  .addStep("Run npm test")
  .addCommand("npm test")
  .toolVersion("node", "20.11.0")
  .build();
```

The `.build()` call computes the SHA-256 content-addressed ID and integrity block automatically.

## Render

Converts receipts into human-readable formats. Supports Markdown and standalone HTML output (with embedded CSS).

**Key exports:** `renderMarkdown`, `renderHtml`, `RECEIPT_CSS`

## Verify

Schema validation, hash integrity checks, link reachability, lint rules, reference traversal, and policy enforcement. The primary tool for checking receipt trustworthiness.

**Key exports:** `verifyReceipt`, `verifyAndFormat`, `checkSchema`, `checkHash`, `checkLinks`, `checkLint`, `checkReferences`, `checkPolicyIntegrity`

Verification runs five check families:
1. **Schema** — Zod validation against the receipt schema
2. **Hash** — Recomputes the content hash and compares against stored digest
3. **Links** — Checks that referenced URLs are reachable (skippable with `offline`)
4. **Lint** — Quality checks (only in strict mode): intent length, evidence count, verification steps
5. **References** — Validates cross-receipt references (with optional recursive follow)

## Sign

Cosign-based signing for receipts, policies, and bundles. Uses detached sidecars so the original artifact is never modified. Supports keyless signing via Sigstore OIDC for CI environments.

**Key exports:** `signReceipt`, `signPolicy`, `signBundle`, `verifySignature`, `isCosignAvailable`

## Evidence

Portable, content-addressed evidence bundles. Package raw data (logs, artifacts, screenshots) alongside receipts. Each evidence pack includes a manifest with SHA-256 hashes for every file.

**Key exports:** `writeEvidencePack`, `readEvidencePack`

## Index

Scan, search, and filter receipt directories. Builds a machine-readable `index.json` listing all receipts with their kind, subject, date, and validation status.

**Key exports:** `buildIndex`, `searchIndex`

Search supports filtering by kind, repository name (partial match), and date range (`since`/`until`).

## Policy

Portable, versioned lint configuration packs. Define what "good" means for your organization and distribute it across repos. Policies control rules like minimum intent length, required evidence count, and mandatory verification steps.

**Key exports:** `loadPolicy`, `computePolicyHash`, `DEFAULT_RULES`, `DEFAULT_POLICY`

**Default rules:** intent minimum 10 characters, at least 1 verification step, at least 1 verification command, at least 1 evidence item, subject URL required, context required.

## Bundle

Self-verifying zip bundles with hash manifests. Package receipts + evidence + policy into a portable truth capsule that can be verified offline. The bundle contains a `manifest.json` (what's inside) and `hashes.json` (SHA-256 of every file).

**Key exports:** `createBundle`, `verifyBundle`, `inspectBundle`

## Adapter: GitHub

Fetches CI run data, release metadata, workflow information, job details, and artifacts from GitHub Actions via the `gh` CLI.

## CLI

The `rf` command covers the full lifecycle: init, make, collect, render, verify, lint, sign, index, search, graph, policy, and bundle operations. See the [CLI Reference](/receipt-factory/handbook/cli-reference/) for every command.
