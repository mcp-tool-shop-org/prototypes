<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

# NextLedger

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/NextLedger/readme.png" alt="NextLedger" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/NextLedger/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/NextLedger/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/NextLedger/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Gestion budgétaire par enveloppes pour Windows : donnez une fonction à chaque euro.**

Une application de gestion financière personnelle pour Windows utilisant la méthode de la gestion budgétaire par enveloppes. Vos données restent stockées localement, sans nécessiter de connexion au cloud. Conçue comme une **registre du futur** : un système fiable de vérité financière avec une intervention humaine explicite à chaque étape.

## Télécharger

📦 **[Dernière version](https://github.com/mcp-tool-shop-org/NextLedger/releases/latest)**

Téléchargez le fichier ZIP, extrayez-le et exécutez `NextLedger.App.exe`. Aucune installation n'est requise.

## Qu'est-ce que la gestion budgétaire par enveloppes ?

La gestion budgétaire par enveloppes est une méthode simple et éprouvée où vous répartissez vos revenus dans des "enveloppes" virtuelles pour différentes catégories de dépenses. Vous ne pouvez dépenser que ce qui se trouve dans chaque enveloppe, ce qui rend les dépenses excessives impossibles.

## Fonctionnalités

- **Fonctionnement hors ligne**: Vos données restent sur votre ordinateur. Pas besoin de connexion au cloud.
- **Gestion budgétaire par enveloppes**: Allouez chaque euro à un objectif précis.
- **Comptes multiples**: Suivez les comptes courants, les comptes d'épargne, les cartes de crédit et l'argent liquide.
- **Suivi des transactions**: Catégorisez et recherchez vos dépenses.
- **Importation CSV**: Importez facilement les relevés bancaires.
- **Rapprochement**: Comparez vos enregistrements avec les relevés bancaires.
- **Native Windows**: Conçu avec WinUI 3 pour une expérience Windows moderne.

## Captures d'écran

*À venir*

## Documentation

- [Historique des modifications](CHANGELOG.md)
- [Codes d'erreur du moteur](ENGINE_ERROR_CODES.md)
- [Processus de publication](docs/RELEASE_PROCESS.md)
- [Vision du registre du futur](docs/FUTURE_LEDGER_VISION.md)
- [Liste de contrôle pour l'exécution du registre](docs/LEDGER_EXECUTION_CHECKLIST.md)

## Technologie

- **Interface utilisateur**: WinUI 3 / Windows App SDK
- **Langage**: C# / .NET 9
- **Base de données**: SQLite (locale)
- **Architecture**: Architecture propre avec MVVM

## Statut du projet

✅ **v1.0.0** - Prêt pour la publication

Fonctionnalités principales complètes :
- Gestion du budget avec allocations mensuelles
- Suivi des transactions avec prise en charge des virements
- Importation CSV des relevés bancaires
- Rapprochement des comptes
- Analyse des dépenses par enveloppe
- Aide et conseils intégrés

Consultez [DESIGN.md](DESIGN.md) pour une architecture détaillée.

## Feuille de route

NextLedger évolue vers un **registre du futur** : consultez [Vision du registre du futur](docs/FUTURE_LEDGER_VISION.md) pour connaître l'architecture complète.

| Layer | Statut | Description |
| ------- | -------- | ------------- |
| Observation | ✅ Complète | Soldes locaux, transactions, comptes |
| Interprétation | ✅ Complète | Gestion budgétaire par enveloppes, analyse des dépenses |
| Déclaration d'intention | 🔜 Prévue | Objectifs budgétaires, règles d'allocation |
| Application des contraintes | 🔜 Prévue | Limites budgétaires, protection contre les dépassements |
| Exécution approuvée par l'utilisateur | 🔮 Futur | Intégration Web3 (non décentralisée) |

## Développement

### Prérequis

- Windows 10 (1809+) ou Windows 11
- Visual Studio (2022 17.8+ ou version ultérieure) avec :
- Charge de travail de développement pour applications de bureau .NET
- Modèles Windows App SDK C#
- Windows SDK / MSIX (outils de construction Appx/PRI)
- SDK .NET 9

**Note concernant les builds en ligne de commande (WinUI) :** Le projet WinUI (`NextLedger.App`) effectue des étapes de construction spécifiques à Windows App SDK qui nécessitent les assemblies MSBuild pour les tâches Appx/MSIX + PRI. Si vous rencontrez une erreur du type `MSB4062` faisant référence à un fichier manquant comme `Microsoft.Build.AppxPackage.dll` ou `Microsoft.Build.Packaging.Pri.Tasks.dll`, installez les composants Windows SDK / MSIX via l'installateur de Visual Studio (ou compilez l'application directement depuis Visual Studio).

### Construction

```bash
dotnet restore
dotnet build
```

### Comment exécuter l'application

**Visual Studio (recommandé)**

1. Ouvrez `NextLedger.sln` dans Visual Studio 2022.
2. Définissez `NextLedger.App` comme projet de démarrage.
3. Exécutez avec **F5**.

**Ligne de commande (build + lancement)**

```bash
dotnet build .\src\NextLedger.App\NextLedger.App.csproj -c Debug
```

Si cela échoue avec `MSB4062`, consultez la note dans la section **Prérequis**.

Ensuite, exécutez le fichier exécutable généré à partir du dossier de sortie de la compilation, qui se trouve sous :

- `.\src\NextLedger.App\bin\Debug\net9.0-windows10.0.19041.0\`

**Emplacement des données locales**

L'application crée une base de données SQLite locale à l'emplacement suivant :

- `%LOCALAPPDATA%\NextLedger\NextLedger.db`

### Exécution des tests

```bash
dotnet test
```

## Licence

Licence MIT - voir le fichier LICENSE pour plus de détails.

## Auteur

Créé par [mcp-tool-shop](https://github.com/mcp-tool-shop-org)
