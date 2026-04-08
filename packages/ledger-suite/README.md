<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ledger-suite/readme.png" width="400" alt="Ledger Suite">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ledger-suite/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ledger-suite/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/ledger-suite/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/ledger-suite/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Unified monorepo for cryptographic provenance ledgers.

## Projects

| Project | Description | Tests |
|---------|-------------|-------|
| `src/ClaimLedger/` | Scientific claim provenance and verification | 371 |
| `src/CreatorLedger/` | Creator attestation proofs | 219 |
| `src/CreatorLedger/Shared.Crypto/` | Shared Ed25519 cryptography primitives | - |

## Quick Start

```bash
# Clone
git clone https://github.com/mcp-tool-shop-org/ledger-suite.git
cd ledger-suite

# Build all
dotnet build ledger-suite.sln

# Test all
dotnet test ledger-suite.sln

# Run ClaimLedger CLI
dotnet run --project src/ClaimLedger/ClaimLedger.Cli -- --help

# Run CreatorLedger CLI
dotnet run --project src/CreatorLedger/CreatorLedger.Cli -- --help
```

## Structure

```
ledger-suite/
├── ledger-suite.sln          # Root solution
├── src/
│   ├── ClaimLedger/          # Scientific claims
│   │   ├── ClaimLedger.Domain/
│   │   ├── ClaimLedger.Application/
│   │   ├── ClaimLedger.Infrastructure/
│   │   ├── ClaimLedger.Cli/
│   │   └── ClaimLedger.Tests/
│   └── CreatorLedger/        # Creator proofs
│       ├── CreatorLedger.Domain/
│       ├── CreatorLedger.Application/
│       ├── CreatorLedger.Infrastructure/
│       ├── CreatorLedger.Cli/
│       ├── CreatorLedger.Tests/
│       └── Shared.Crypto/    # Shared crypto
```

## ClaimLedger Features

- **Claim assertion** with Ed25519 signatures
- **Citations** linking claims with cryptographic proof
- **Attestations** (peer review, reproduction, institutional approval)
- **Revocations** with witness countersignatures
- **RFC 3161 timestamps** for non-repudiation
- **ClaimPacks** for distribution-ready bundles (create, verify, sign, diff, inspect)
- **Local registry** for offline citation resolution (init, add, build)
- **Publish command** for one-click distribution with strict verification gates

## CreatorLedger Features

- **Creator attestation proofs** for digital assets
- **Content hash verification**
- **Multi-party attestation chains**
- **Proof bundles** for portable verification

## Security & Data Scope

Ledger Suite is a **local-first** collection of cryptographic provenance ledgers.

- **Data accessed:** Local SQLite databases, Ed25519 keypairs, claim/attestation records, proof bundles
- **Data NOT accessed:** No cloud sync. No telemetry. No analytics. No external API calls
- **Cryptography:** Ed25519 signatures, SHA-256 hash chains, RFC 3161 timestamps
- **No telemetry** is collected or sent

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

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
