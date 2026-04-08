<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ledger-suite/readme.png" width="400" alt="Ledger Suite">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ledger-suite/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ledger-suite/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/ledger-suite/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/ledger-suite/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Un repository unificato per i registri di provenienza crittografica.

## Progetti

| Progetto | Descrizione | Test |
| --------- | ------------- | ------- |
| `src/ClaimLedger/` | Provenienza e verifica delle affermazioni scientifiche | 371 |
| `src/CreatorLedger/` | Prove di attestazione del creatore | 219 |
| `src/CreatorLedger/Shared.Crypto/` | Funzionalità crittografiche Ed25519 condivise | - |

## Guida rapida

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

## Struttura

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

## Funzionalità di ClaimLedger

- **Asserzione di una richiesta** con firme Ed25519
- **Citazioni** che collegano le richieste con una prova crittografica
- **Attestazioni** (revisione paritaria, riproduzione, approvazione istituzionale)
- **Revoche** con firme di controprova
- **Timestamp RFC 3161** per la non ripudiabilità
- **ClaimPacks** per pacchetti pronti per la distribuzione
- **Registro locale** per la risoluzione delle citazioni offline
- **Comando di pubblicazione** per la distribuzione con un solo clic

## Funzionalità di CreatorLedger

- **Prove di attestazione del creatore** per asset digitali
- **Verifica dell'hash del contenuto**
- **Catene di attestazione multi-parte**
- **Pacchetti di prove** per la verifica portatile

## Licenza

MIT

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
