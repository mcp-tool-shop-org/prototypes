---
title: Beginners Guide
description: Step-by-step walkthrough for newcomers to Ledger Suite — your first claim, your first proof, and common workflows.
sidebar:
  order: 99
---

This guide walks you through the most common Ledger Suite tasks from scratch. By the end you will have created, signed, and verified both a scientific claim (ClaimLedger) and a creator attestation (CreatorLedger).

## 1. What is Ledger Suite?

Ledger Suite is a local-first toolkit for cryptographic provenance. It answers two questions:

- **ClaimLedger:** Who asserted this scientific claim, and when?
- **CreatorLedger:** Who created this digital asset, and when?

Both ledgers use Ed25519 signatures and SHA-256 hashes. Everything runs offline. There are no accounts, no cloud services, and no blockchain required (though optional anchoring is supported).

If you have not installed Ledger Suite yet, follow the [Getting Started](/ledger-suite/handbook/getting-started/) page first.

## 2. Prerequisites

- **.NET 8 SDK** or later installed
- The repository cloned and built:

```bash
git clone https://github.com/mcp-tool-shop-org/ledger-suite.git
cd ledger-suite
dotnet build ledger-suite.sln
```

All examples below assume you are in the `ledger-suite/` root directory.

## 3. Your first claim (ClaimLedger)

### Create a researcher identity

Every claim needs a signer. Generate an Ed25519 key pair:

```bash
dotnet run --project src/ClaimLedger/ClaimLedger.Cli -- identity create \
  --name "Dr. Jane Smith" \
  --out researcher.key.json
```

This produces a JSON file containing your public key, private key, and display name. Keep the private key safe — anyone who has it can sign claims as you.

### Assert a claim

Create a claim with a statement and optional evidence references:

```bash
dotnet run --project src/ClaimLedger/ClaimLedger.Cli -- assert \
  --statement "Compound X reduces inflammation by 40% in vitro" \
  --signer-key researcher.key.json \
  --out my-claim.json
```

The output file `my-claim.json` is a self-contained claim bundle. It includes the statement, a timestamp, the researcher's public key, and an Ed25519 signature over the canonical JSON representation.

### Verify the claim

```bash
dotnet run --project src/ClaimLedger/ClaimLedger.Cli -- verify my-claim.json
```

A successful verification exits with code 0 and prints the claim details. If the file has been tampered with, verification exits with code 3 (Broken).

### Verify the included sample

The repository ships with a pre-signed sample claim you can verify immediately:

```bash
dotnet run --project src/ClaimLedger/ClaimLedger.Cli -- verify src/ClaimLedger/samples/sample-claim.json
```

## 4. Your first proof (CreatorLedger)

### Verify a proof bundle

CreatorLedger ships a sample proof bundle. Verify it:

```bash
dotnet run --project src/CreatorLedger/CreatorLedger.Cli -- verify src/CreatorLedger/samples/sample-bundle.json
```

The output shows the trust level (Signed, Verified Original, Derived, Unverified, or Broken), the asset ID, creator information, and signature status.

### Verify with an asset file

When you have the actual asset file, CreatorLedger can verify that the content hash matches the attestation:

```bash
dotnet run --project src/CreatorLedger/CreatorLedger.Cli -- verify proof.json --asset artwork.png
```

If the file has been modified since attestation, the hash will not match and verification will report Broken.

### Inspect a bundle

To see what a proof bundle contains without running verification:

```bash
dotnet run --project src/CreatorLedger/CreatorLedger.Cli -- inspect src/CreatorLedger/samples/sample-bundle.json
```

This displays the bundle version, asset ID, attestation count, creator list, algorithms, and anchor status.

## 5. Understanding exit codes

Both CLIs use CI-friendly exit codes. This makes them suitable for automated pipelines.

**ClaimLedger exit codes:**

| Code | Meaning |
|------|---------|
| 0 | Valid — signature verified |
| 3 | Broken — tampered content or invalid signature |
| 4 | Invalid input (bad JSON, missing file) |
| 5 | Runtime error |
| 6 | Revoked — valid signature but signer key is revoked |

**CreatorLedger exit codes:**

| Code | Meaning |
|------|---------|
| 0 | Verified — signature and content hash valid |
| 2 | Unverified — structurally valid but cannot verify |
| 3 | Broken — tamper detected |
| 4 | Invalid input |
| 5 | Runtime error |

You can use these in shell scripts:

```bash
dotnet run --project src/ClaimLedger/ClaimLedger.Cli -- verify my-claim.json
if [ $? -eq 0 ]; then
  echo "Claim is valid"
else
  echo "Claim verification failed"
fi
```

## 6. Common workflows

### Adding an attestation to a claim

After a peer reviews your claim, they can add a signed attestation without modifying the original claim signature:

```bash
dotnet run --project src/ClaimLedger/ClaimLedger.Cli -- attest my-claim.json \
  --type REVIEWED \
  --statement "Methodology verified, results consistent" \
  --attestor-key reviewer.key.json \
  --out my-claim.attested.json
```

Valid attestation types: `REVIEWED`, `REPRODUCED`, `INSTITUTION_APPROVED`, `DATA_AVAILABILITY_CONFIRMED`, `WITNESSED_AT`.

### Adding a citation

Link your claim to prior work:

```bash
dotnet run --project src/ClaimLedger/ClaimLedger.Cli -- cite my-claim.json \
  --bundle cited-claim.json \
  --relation DEPENDS_ON \
  --signer-key researcher.key.json \
  --embed \
  --out my-claim.cited.json
```

Valid citation relations: `CITES`, `DEPENDS_ON`, `REPRODUCES`, `DISPUTES`.

### Creating a ClaimPack for distribution

Bundle a claim with all its supporting material into a shareable pack:

```bash
dotnet run --project src/ClaimLedger/ClaimLedger.Cli -- pack my-claim.json \
  --evidence ./evidence/ \
  --out ./dist/my-pack/
```

Then verify the pack:

```bash
dotnet run --project src/ClaimLedger/ClaimLedger.Cli -- verify-pack ./dist/my-pack/
```

### Publishing with a verification gate

The `publish` command creates a ClaimPack and runs a strict verification gate before writing output. If any check fails, the pack is not published:

```bash
dotnet run --project src/ClaimLedger/ClaimLedger.Cli -- publish my-claim.json \
  --out ./published/my-claim.zip \
  --sign-pack \
  --publisher-key publisher.key.json \
  --report ./published/report.json
```

## 7. Next steps

- Read the [ClaimLedger](/ledger-suite/handbook/claimledger/) page for complete details on revocations, RFC 3161 timestamps, and the full claim bundle format
- Read the [CreatorLedger](/ledger-suite/handbook/creatorledger/) page for derivation chains, trust levels, and blockchain anchoring
- Read the [Reference](/ledger-suite/handbook/reference/) page for Shared.Crypto internals, the security model, and architectural decisions
- Explore the sample files in `src/ClaimLedger/samples/` and `src/CreatorLedger/samples/`
- Run the full test suite with `dotnet test ledger-suite.sln` to see all 590 tests pass
