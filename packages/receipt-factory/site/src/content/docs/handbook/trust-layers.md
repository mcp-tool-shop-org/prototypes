---
title: Trust Layers
description: How content-addressing, policy, bundles, and signing stack.
sidebar:
  order: 4
---

## Four stacking trust layers

receipt-factory provides four trust layers. Each adds a guarantee on top of the previous one.

### 1. Receipt integrity

Every receipt is SHA-256 content-addressed. The receipt data is canonicalized (keys sorted lexicographically, compact JSON, no whitespace) and then hashed. The resulting digest becomes both the receipt's ID and its integrity proof. Change one byte and the hash breaks. Tamper-evident by default.

**Verified by:** `rf verify <file>` (always runs schema + hash checks)

### 2. Governance integrity

Policy-based lint rules with signed policy files. Define what "good" means for your organization — required fields, minimum intent length, evidence count, verification steps, naming conventions. Policies are portable JSON packs that can be versioned and distributed across repos.

Policies can be signed with cosign so you can verify that the same policy was used at creation and verification time.

**Verified by:** `rf verify <file> --strict --policy policy.json`

### 3. Bundle integrity

Self-verifying zip bundles with hash manifests. Package receipts and evidence together into a single archive. The bundle contains `manifest.json` (listing all contents) and `hashes.json` (SHA-256 of every file inside). The manifest proves nothing was added, removed, or modified.

**Verified by:** `rf bundle verify <file>`

### 4. Bundle authority

Detached cosign signatures on bundles. Proves who created the bundle and that it hasn't been tampered with after signing. Supports keyless signing via Sigstore OIDC for CI environments — no private key management needed.

**Created by:** `rf bundle sign <file> --keyless`

## Verification order

Verification runs from outside in:

1. **Signature** — Is the bundle signed? Is the signature valid?
2. **File integrity** — Do all files match their manifest hashes?
3. **Semantic integrity** — Does each receipt's content hash match its claimed hash?
4. **Governance** — Does each receipt satisfy the attached policy?

This layered approach means a failure at any level is caught before deeper checks run. A broken signature stops verification before any receipt content is even read.

## What receipts prove (and don't prove)

**Receipts prove:**
- A build, test, release, audit, or SBOM generation happened at a specific time
- The inputs and outputs are content-addressed and tamper-evident
- The full provenance chain is walkable via receipt references

**Receipts do NOT prove:**
- That the underlying code is correct (receipts prove process, not quality)
- That the CI environment itself wasn't compromised (that's a supply chain problem)
- That artifacts haven't been modified after receipt creation (use signing for that)
