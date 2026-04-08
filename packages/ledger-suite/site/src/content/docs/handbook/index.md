---
title: Welcome
description: An introduction to Ledger Suite — what it is, who it's for, and how the handbook is organized.
sidebar:
  order: 0
---

Ledger Suite is a unified monorepo containing two cryptographic provenance ledgers: **ClaimLedger** and **CreatorLedger**. Both are local-first, offline-capable .NET libraries that use Ed25519 signatures, SHA-256 hash chains, and optional RFC 3161 timestamps to answer a deceptively simple question: *who said what, and when?*

## What problems does it solve?

Scientific claims get lost in papers. Creative works get copied without attribution. In both cases the core issue is the same — there is no lightweight, portable, cryptographic proof of authorship or assertion.

Ledger Suite addresses this by giving researchers and creators a CLI-first toolkit that:

- **Signs** claims and attestations with Ed25519 keys
- **Hashes** evidence and content with SHA-256 so any modification is detectable
- **Chains** events into append-only ledgers that resist tampering
- **Bundles** everything into self-contained JSON files that verify offline, without trusting any server

No blockchain is required. No cloud sync. No accounts. Just math.

## The two ledgers

| Ledger | Purpose | Test count |
|--------|---------|------------|
| **ClaimLedger** | Scientific claim provenance — assertions, citations, attestations, revocations, and RFC 3161 timestamps | 371 |
| **CreatorLedger** | Creator attestation proofs — digital asset signing, derivation chains, and proof bundles | 219 |

Both share a common cryptographic foundation through `Shared.Crypto`, which provides Ed25519 signing, SHA-256 hashing, and canonical JSON serialization.

## Who is this for?

- **Researchers** who want cryptographic proof that they asserted a claim on a specific date, backed by specific evidence
- **Creators** who want tamper-evident attestations binding their identity to their digital assets
- **Reviewers and institutions** who want to add signed attestations (peer review, reproduction, approval) to existing claims
- **CI pipelines** that need machine-readable verification with well-defined exit codes

## Handbook contents

This handbook covers everything you need to get productive with Ledger Suite:

1. **[Getting Started](/ledger-suite/handbook/getting-started/)** — Clone, build, test, and understand the directory structure
2. **[ClaimLedger](/ledger-suite/handbook/claimledger/)** — Scientific claim provenance: assertions, citations, attestations, revocations, timestamps, and ClaimPacks
3. **[CreatorLedger](/ledger-suite/handbook/creatorledger/)** — Creator attestation proofs: asset signing, derivation chains, and proof bundles
4. **[Reference](/ledger-suite/handbook/reference/)** — Shared.Crypto internals, security model, data scope, and project architecture
5. **[Beginners Guide](/ledger-suite/handbook/beginners/)** — Step-by-step walkthrough for newcomers: first claim, first proof, and common workflows
