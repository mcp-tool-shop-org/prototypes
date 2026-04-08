---
title: Reference
description: Shared.Crypto internals, security model, data scope, and project architecture.
sidebar:
  order: 4
---

This page covers the shared cryptographic layer, security assumptions, data scope, and architectural decisions that apply across both ClaimLedger and CreatorLedger.

## Shared.Crypto

Both ledgers share a common cryptographic foundation through `Shared.Crypto`, located at `src/CreatorLedger/Shared.Crypto/`. This library provides three capabilities:

### Ed25519 signatures

All signatures in Ledger Suite use Ed25519 (RFC 8032):

- **Key size:** 32-byte public key, 64-byte signature
- **Properties:** Deterministic (same input always produces the same signature), fast verification, small keys
- **Usage:** Every claim assertion, attestation, citation, revocation, and proof bundle carries an Ed25519 signature

### SHA-256 hashing

Content integrity and event chaining both use SHA-256:

- **Content hashing:** Asset files and evidence are hashed to produce a 32-byte (64-character hex) digest
- **Event hashing:** Each ledger event is hashed over its canonical JSON representation, and the hash is included in the next event to form the chain
- **Hash format:** Lowercase hexadecimal, 64 characters

### Canonical JSON

All signed data uses deterministic JSON serialization to ensure that the same logical content always produces the same byte sequence:

- UTF-8 encoding, no BOM
- Compact (no whitespace)
- Null values included explicitly
- Property order controlled by schema
- Numbers use strict formatting (no leading zeros, no trailing decimals)
- Strings use minimal escaping

This determinism is critical. Without it, two semantically identical JSON objects could produce different byte sequences and therefore different signatures.

## Security model

### Data scope

Ledger Suite is local-first. Here is exactly what it touches and what it does not:

| Category | Details |
|----------|---------|
| **Data accessed** | Local SQLite databases, Ed25519 keypairs, claim/attestation records, proof bundles |
| **Data NOT accessed** | No cloud sync, no telemetry, no analytics, no external API calls |
| **Network** | Zero egress by default. RFC 3161 timestamping requires an external TSA endpoint when explicitly invoked. Publish commands target local or user-configured endpoints only. |
| **Telemetry** | None. No data is collected or transmitted. |

### Cryptographic considerations

- **Private keys are never transmitted.** They are stored locally and used only for signing operations.
- **Hash chains provide tamper evidence, not tamper prevention.** Physical access to the SQLite database allows modification, but any modification is detectable via chain verification.
- **RFC 3161 timestamping** requires contacting an external Timestamp Authority. This is the only network operation in the entire suite, and it is opt-in.
- **Proof bundles are self-contained.** Verify signatures before trusting imported bundles — a valid signature means the stated signer signed it, not that the signer is trustworthy.

### Threat model summary

Ledger Suite detects:
- Content modification after signing
- Signature forgery without the private key
- Payload tampering in attestations and events
- Event chain manipulation (reordering, deletion, insertion)
- Identity impersonation (wrong key)

Ledger Suite does not detect:
- A signer lying about what they know or created
- Private key compromise
- Timestamps before blockchain anchoring (self-reported)
- Whether content was human-made or AI-generated

### Security policy

Vulnerabilities can be reported to `64996768+mcp-tool-shop@users.noreply.github.com`. The response timeline targets acknowledgment within 48 hours, severity assessment within 7 days, and a fix within 30 days. Full details are in [SECURITY.md](https://github.com/mcp-tool-shop-org/ledger-suite/blob/main/SECURITY.md).

## Architecture

Both ledgers follow Clean Architecture with four layers:

```
┌───────────────────────────────────────┐
│              CLI Layer                │
│  Argument parsing, exit codes, I/O    │
└───────────────────────────────────────┘
                    │
┌───────────────────────────────────────┐
│          Application Layer            │
│  Commands, verification, export       │
└───────────────────────────────────────┘
                    │
┌───────────────────────────────────────┐
│            Domain Layer               │
│  Entities, value objects, rules       │
└───────────────────────────────────────┘
                    │
┌───────────────────────────────────────┐
│        Infrastructure Layer           │
│  SQLite, DPAPI, anchoring adapters    │
└───────────────────────────────────────┘
                    │
┌───────────────────────────────────────┐
│          Shared.Crypto                │
│  Ed25519, SHA-256, Canonical JSON     │
└───────────────────────────────────────┘
```

Dependencies flow inward. The Domain layer has zero external dependencies. The Application layer depends only on Domain. Infrastructure implements interfaces defined in Application.

### Storage

Both ledgers use SQLite with WAL (Write-Ahead Logging) mode for concurrent read access. CreatorLedger enforces append-only semantics through database triggers that prevent UPDATE and DELETE operations on the events table.

### Key management

| Vault | Platform | Use case |
|-------|----------|----------|
| DPAPI KeyVault | Windows only | Production — encrypts private keys at rest using Windows Data Protection API (CurrentUser scope) |
| InMemory KeyVault | All platforms | Testing and cross-platform use — keys exist only in process memory |

## Project metadata

| Field | Value |
|-------|-------|
| License | MIT |
| Language | C# / .NET 8 |
| Total tests | 590 (ClaimLedger 371 + CreatorLedger 219) |
| CI | GitHub Actions (Windows runner for DPAPI coverage) |
| Repository | [mcp-tool-shop-org/ledger-suite](https://github.com/mcp-tool-shop-org/ledger-suite) |
