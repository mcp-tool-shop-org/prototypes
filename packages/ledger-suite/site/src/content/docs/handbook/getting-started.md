---
title: Getting Started
description: Clone, build, test, and explore the Ledger Suite monorepo.
sidebar:
  order: 1
---

This guide walks you through cloning the repository, building both ledgers, running the full test suite, and understanding the project layout.

## Prerequisites

- **.NET 8 SDK** or later — [download here](https://dotnet.microsoft.com/en-us/download)
- **Git** — for cloning the repository

No other dependencies are required. Ledger Suite has zero external runtime dependencies beyond the .NET base class library.

## Clone and build

```bash
git clone https://github.com/mcp-tool-shop-org/ledger-suite.git
cd ledger-suite

# Build all projects in the monorepo
dotnet build ledger-suite.sln
```

The root solution file `ledger-suite.sln` includes both ClaimLedger and CreatorLedger along with their test projects. A single `dotnet build` compiles everything.

## Run the test suite

```bash
# Run all 590 tests across both ledgers
dotnet test ledger-suite.sln
```

ClaimLedger contributes 371 tests and CreatorLedger contributes 219. The tests cover signature verification, hash chain integrity, bundle serialization, revocation semantics, and more.

## Try the CLIs

Both ledgers ship a CLI project for direct interaction:

```bash
# ClaimLedger CLI — see all available commands
dotnet run --project src/ClaimLedger/ClaimLedger.Cli -- --help

# CreatorLedger CLI — see all available commands
dotnet run --project src/CreatorLedger/CreatorLedger.Cli -- --help
```

### Verify a sample claim

```bash
dotnet run --project src/ClaimLedger/ClaimLedger.Cli -- verify src/ClaimLedger/samples/sample-claim.json
```

### Verify a sample proof bundle

```bash
dotnet run --project src/CreatorLedger/CreatorLedger.Cli -- verify src/CreatorLedger/samples/sample-bundle.json
```

Both CLIs return well-defined exit codes suitable for CI integration. See the [ClaimLedger](/ledger-suite/handbook/claimledger/) and [CreatorLedger](/ledger-suite/handbook/creatorledger/) pages for full exit code tables.

## Directory structure

```
ledger-suite/
├── ledger-suite.sln              # Root solution (builds everything)
├── src/
│   ├── ClaimLedger/              # Scientific claim provenance
│   │   ├── ClaimLedger.Domain/       # Claims, Evidence, Citations, Attestations, Revocations
│   │   ├── ClaimLedger.Application/  # Commands, verification, bundle export
│   │   ├── ClaimLedger.Infrastructure/ # Storage adapters
│   │   ├── ClaimLedger.Cli/          # CLI entry point (verify, inspect, attest, cite, ...)
│   │   ├── ClaimLedger.Tests/        # 371 tests
│   │   ├── docs/                     # Detailed specs (revocations, timestamping, RFC 3161)
│   │   └── samples/                  # Sample claim bundles
│   └── CreatorLedger/            # Creator attestation proofs
│       ├── CreatorLedger.Domain/     # CreatorIdentity, AssetAttestation, LedgerEvent
│       ├── CreatorLedger.Application/# CreateIdentity, AttestAsset, Verify, Export, Anchor
│       ├── CreatorLedger.Infrastructure/ # SQLite (WAL), DPAPI KeyVault, NullAnchor
│       ├── CreatorLedger.Cli/        # CLI entry point (verify, inspect)
│       ├── CreatorLedger.Tests/      # 219 tests
│       ├── Shared.Crypto/           # Ed25519, SHA-256, Canonical JSON (shared)
│       └── samples/                  # Sample proof bundles
└── site/                         # Landing page and handbook (Astro + Starlight)
```

## Architecture pattern

Both ledgers follow Clean Architecture with four layers:

1. **Domain** — Core entities, value objects, and domain rules. No external dependencies.
2. **Application** — Use cases and commands. Depends only on Domain.
3. **Infrastructure** — Storage (SQLite), key management (DPAPI), and external adapters. Implements interfaces defined in Application.
4. **CLI** — Thin console entry point that wires up the layers and parses arguments.

This separation means you can reference the Domain and Application layers from your own .NET code without pulling in SQLite or any infrastructure concern.

## Building individual projects

If you only need one ledger, each has its own solution file:

```bash
# Build only ClaimLedger
dotnet build src/ClaimLedger/ClaimLedger.sln

# Build only CreatorLedger
dotnet build src/CreatorLedger/CreatorLedger.sln
```

## Publishing a self-contained CLI

```bash
# CreatorLedger CLI as a single-file executable (Windows)
dotnet publish src/CreatorLedger/CreatorLedger.Cli -c Release -r win-x64 --self-contained

# ClaimLedger CLI as a single-file executable (Linux)
dotnet publish src/ClaimLedger/ClaimLedger.Cli -c Release -r linux-x64 --self-contained
```

The resulting binary requires no .NET runtime on the target machine.
