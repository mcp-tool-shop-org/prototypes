# How to Verify a Receipt

Verification is the whole point. A receipt you can't verify is just a story.

## Quick verification

```bash
# Install the CLI
npm install -g @receipt-factory/cli

# Verify a receipt
rf verify receipts/ci/2026-03-03/12345.json
```

This runs three checks:

1. **Schema** — Is the receipt structurally valid?
2. **Hash** — Does the content match the stored digest?
3. **Links** — Are the evidence URLs reachable?

## Offline verification

If you can't reach the network (or don't want to):

```bash
rf verify receipts/ci/2026-03-03/12345.json --offline
```

This skips the link check but still validates schema and hash integrity.

## What each check means

### Schema check

The receipt is validated against the v1.0.0 schema. This catches structural problems: missing fields, wrong types, invalid URLs.

If this fails, the receipt is malformed.

### Hash check

The receipt's `integrity.digest` is recomputed from the canonical JSON (everything except `id` and `integrity`). If the recomputed hash doesn't match, the receipt has been modified since creation.

If this fails, the receipt has been tampered with.

### Link check

Every URL in the receipt (subject, outputs, evidence) gets an HTTP HEAD request. If a link returns 4xx/5xx or is unreachable, it's flagged.

Link failures don't necessarily mean the receipt is invalid — URLs can expire (artifact retention, repo deletions). But they reduce the receipt's provenance strength.

## Strict mode (lint checks)

```bash
rf verify receipts/ci/2026-03-03/12345.json --strict
```

Strict mode runs lint checks on human-surface fields: intent quality, evidence, verification steps, subject URL, and policy declarations. Use this in CI to enforce receipt quality standards.

You can supply a custom policy file to override the default lint rules:

```bash
rf verify receipts/ci/2026-03-03/12345.json --strict --policy policy.json
```

See `rf policy init` to scaffold a default policy file.

## Following references

Receipts can reference other receipts by hash, forming a provenance graph. Use `--follow` to verify the chain:

```bash
rf verify receipts/ci/downstream.json --follow --receipts-dir receipts/
```

This resolves each reference in the receipt, verifies the referenced file exists, and confirms its hash matches. With `--strict --follow`, lint checks also run on the root receipt.

**Follow is best-effort by default.** If a referenced file is missing or a URL is unreachable, that reference is reported but does not fail verification. A missing reference does not invalidate the receipt's own integrity. This is intentional: receipts travel across systems, and not every recipient has access to every ancestor.

For strict provenance enforcement, use `--refs-strict`:

```bash
rf verify receipts/ci/downstream.json --follow --refs-strict --receipts-dir receipts/
```

In strict mode, missing or unreadable references fail verification. Hash mismatches always fail regardless of mode.

Traversal is bounded: max depth of 5 levels, max 200 nodes. Cycles are detected and reported cleanly.

## Policy governance

Receipts can embed a policy identity — the hash of the lint policy applied at creation time. This lets you verify that a receipt was linted under a specific policy, not a swapped one.

```bash
# Create a policy
rf policy init --output policy.json

# Verify with policy hash checking
rf verify receipt.json --strict --policy policy.json
```

If the receipt contains a `policy_identity.hash` and the supplied policy has a different hash, verification fails.

### Signing policies

For orgs that need auditable policy provenance:

```bash
# Sign the policy (detached sidecar: policy.json.sig)
rf policy sign policy.json --keyless

# Verify receipt, requiring a signed policy
rf verify receipt.json --strict --policy policy.json --require-policy-signature
```

## Receipt bundles

Bundles are portable, self-verifying truth capsules. A bundle is a zip archive containing a root receipt, its referenced receipts, evidence packs, policy, signatures, and tamper-evidence hashes.

### Creating a bundle

```bash
# Bundle a single receipt
rf bundle create receipts/ci/2026-03-03/12345.json

# Bundle with referenced receipts (walks the provenance graph)
rf bundle create receipts/release/v1.0.0.json --follow --receipts-dir receipts/

# Include evidence packs and policy
rf bundle create receipt.json --follow --include-evidence --policy policy.json

# Custom output path
rf bundle create receipt.json --out bundles/release-v1.0.0.bundle.zip
```

### Signing a bundle

Bundles can be signed with cosign to establish bundle authority — who created this parcel? The signature is detached (the zip is never mutated):

```bash
# Sign with OIDC (keyless, for CI)
rf bundle sign bundles/abc123.bundle.zip --keyless

# Sign with a private key
rf bundle sign bundles/abc123.bundle.zip --key cosign.key
```

This produces `bundle.zip.sig` (and `.cert` for keyless) next to the zip.

### Verifying a bundle

```bash
# Explicit bundle verification
rf bundle verify bundles/abc123.bundle.zip

# Auto-detect: rf verify handles .zip files automatically
rf verify bundles/abc123.bundle.zip

# Strict lint checks on all receipts in the bundle
rf bundle verify bundles/abc123.bundle.zip --strict

# Require a valid bundle-level signature
rf bundle verify bundles/abc123.bundle.zip --require-bundle-signature
rf verify bundles/abc123.bundle.zip --require-bundle-signature
```

Bundle verification is self-contained:
- Every file's SHA-256 is checked against `hashes.json`
- Every receipt inside the bundle is verified offline (no network access)
- References resolve only within the bundle — no filesystem wandering

When `--require-bundle-signature` is set, verification checks the bundle's cosign sidecar first. If the signature fails, verification returns early — there's no point unpacking a bundle whose provenance can't be established.

### Inspecting a bundle

```bash
rf bundle inspect bundles/abc123.bundle.zip
```

Quick summary: shows the manifest (root receipt, contents, creation date, factory version) without full verification.

### What's inside a bundle

```
bundle.zip/
├── manifest.json     # Bundle metadata
├── hashes.json       # SHA-256 of every file
├── VERIFY.md         # Human-readable verification instructions
├── receipts/
│   ├── root.json     # The primary receipt
│   └── <hash>.json   # Referenced receipts (if --follow)
├── evidence/         # Evidence packs (if --include-evidence)
├── policy/           # Policy file + signatures (if --policy)
└── signatures/       # Receipt and policy signature sidecars
```

## Viewing the reference graph

```bash
rf graph receipts/
```

Outputs a JSON graph of receipt-to-receipt references: nodes (receipt IDs, kinds, subjects) and edges (references with descriptions). Useful for visualizing the provenance chain.

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | All checks passed |
| 1 | Bad input (file not found, parse error) |
| 2 | Runtime error (network failure) |
| 3 | Verification failed (one or more checks) |

## Manual verification

You can also verify by hand:

1. Open the JSON file
2. Remove the `id` and `integrity` fields
3. Serialize the rest as canonical JSON (sorted keys, no whitespace)
4. Compute SHA-256 of the result
5. Compare with the stored `integrity.digest`

```bash
# Using jq and shasum
cat receipt.json | jq -cS 'del(.id, .integrity)' | shasum -a 256
```
