<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/Attestia-Desktop/readme.png" alt="Attestia Desktop" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/Attestia-Desktop/actions/workflows/publish.yml"><img src="https://github.com/mcp-tool-shop-org/Attestia-Desktop/actions/workflows/publish.yml/badge.svg" alt="CI"></a>
  <a href="https://www.nuget.org/packages/Attestia.Core"><img src="https://img.shields.io/nuget/v/Attestia.Core" alt="NuGet"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/Attestia-Desktop/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Vérification de l'intention financière pour Windows :** une application de bureau WinUI 3 et une SDK .NET pour l'attestation et la réconciliation blockchain.

---

## Pourquoi Attestia ?

La plupart des outils blockchain auditent les transactions **après** qu'elles se soient produites. Attestia inverse ce modèle : vérifiez l'intention **avant** qu'elle n'atteigne la chaîne.

- **Intents financiers typés** : déclarez, approuvez, exécutez et vérifiez les transactions avec des enregistrements structurés au lieu de charges utiles brutes.
- **Preuves cryptographiques** : les preuves d'inclusion d'arbres de Merkle et les packages d'attestation fournissent des pistes d'audit infalsifiables.
- **Réconciliation déterministe** : la comparaison à trois niveaux (intention vs. grand livre vs. chaîne) détecte les incohérences avant qu'elles ne s'aggravent.
- **Mappage de la conformité** : associez les contrôles d'attestation aux cadres réglementaires et générez des rapports de conformité notés.
- **Source d'événements** : chaque changement d'état est un événement de domaine immuable, chaîné par un hachage, avec un suivi complet de la causalité.
- **Expérience utilisateur axée sur le bureau** : une application native WinUI 3 vous offre un tableau de bord en temps réel, une gestion des intentions, un explorateur de preuves et des vues de réconciliation, sans quitter Windows.

---

## Packages NuGet

| Package | Target | Description |
|---------|--------|-------------|
| **Attestia.Core** | `net9.0` | Modèles de domaine, énumérations et types partagés : `Intent`, `MerkleProof`, `ReconciliationReport`, `Money`, `ComplianceFramework`, `DomainEvent`, et plus encore. |
| **Attestia.Client** | `net9.0` | SDK HTTP avec des sous-clients typés pour les intentions, les preuves, la réconciliation, la conformité, les événements, la vérification et l'exportation. Logique de nouvelle tentative, déballage d'enveloppes et prise en charge de `CancellationToken` intégrés. |
| **Attestia.Sidecar** | `net9.0` | Gestionnaire de processus Node.js : lance le backend Attestia, découvre les ports disponibles, interroge `/health`, redémarre automatiquement en cas de plantage et termine l'arborescence des processus lors de la suppression. |

Les trois packages ciblent `net9.0` et fonctionnent indépendamment de l'application de bureau. Utilisez-les dans des applications console, des services ASP.NET ou partout où .NET 9+ est exécuté.

---

## Démarrage rapide

### Déclarez et vérifiez une intention

```csharp
using Attestia.Client;

var config = new AttestiaClientConfig { BaseUrl = "http://localhost:3100" };
var http   = new AttestiaHttpClient(httpClient, config, logger);
var client = new AttestiaClient(http);

// Declare a financial intent
var intent = await client.Intents.DeclareAsync(new DeclareIntentRequest
{
    Id          = Guid.NewGuid().ToString(),
    Kind        = "transfer",
    Description = "Send 1,000 USDC to treasury",
    Params      = new() { ["amount"] = "1000", ["currency"] = "USDC" },
});

// Approve, execute on-chain, then verify
await client.Intents.ApproveAsync(intent.Id);
await client.Intents.ExecuteAsync(intent.Id, chainId: "eip155:1", txHash: "0xabc...");
await client.Intents.VerifyAsync(intent.Id, matched: true);
```

### Réconciliez l'intention par rapport au grand livre par rapport à la chaîne

```csharp
var report = await client.Reconciliation.ReconcileAsync(new ReconcileRequest
{
    Intents       = intents,
    LedgerEntries = ledgerEntries,
    ChainEvents   = chainEvents,
});

Console.WriteLine(report.Summary.AllReconciled
    ? "All matched"
    : $"{report.Summary.MismatchCount} mismatches found");
```

### Gérez le composant Node.js

```csharp
using Attestia.Sidecar;

// SidecarConfig is bound from appsettings.json via IOptions<SidecarConfig>
await using var sidecar = new NodeSidecar(options, locator, logger);
await sidecar.StartAsync();

// Sidecar auto-discovers a free port, polls /health every 5 s,
// auto-restarts on crash, and kills the process tree on dispose.
Console.WriteLine($"Backend ready at {sidecar.BaseUrl}");
```

### Vérifiez une preuve d'inclusion de Merkle

```csharp
var package = await client.Proofs.GetAttestationAsync(attestationId);
var result  = await client.Proofs.VerifyProofAsync(package);

Console.WriteLine(result.Valid
    ? $"Proof valid -- root {result.MerkleRoot}"
    : "Proof verification failed");
```

---

## Architecture

```text
+---------------------------------------------------------+
|  Attestia.App  (WinUI 3)                               |
|  Dashboard - Intents - Proofs - Reconciliation          |
|  Compliance - Events - Settings                         |
+---------------------------------------------------------+
|  Attestia.ViewModels  (CommunityToolkit.Mvvm)           |
+----------------------------+----------------------------+
|  Attestia.Client           |  Attestia.Sidecar          |
|  HTTP SDK                  |  Node.js process manager   |
|  Typed sub-clients         |  Health checks, auto-restart|
|  Retry + envelope          |  Port discovery, teardown  |
+----------------------------+----------------------------+
|  Attestia.Core                                          |
|  Domain models - Enums - Shared types                   |
+---------------------------------------------------------+
         |                          |
         v                          v
   Attestia Node.js            Blockchain
   backend (sidecar)           (EVM, etc.)
```

L'application de bureau compose toutes les couches, mais chaque bibliothèque est autonome. `Attestia.Client` fonctionne dans n'importe quel projet .NET 9+ : applications console, API ASP.NET, services en arrière-plan ou environnements de test.

Le **Sidecar** gère le backend Node.js en tant que processus enfant. Il trouve un port libre, définit `PORT` et `NODE_ENV=production`, interroge `/health` et redémarre automatiquement si le processus se termine. Lors de `DisposeAsync`, il termine l'ensemble de l'arborescence des processus proprement.

---

## Prérequis

| Requirement | Version | Notes |
|-------------|---------|-------|
| SDK .NET | 9.0+ | `global.json` fixe la version à 9.0 avec une mise à jour automatique vers la dernière version avec les fonctionnalités. |
| Node.js | 20+ | Nécessaire pour le composant backend Attestia. |
| Windows | 10 1809+ | WinUI 3 minimum ; Windows 11 recommandé. |
| Visual Studio | 2022 17.10+ | Avec la charge de travail **Windows App SDK** (pour l'application de bureau). |

> **Note :** Les trois packages NuGet (`Attestia.Core`, `Attestia.Client`, `Attestia.Sidecar`) ciblent `net9.0` et ne nécessitent pas Windows. Seul `Attestia.App` cible `net9.0-windows10.0.22621.0`.

---

## Installation à partir de la source

```bash
# Clone
git clone https://github.com/mcp-tool-shop-org/Attestia-Desktop.git
cd Attestia-Desktop

# Restore and build (libraries)
dotnet restore
dotnet build

# Run tests
dotnet test

# Run the desktop app (requires x64 + Windows App SDK workload)
dotnet run --project src/Attestia.App -c Debug
```

### Construction du package MSIX (Release)

```bash
dotnet build src/Attestia.App/Attestia.App.csproj -c Release -p:Platform=x64
```

Le résultat se trouve dans `AppPackages/`.

### Regroupement de Node.js

Placez le serveur Node.js Attestia dans `assets/node/`:

```text
assets/
  node/
    node.exe            <-- Node.js runtime
    server/
      dist/
        main.js         <-- Attestia backend entry point
```

La construction copie automatiquement ces fichiers dans le répertoire de sortie. Si `assets/node/node.exe` n'est pas présent, le sidecar utilise `node` dans le chemin d'accès.

---

## Structure du projet

```text
Attestia-Desktop/
|-- src/
|   |-- Attestia.Core/           # Domain models and shared types (NuGet)
|   |   +-- Models/
|   |       |-- Intent.cs        # IntentStatus, Intent, IntentDeclaration, IntentApproval
|   |       |-- Proof.cs         # MerkleProof, MerkleProofStep, AttestationProofPackage
|   |       |-- Reconciliation.cs# ReconciliationReport, MatchStatus, AttestationRecord
|   |       |-- Financial.cs     # Money, AccountRef, LedgerEntry
|   |       |-- Compliance.cs    # ComplianceFramework, ControlMapping, ComplianceReport
|   |       |-- Chain.cs         # ChainRef, BlockRef, TokenRef, OnChainEvent
|   |       |-- Event.cs         # DomainEvent, StoredEvent, EventMetadata
|   |       |-- Verification.cs  # VerificationResult, ReplayResult, ConsensusResult
|   |       +-- Api.cs           # AttestiaResponse<T>, PaginatedList<T>, AttestiaException
|   |
|   |-- Attestia.Client/         # HTTP client SDK (NuGet)
|   |   |-- AttestiaClient.cs    # Facade composing all sub-clients
|   |   |-- AttestiaHttpClient.cs# HTTP transport with retry, envelope unwrapping
|   |   |-- IntentsClient.cs     # Declare, approve, reject, execute, verify
|   |   |-- ProofsClient.cs      # Merkle root, attestation packages, proof verification
|   |   |-- ReconciliationClient.cs # Reconcile, attest, list attestations
|   |   |-- ComplianceClient.cs  # Frameworks, compliance reports
|   |   |-- EventsClient.cs     # Event streams, pagination
|   |   |-- VerifyClient.cs     # State hash, replay verification
|   |   |-- ExportClient.cs     # NDJSON events export, state export
|   |   +-- PublicClient.cs     # Public verification endpoints, consensus
|   |
|   |-- Attestia.Sidecar/        # Node.js process manager (NuGet)
|   |   |-- NodeSidecar.cs       # Lifecycle: start, health check, auto-restart, stop
|   |   |-- SidecarConfig.cs     # Port, timeouts, auto-restart toggle
|   |   +-- NodeBundleLocator.cs # Finds node.exe and server entry point
|   |
|   |-- Attestia.ViewModels/     # MVVM presentation layer
|   |   |-- DashboardViewModel.cs
|   |   |-- IntentsViewModel.cs
|   |   |-- ReconciliationViewModel.cs
|   |   +-- ...
|   |
|   +-- Attestia.App/            # WinUI 3 desktop application
|       |-- Pages/               # Dashboard, Intents, Proofs, Reconciliation, ...
|       |-- Themes/              # AttestiaTheme.xaml
|       +-- Startup.cs           # DI composition root
|
|-- assets/node/                  # Bundled Node.js runtime (gitkeep)
|-- scripts/
|   |-- build-governed.ps1        # Governed build script
|   +-- bundle-node.ps1           # Node.js bundling script
|-- .github/workflows/
|   +-- publish.yml               # NuGet publish on release
|-- Attestia.Desktop.sln
|-- Directory.Build.props         # Shared MSBuild properties
|-- Directory.Packages.props      # Central package management
|-- global.json                   # .NET SDK version pin
|-- CHANGELOG.md
|-- llms.txt                      # AI agent context
+-- LICENSE                       # MIT
```

---

## Configuration

L'application de bureau lit le fichier `appsettings.json` pour les paramètres du composant auxiliaire et du client :

```json
{
  "Attestia": {
    "Port": 0,
    "NodePath": null,
    "ServerEntryPoint": null,
    "ApiKey": null
  }
}
```

| Clé | Valeur par défaut | Description |
|-----|---------|-------------|
| `Port` | `0` (automatique) | Port fixe pour le composant auxiliaire, ou `0` pour détecter automatiquement un port disponible. |
| `NodePath` | `null` | Chemin explicite vers `node.exe` ; utilise la version intégrée par défaut, puis la variable `PATH`. |
| `ServerEntryPoint` | `null` | Chemin explicite vers `main.js` ; utilise l'emplacement par défaut intégré. |
| `ApiKey` | `null` | Clé API facultative, envoyée dans l'en-tête `X-Api-Key`. |

---

## Sécurité et portée des données

Attestia Desktop fonctionne comme une **application de bureau locale** avec un backend local Node.js.

- **Données accessibles :** Lit et écrit les déclarations d'intention, les preuves Merkle, les rapports de réconciliation et les données de conformité via un composant auxiliaire Node.js local. Stocke la configuration dans `appsettings.json`. Les packages SDK NuGet effectuent des appels HTTP vers l'URL du backend configurée uniquement.
- **Données non accessibles :** Aucune télémétrie. Aucune analyse dans le cloud. Aucune collecte de données utilisateur. Aucun stockage d'informations d'identification. Aucune écriture directe sur la blockchain.
- **Autorisations requises :** Accès réseau au composant auxiliaire local (localhost). Accès au système de fichiers pour l'environnement d'exécution Node.js intégré et la configuration. Environnement d'exécution du Windows App SDK pour l'interface utilisateur de bureau.

Consultez le fichier [SECURITY.md](SECURITY.md) pour signaler les vulnérabilités.

---

## Tableau de bord

| Catégorie | Score |
|----------|-------|
| Sécurité | 10/10 |
| Gestion des erreurs | 10/10 |
| Documentation pour les utilisateurs | 10/10 |
| Qualité du code | 10/10 |
| Identité | 10/10 |
| **Overall** | **50/50** |

---

## Contribution

1. Créez une branche à partir du dépôt.
2. Créez une branche de fonctionnalité (`git checkout -b feat/my-feature`).
3. Validez vos modifications.
4. Ouvrez une demande de fusion (pull request) vers la branche `main`.

Veuillez vous assurer que la solution est compilable et que tous les tests passent avant de soumettre.

---

## Support

- **Questions / aide :** [Discussions](https://github.com/mcp-tool-shop-org/Attestia-Desktop/discussions)
- **Rapports de bugs :** [Issues](https://github.com/mcp-tool-shop-org/Attestia-Desktop/issues)

---

## Licence

[MIT](LICENSE) -- Copyright (c) 2026 Mikey Frilot

---

Développé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>

