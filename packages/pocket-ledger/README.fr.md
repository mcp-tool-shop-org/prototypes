<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/pocket-ledger/readme.png" width="400" alt="Pocket Ledger">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/pocket-ledger/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Une application pour Windows de gestion financière personnelle et de suivi du budget, conçue pour fonctionner principalement en local. Simple, épurée et axée sur la confidentialité.

## Philosophie

- **Priorité à la localité :** Vos données financières restent sur votre appareil. Aucune synchronisation avec le cloud n'est requise.
- **Confidentialité par conception :** Zéro télémétrie, aucune connexion externe sauf si vous y consentez explicitement.
- **Budgétisation par enveloppes :** Méthodologie éprouvée qui attribue une fonction à chaque euro.
- **Axée sur les objectifs :** Concentrez-vous sur ce pour quoi vous économisez, et non seulement sur ce que vous dépensez.

## Fonctionnalités (Prévues)

- [ ] Suivi des transactions avec catégories
- [ ] Système de budgétisation par enveloppes
- [ ] Objectifs d'épargne avec suivi visuel de la progression
- [ ] Gestion des transactions récurrentes
- [ ] Analyses et rapports visuels des dépenses
- [ ] Prise en charge de plusieurs comptes
- [ ] Importation/exportation au format CSV
- [ ] Prise en charge des thèmes clair/sombre

## Technologies utilisées

- **.NET 8** : Environnement d'exécution moderne et performant.
- **WinUI 3 / Windows App SDK** : Expérience native Windows 11.
- **SQLite** : Base de données locale et portable.
- **Architecture propre (Clean Architecture)** : Couches maintenables et testables.

## Structure du projet

```
src/
├── PocketLedger.Domain/        # Core entities and business rules
├── PocketLedger.Application/   # Use cases and application logic
├── PocketLedger.Infrastructure/# Data persistence, external services
└── PocketLedger.Desktop/       # WinUI 3 presentation layer
tests/
├── PocketLedger.Domain.Tests/
├── PocketLedger.Application.Tests/
└── PocketLedger.Infrastructure.Tests/
```

## Développement

### Prérequis

- Windows 10/11
- Visual Studio 2022 (17.8+) ou VS Code avec le kit de développement C#
- SDK .NET 8
- Windows App SDK

### Compilation

```bash
dotnet build
```

### Exécution des tests

```bash
dotnet test
```

## Licence

Licence MIT - Consultez [LICENSE](LICENSE) pour plus de détails.

## Contributions

Les contributions sont les bienvenues ! Veuillez lire nos directives de contribution avant de soumettre des demandes de tirage (pull requests).

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
