<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/codeteam-suite/readme.png" alt="CodeTeam Suite" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/codeteam-suite/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/codeteam-suite/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/codeteam-suite/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**The authoritative CodeTeam implementation** — a .NET-based CLI and library for package verification, approval, and signing.

## Status

**v1.0.2 Released** — Cryptographic trust loop complete. Interop contract locked.

### What's Stable

The following are frozen and CI-protected:

| Artifact | Location | Guarantee |
|----------|----------|-----------|
| JSON schemas | `/schemas/*.v0.1.json` | Additive changes only |
| CLI `verify --json` output | `codeteam.cli.verify.schema.v0.1.json` | Backward compatible |
| Error codes | `ErrorCode.cs` | No removals or renames |
| Severity mapping | `severity-map.v0.1.json` | New codes require mapping |

Interop smoke tests enforce these guarantees. Breaking changes fail CI.

## NuGet Packages

| Package | Description |
|---------|-------------|
| `CodeTeam` | .NET global tool for package verification, approval, and signing. Install with `dotnet tool install -g CodeTeam`. |
| `CodeTeam.Core` | Domain models, verification logic, canonical JSON, and quorum-based policy evaluation. |
| `CodeTeam.Crypto` | Ed25519 signature verification and SHA-256 digest computation via NSec.Cryptography. |
| `CodeTeam.Packaging` | Package reading and verification with path-traversal protection and JSON schema validation. |

## Overview

CodeTeam Suite is the "one truth" implementation that all editor extensions (VS Code, Visual Studio) delegate to. Extensions invoke the CLI and render results; they do NOT implement verification logic.

## Architecture

```
CodeTeam.Core       → Domain models, status codes, error types
CodeTeam.Crypto     → Ed25519 signatures, SHA-256 hashing
CodeTeam.Packaging  → Package loading and verification
CodeTeam.Cli        → CLI entry point (codeteam verify/approve/sign)
```

## CLI Usage

```bash
# Verify a package
codeteam verify <package-path> --json

# Approve a package
codeteam approve <package-path> --key <key-id> --json

# Sign a package
codeteam sign <package-path> --key <key-id> --json
```

## Exit Codes

| Code | Status | Meaning |
|------|--------|---------|
| 0 | OK_VERIFIED | Package verified with valid signature |
| 1 | OK_UNSIGNED | Package valid but unsigned |
| 2 | FAIL_INTEGRITY | Missing file, size/digest mismatch |
| 3 | FAIL_SCHEMA | Schema validation failed |
| 4 | FAIL_SIGNATURE | Signature verification failed |
| 5 | FAIL_THRESHOLD | Approval threshold not met |
| 6 | FAIL_UNAUTHORIZED | Actor not authorized |

## Documentation

- [CONTRACT.md](CONTRACT.md) — Authoritative package semantics
- [VERIFICATION.md](VERIFICATION.md) — Normative verification rules
- [docs/EDITOR_INTEGRATION.md](docs/EDITOR_INTEGRATION.md) — Editor extension contract (VS Code, Visual Studio)
- [docs/PRESS_KIT.md](docs/PRESS_KIT.md) — Release marketing materials
- [docs/sealing.md](docs/sealing.md) — Sealing design (informative)

## Golden Fixtures

Test fixtures define expected verification outcomes:

| Fixture | Expected Status |
|---------|-----------------|
| `fixtures/minimal_unsigned/` | OK_UNSIGNED |
| `fixtures/approved_threshold_met/` | OK_UNSIGNED |
| `fixtures/signed_verified/` | OK_VERIFIED |
| `fixtures/tampered_artifact/` | FAIL_INTEGRITY |
| `fixtures/invalid_manifest/` | FAIL_SCHEMA |
| `fixtures/signed_verified_real/` | OK_VERIFIED |
| `fixtures/signed_invalid_sig/` | FAIL_SIGNATURE |

## Building

```bash
dotnet build
dotnet test
```

## Security & Data Scope

CodeTeam Suite is a **local-first** CLI and library for cryptographic package verification.

- **Data accessed:** Reads package manifests, approvals, and signatures for cryptographic verification (Ed25519 + SHA-256). Writes approval/signature records to package directories.
- **Data NOT accessed:** No network requests (except optional XRPL anchoring). No telemetry. No cloud services.
- **Permissions:** File system read/write for package directories. No elevated permissions.

Full policy: [SECURITY.md](SECURITY.md)

---

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10/10 |
| B. Error Handling | 10/10 |
| C. Operator Docs | 10/10 |
| D. Shipping Hygiene | 10/10 |
| E. Identity (soft) | 10/10 |
| **Overall** | **50/50** |

---

## License

MIT

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
