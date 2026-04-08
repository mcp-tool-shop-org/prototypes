---
title: Architecture
description: The 4-layer architecture of CodeTeam Suite -- Core, Crypto, Packaging, and CLI.
sidebar:
  order: 2
---

CodeTeam Suite is organized as four .NET libraries with strict dependency direction. Each layer has a single responsibility, and the boundaries are enforced by project references.

## Layer diagram

```
CodeTeam.Cli        → CLI entry point (codeteam verify / approve / sign)
    │
CodeTeam.Packaging  → Package loading and verification
    │
CodeTeam.Crypto     → Ed25519 signatures, SHA-256 hashing
    │
CodeTeam.Core       → Domain models, status codes, error types
```

Dependencies flow downward only. The CLI depends on Packaging, Packaging depends on Crypto, and Crypto depends on Core. No layer references a layer above it.

## CodeTeam.Core

The foundation layer. It defines:

- **Domain models** -- package manifests, approval records, signature records, and policy objects
- **Status codes** -- the 7 verification outcomes (`OK_VERIFIED`, `OK_UNSIGNED`, `FAIL_INTEGRITY`, `FAIL_SCHEMA`, `FAIL_SIGNATURE`, `FAIL_THRESHOLD`, `FAIL_UNAUTHORIZED`)
- **Error types** -- structured error shapes with codes, messages, and hints
- **Canonical JSON** -- deterministic JSON serialization so that digests are reproducible across implementations
- **Quorum policy evaluation** -- threshold-based approval counting with allowlists, purpose filtering, and deduplication by key ID

Core has no cryptographic dependencies. It works with pre-computed digests and pre-verified signatures.

## CodeTeam.Crypto

The cryptographic layer. It provides two operations:

- **Ed25519 signature verification** -- validates that a signature was produced by the claimed key, using NSec.Cryptography
- **SHA-256 digest computation** -- computes file digests for integrity verification

This layer has no knowledge of packages or manifests. It operates on raw bytes and returns boolean results.

## CodeTeam.Packaging

The integration layer. It connects Core models to the filesystem:

- **Package loading** -- reads package directories or zip archives, resolving manifests, approval records, and signature records
- **Path-traversal protection** -- rejects paths containing `..`, absolute paths, or backslash separators
- **Schema validation** -- validates manifest and record JSON against the v0.1 schemas
- **Integrity verification** -- checks that every referenced artifact exists, matches the declared size, and has the correct SHA-256 digest

## CodeTeam.Cli

The user-facing layer. It exposes three commands:

- `codeteam verify` -- run the full verification pipeline and report results
- `codeteam approve` -- add a signed approval attestation to a package
- `codeteam sign` -- apply a final signature to seal a package

All commands support `--json` for structured machine-readable output. Exit codes map directly to the status codes defined in Core.

## Editor extensions

VS Code and Visual Studio extensions are thin clients. They invoke the CLI as a subprocess, parse the JSON output, and render results. Extensions never implement verification logic -- that responsibility belongs entirely to CodeTeam Suite.

This design ensures that all editors produce identical verification results, because they all delegate to the same authoritative implementation.

## Package layout

A CodeTeam package is a directory (or zip) with this structure:

```
codeteam.manifest.json          # required: canonical manifest
signatures/
  approvals.jsonl               # required: append-only approval records
  signatures.jsonl              # required: append-only signature records
artifacts/                      # optional: referenced files
evidence/                       # optional: evidence files
README.md                       # optional
```

Path rules are strict: all paths must be relative, use forward slashes, and must not contain `..` segments. Absolute paths are forbidden.
