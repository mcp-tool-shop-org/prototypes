# CodeTeam Suite

Package verification, approval, and signing for .NET.

## Overview

CodeTeam is a .NET CLI and library suite for verifying, approving, and signing software packages. It provides a deterministic, auditable pipeline for package integrity — from hash verification through Ed25519 signatures.

## Key Features

- **Package Verification** — SHA-256 hash checks with deterministic exit codes
- **Approval Workflow** — Structured approval with severity mapping and evidence
- **Digital Signing** — Ed25519 signatures for tamper-proof package attestation
- **Path-Traversal Protection** — Safe package reading with built-in security checks
- **JSON Output** — Machine-readable results with frozen schema contract
- **Golden Fixtures** — Deterministic test suite with 7 canonical verification scenarios

## NuGet Packages

```bash
dotnet tool install --global CodeTeam
dotnet add package CodeTeam.Core
dotnet add package CodeTeam.Crypto
dotnet add package CodeTeam.Packaging
```

## Links

- [GitHub Repository](https://github.com/mcp-tool-shop-org/codeteam-suite)
- [CodeTeam on NuGet](https://www.nuget.org/packages/CodeTeam)
- [MCP Tool Shop](https://github.com/mcp-tool-shop-org)
