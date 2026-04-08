<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ledger-suite/readme.png" width="400" alt="Ledger Suite">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ledger-suite/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ledger-suite/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/ledger-suite/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/ledger-suite/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Dépôt unique pour les registres de traçabilité cryptographique.

## Projets

| Projet | Description | Tests |
| --------- | ------------- | ------- |
| `src/ClaimLedger/` | Traçabilité et vérification des affirmations scientifiques. | 371 |
| `src/CreatorLedger/` | Preuves d'attestation de l'auteur. | 219 |
| `src/CreatorLedger/Shared.Crypto/` | Primitives cryptographiques Ed25519 partagées. | - |

## Démarrage rapide

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

## Fonctionnalités de ClaimLedger

- **Affirmation** avec signatures Ed25519.
- **Citations** reliant les affirmations à une preuve cryptographique.
- **Attestations** (revue par les pairs, reproduction, approbation institutionnelle).
- **Révocations** avec signatures de témoins.
- **Horodatages RFC 3161** pour la non-répudiation.
- **ClaimPacks** pour des ensembles prêts à être distribués.
- **Registre local** pour la résolution de citations hors ligne.
- **Commande de publication** pour une distribution en un clic.

## Fonctionnalités de CreatorLedger

- **Preuves d'attestation de l'auteur** pour les actifs numériques.
- **Vérification de la somme de contrôle du contenu**.
- **Chaînes d'attestation multipartites**.
- **Ensembles de preuves** pour une vérification portable.

## Licence

MIT

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
