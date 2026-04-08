---
title: CodeTeam Suite Handbook
description: Complete reference for the authoritative .NET CLI and library for package verification, approval, and signing.
sidebar:
  order: 0
---

Welcome to the CodeTeam Suite handbook. This guide covers everything you need to verify, approve, and sign packages with the authoritative .NET implementation.

## What is CodeTeam Suite?

CodeTeam Suite is an offline-first .NET CLI and library that provides deterministic cryptographic package verification. It is the single source of truth that all editor extensions (VS Code, Visual Studio) delegate to. Extensions invoke the CLI and render results -- they never implement verification logic themselves.

The core workflow centers on three operations:

- **Verify** -- check that a package is intact, schema-valid, and properly signed
- **Approve** -- add a signed attestation as an authorized approver
- **Sign** -- apply a final cryptographic signature to seal the package

## Handbook contents

- [Getting Started](/codeteam-suite/handbook/getting-started/) -- Install the NuGet packages and build from source
- [Architecture](/codeteam-suite/handbook/architecture/) -- Understand the 4-layer design (Core, Crypto, Packaging, CLI)
- [Usage](/codeteam-suite/handbook/usage/) -- Run the CLI commands and work with golden test fixtures
- [Reference](/codeteam-suite/handbook/reference/) -- Exit codes, documentation links, security scope, and verification rules

## Design principles

CodeTeam Suite follows five non-negotiable design principles:

1. **Offline-first** -- all core workflows function without network access
2. **Deterministic verification** -- results depend only on package contents and documented rules
3. **No-lies policy** -- a package is never reported as verified unless all checks pass
4. **Append-only coordination** -- approvals and signatures accumulate without mutating what was signed
5. **Editor-agnostic truth** -- packages are verifiable independently of any editor or UI

## Current status

v1.0.2 is released with the cryptographic trust loop complete and the interop contract locked. The following artifacts are frozen and CI-protected:

| Artifact | Guarantee |
|----------|-----------|
| JSON schemas (`/schemas/*.v0.1.json`) | Additive changes only |
| CLI `verify --json` output | Backward compatible |
| Error codes (`ErrorCode.cs`) | No removals or renames |
| Severity mapping (`severity-map.v0.1.json`) | New codes require mapping |

Interop smoke tests enforce these guarantees. Breaking changes fail CI.
