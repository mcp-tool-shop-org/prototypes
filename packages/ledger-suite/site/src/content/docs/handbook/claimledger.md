---
title: ClaimLedger
description: Scientific claim provenance — assertions, citations, attestations, revocations, and RFC 3161 timestamps.
sidebar:
  order: 2
---

ClaimLedger is a local-first, cryptographically verifiable ledger for scientific claims, evidence, and reproducibility. It treats claims as the atomic unit of research — not papers, not datasets — and provides cryptographic accountability for who asserted what, when.

## Core concepts

### Claims

A claim is a signed assertion by a researcher. Each claim carries:

- A unique `ClaimId`
- A `Statement` (the assertion itself)
- An `AssertedAtUtc` timestamp
- Zero or more `Evidence` references (hashed datasets, code, notebooks)
- An Ed25519 `Signature` over the canonical JSON representation

Claims are self-contained. Anyone with the public key can verify the signature without contacting any server.

### Evidence types

Claims can reference supporting evidence, each identified by a SHA-256 hash:

| Type | Description |
|------|-------------|
| Dataset | Training data, experimental results |
| Code | Source code, scripts, models |
| Paper | Published papers, preprints |
| Notebook | Jupyter notebooks, analysis documents |
| Other | Any other supporting material |

The hash binds the claim to a specific version of the evidence. If the evidence file is modified after the claim is signed, verification will detect the mismatch.

### Attestations

Third parties can attest to claims without modifying the original signature. Attestation types include:

- `REVIEWED` — Peer review completed
- `REPRODUCED` — Results independently reproduced
- `INSTITUTION_APPROVED` — Institutional endorsement
- `DATA_AVAILABILITY_CONFIRMED` — Evidence files verified as accessible
- `WITNESSED_AT` — Cryptographic proof of existence at a specific time

```bash
claimledger attest claim.json \
  --type REVIEWED \
  --statement "Methodology verified" \
  --attestor-key reviewer.key.json \
  --out claim.attested.json
```

### Citations

Claims can cite other claims, forming a verifiable graph of scientific knowledge:

```bash
claimledger cite claim.json \
  --bundle cited-claim.json \
  --relation CITES \
  --signer-key author.key.json \
  --embed \
  --out claim.cited.json
```

Citation relations: `CITES`, `DEPENDS_ON`, `REPRODUCES`, `DISPUTES`.

### Revocations

Compromised or rotated keys can be revoked:

```bash
# Self-signed revocation (key revokes itself)
claimledger revoke-key author.key.json \
  --reason ROTATED \
  --successor-key new-author.key.json \
  --out revocations/author.revoked.json
```

Revocation reasons: `COMPROMISED`, `ROTATED`, `RETIRED`, `OTHER`.

When verification encounters a revoked key, the claim is flagged accordingly. Strict mode (`--strict-revocations`) will fail verification outright.

### RFC 3161 timestamps

For legal-grade non-repudiation, claims can carry RFC 3161 timestamp tokens from external Timestamp Authorities:

```bash
# Create a timestamp request
claimledger tsa-request claim.json --out claim.tsq

# Send to a TSA (e.g., FreeTSA)
curl -H "Content-Type: application/timestamp-query" \
     --data-binary @claim.tsq \
     https://freetsa.org/tsr -o claim.tsr

# Attach the token to the claim
claimledger tsa-attach claim.json --token claim.tsr --out claim.tsa.json

# Verify including timestamp validation
claimledger verify claim.tsa.json --tsa --tsa-trust-dir ./tsa-certs/
```

## CLI commands

### Core verification and inspection

| Command | Purpose |
|---------|---------|
| `verify` | Verify cryptographic validity of a claim bundle |
| `inspect` | Display bundle contents in human-readable form |

### Attestations, citations, and revocations

| Command | Purpose |
|---------|---------|
| `attest` | Add a third-party attestation |
| `attestations` | List attestations in a claim bundle |
| `cite` | Add a citation linking two claims |
| `citations` | List citations in a claim bundle |
| `revoke-key` | Revoke a key (self-signed or successor-signed) |
| `revocations` | List revocations in a directory |
| `witness` | Create a witness timestamp attestation |

### RFC 3161 timestamps

| Command | Purpose |
|---------|---------|
| `tsa-request` | Generate an RFC 3161 timestamp request |
| `tsa-attach` | Attach an RFC 3161 timestamp token |
| `timestamps` | List timestamps on a claim |

### ClaimPacks (distribution bundles)

| Command | Purpose |
|---------|---------|
| `pack` | Create a ClaimPack from a claim bundle |
| `verify-pack` | Verify a ClaimPack's manifest and signatures |
| `pack-inspect` | Inspect a ClaimPack's contents |
| `pack-sign` | Add a publisher or author signature to a pack |
| `pack-diff` | Compare two versions of a ClaimPack |
| `pack-validate-update` | Validate that a pack update is safe |

### Registry (offline citation resolution)

| Command | Purpose |
|---------|---------|
| `registry init` | Initialize a local claim registry |
| `registry add` | Add a claim bundle to the registry |
| `registry build` | Build the registry index for fast lookup |

### Publishing

| Command | Purpose |
|---------|---------|
| `publish` | Export a distribution-ready ClaimPack with verification gate |

## Exit codes

ClaimLedger uses CI-friendly exit codes:

| Code | Meaning |
|------|---------|
| 0 | Valid — signature verified |
| 3 | Broken — tampered content or invalid signature |
| 4 | Invalid input |
| 5 | Error |
| 6 | Revoked — cryptographically valid but signer key is revoked |

## Claim bundle format

```json
{
  "Version": "claim-bundle.v1",
  "Algorithms": {
    "Signature": "Ed25519",
    "Hash": "SHA-256",
    "Encoding": "UTF-8"
  },
  "Claim": {
    "ClaimId": "uuid",
    "Statement": "The claim being asserted",
    "AssertedAtUtc": "2024-06-15T12:00:00Z",
    "Evidence": [
      {
        "Type": "Dataset",
        "Hash": "sha256-hex",
        "Locator": "https://example.com/data.csv"
      }
    ],
    "Signature": "base64"
  },
  "Researcher": {
    "ResearcherId": "uuid",
    "PublicKey": "ed25519:base64",
    "DisplayName": "Dr. Jane Smith"
  }
}
```

## ClaimPacks

ClaimPacks are distribution-ready bundles that wrap a claim together with its citations, attestations, evidence, timestamps, and optionally CreatorLedger proofs. They are designed to be shared, verified, and diffed without any server.

```bash
# Create a pack from a claim bundle
claimledger pack claim.json \
  --evidence ./evidence/ \
  --out ./dist/my-pack/

# Sign a pack with publisher and author keys
claimledger pack-sign ./dist/my-pack/ \
  --publisher-key publisher.key.json \
  --author-key author.key.json

# Verify a pack (checks manifest, signatures, and content)
claimledger verify-pack ./dist/my-pack/

# Compare two versions of a pack
claimledger pack-diff ./dist/v1/ ./dist/v2/
```

The `publish` command combines pack creation, verification, and optional signing into a single step with a strict verification gate that blocks distribution if any check fails.

## What ClaimLedger is not

- **Not a truth oracle** — it verifies *who said what*, not *whether it's true*
- **Not peer review** — verification is cryptographic, not scientific
- **Not a paper repository** — claims are atomic; papers are containers
- **Not a blockchain** — works offline with optional anchoring
- **Not a trust system** — no reputation, no roots of trust, just math
