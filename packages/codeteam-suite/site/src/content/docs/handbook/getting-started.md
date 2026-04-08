---
title: Getting Started
description: Install CodeTeam Suite, configure NuGet packages, and build from source.
sidebar:
  order: 1
---

This page walks you through installing the CodeTeam global tool, understanding the NuGet package structure, and building the suite from source.

## Install the CLI

CodeTeam is distributed as a .NET global tool. Install it with a single command:

```bash
dotnet tool install -g CodeTeam
```

Once installed, the `codeteam` command is available system-wide. Verify the installation by running:

```bash
codeteam --help
```

## NuGet packages

CodeTeam Suite ships as four NuGet packages, each with a single responsibility:

| Package | Description |
|---------|-------------|
| **CodeTeam** | .NET global tool for package verification, approval, and signing. This is the CLI entry point. |
| **CodeTeam.Core** | Domain models, verification logic, canonical JSON processing, and quorum-based policy evaluation. |
| **CodeTeam.Crypto** | Ed25519 signature verification and SHA-256 digest computation via NSec.Cryptography. |
| **CodeTeam.Packaging** | Package reading and verification with path-traversal protection and JSON schema validation. |

If you are building an integration or extension, reference `CodeTeam.Core` and `CodeTeam.Packaging` directly. The CLI package (`CodeTeam`) is only needed for command-line use.

## Building from source

Clone the repository and build with the standard .NET CLI:

```bash
git clone https://github.com/mcp-tool-shop-org/codeteam-suite.git
cd codeteam-suite
dotnet build
```

Run the test suite to verify everything is working:

```bash
dotnet test
```

The tests include golden fixture validation, schema compliance checks, and interop smoke tests that enforce the stability guarantees documented in the contract.

## Prerequisites

- .NET 8.0 SDK or later
- No additional dependencies required -- all cryptographic operations use NSec.Cryptography, which is included as a NuGet dependency

## What's next

Once you have the tool installed, head to [Usage](/codeteam-suite/handbook/usage/) to learn the CLI commands, or read [Architecture](/codeteam-suite/handbook/architecture/) to understand how the four layers fit together.
