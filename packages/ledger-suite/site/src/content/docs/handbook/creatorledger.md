---
title: CreatorLedger
description: Creator attestation proofs — digital asset signing, derivation chains, proof bundles, and trust levels.
sidebar:
  order: 3
---

CreatorLedger proves **who created what, when** using Ed25519 signatures, append-only event chains, and optional blockchain anchoring. It is designed for creators who need tamper-evident proof of authorship for digital assets — without relying on any cloud service.

## Core concepts

### Creator identity

A creator identity is an Ed25519 key pair. The public key acts as the creator's identifier. On Windows, private keys are protected by DPAPI (CurrentUser scope). An in-memory key vault is available for cross-platform use and testing.

### Asset attestation

When a creator attests to an asset, CreatorLedger:

1. Computes a SHA-256 hash of the asset file
2. Builds a canonical JSON signable containing the asset ID, content hash, creator ID, and timestamp
3. Signs the signable with the creator's Ed25519 private key
4. Appends the attestation as an event in the ledger chain

The result is a cryptographic binding between a creator's identity and a specific version of a file.

### Derivation chains

When work is derived from other work, CreatorLedger tracks the relationship:

```json
{
  "DerivedFromAssetId": "<parent-asset-guid>",
  "DerivedFromAttestationId": "<parent-attestation-guid>"
}
```

This creates a verifiable provenance graph. A remix points back to the original. A translation points back to the source. The chain is cryptographically enforced — you cannot claim derivation from a nonexistent parent.

### Event chain

All ledger operations produce events that form an append-only hash chain:

```
[Genesis] --hash--> [CreatorCreated] --hash--> [AssetAttested] --hash--> [LedgerAnchored]
```

The chain is enforced by:

- **SQLite triggers** — no UPDATE or DELETE operations are permitted
- **Sequence ordering** — events are ordered by `seq`, not timestamps
- **Previous hash verification** — each event includes the SHA-256 hash of the preceding event

Any attempt to modify, reorder, or delete events breaks the chain and is detectable during verification.

### Proof bundles

Proof bundles are self-contained JSON files that carry everything needed for offline verification:

```json
{
  "version": "proof.v1",
  "algorithms": {
    "signature": "Ed25519",
    "hash": "SHA-256",
    "encoding": "UTF-8"
  },
  "assetId": "...",
  "attestations": [...],
  "creators": [...],
  "ledgerTipHash": "...",
  "anchor": null
}
```

A proof bundle includes the attestation(s), creator public keys, and optionally a blockchain anchor. The verifier needs nothing else.

## Trust levels

Verification produces one of five trust levels:

| Level | Signature | Hash | Anchor | Derivation |
|-------|-----------|------|--------|------------|
| **Verified Original** | Valid | Match | Present | None |
| **Signed** | Valid | Match | None | None |
| **Derived** | Valid | Match | Any | Has parent |
| **Unverified** | N/A | N/A | N/A | N/A |
| **Broken** | Invalid | Mismatch | Any | Any |

- **Verified Original** — The strongest level. Signature is valid and the attestation is anchored to a blockchain.
- **Signed** — Signature is valid but no blockchain anchor exists yet.
- **Derived** — The asset is signed but declared as derived from another signed work.
- **Unverified** — Structurally valid bundle but no attestation could be verified.
- **Broken** — Tamper detected. Either the signature is invalid or the content hash does not match.

## CLI commands

```bash
# Verify a proof bundle
creatorledger verify proof.json

# Verify with the actual asset file (checks content hash)
creatorledger verify proof.json --asset artwork.png

# Verbose output showing each verification step
creatorledger verify proof.json --verbose

# Machine-readable JSON output for CI pipelines
creatorledger verify proof.json --json

# Inspect bundle structure (human-readable)
creatorledger inspect proof.json

# Inspect bundle structure (JSON output)
creatorledger inspect proof.json --json
```

The `verify` command checks Ed25519 signatures, content hashes (when `--asset` is provided), and anchor status. It outputs a trust level and returns a CI-friendly exit code.

## Exit codes

| Code | Status | Meaning |
|------|--------|---------|
| 0 | Verified | Signature and content hash are valid |
| 2 | Unverified | Structurally valid but cannot verify |
| 3 | Broken | Tamper detected |
| 4 | Invalid input | Bad JSON or wrong version |
| 5 | Error | Runtime failure |

## Platform support

| Component | Windows | Linux | macOS |
|-----------|---------|-------|-------|
| CLI Verifier | Yes | Yes | Yes |
| Core Library | Yes | Yes | Yes |
| DPAPI KeyVault | Yes | No | No |
| InMemory KeyVault | Yes | Yes | Yes |

The DPAPI key vault uses Windows Data Protection API to encrypt private keys at rest. On Linux and macOS, use the in-memory key vault or implement a platform-specific adapter.

## Threat model

### What CreatorLedger detects

- Content modification after attestation
- Signature forgery (without the private key)
- Attestation payload tampering
- Event chain manipulation (reordering, deletion)
- Creator impersonation (wrong key)

### What CreatorLedger does not detect

- A creator lying about authorship (the signature proves *who signed*, not *who created*)
- Private key compromise (if someone has your key, they can sign as you)
- Pre-anchor timestamp manipulation (timestamps are self-reported until blockchain-anchored)
- Whether content was created by a human or AI

## Blockchain anchoring

CreatorLedger includes an anchoring abstraction. The current release ships with a `NullAnchor` for testing. A Polygon adapter is planned for a future release. Anchoring upgrades a "Signed" trust level to "Verified Original" by committing the ledger root hash to an immutable public chain.
