<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/soundboard-maui/readme.png" alt="Soundboard MAUI logo" width="400">
</p>

# soundboard-maui

> Fait partie de [MCP Tool Shop](https://mcptoolshop.com)

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/soundboard-maui/actions/workflows/publish.yml"><img src="https://github.com/mcp-tool-shop-org/soundboard-maui/actions/workflows/publish.yml/badge.svg" alt="Publish"></a>
  <img src="https://img.shields.io/badge/.NET-8%20%7C%209%20%7C%2010-512BD4" alt=".NET 8 | 9 | 10">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/soundboard-maui/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Client de bureau multiplateforme .NET MAUI pour le moteur vocal Sound Board.**

---

## Pourquoi Soundboard MAUI ?

- **Conception axée sur le SDK** — `Soundboard.Client` est une bibliothèque .NET 8+ autonome avec zéro dépendance d'interface utilisateur. Utilisez-la dans des applications console, WPF, ASP.NET, MAUI, ou tout ce qui cible .NET.
- **Diffusion en temps réel** — L'audio arrive par morceaux via WebSocket via `IProgress<AudioChunk>`. Pas besoin d'attendre la fin de la synthèse.
- **Indépendant du moteur** — Le SDK utilise un [contrat d'API](docs/api-contract.md) documenté. Changez de moteur sans modifier votre code.
- **Multi-cible** — Disponible pour `net8.0`, `net9.0` et `net10.0`, vous pouvez donc l'utiliser dans n'importe quel projet .NET moderne.
- **Journalisation structurée** — Prise en charge intégrée de `ILogger` pour le diagnostic sans avoir besoin d'un framework de journalisation.
- **Clients de référence inclus** — Une application de bureau MAUI et un outil en ligne de commande montrent des modèles d'intégration réels que vous pouvez copier.

---

## Paquets NuGet

| Paquet | Description | Version |
|---|---|---|
| **[Soundboard.Client](https://www.nuget.org/packages/Soundboard.Client)** | SDK principal — client de synthèse vocale en streaming pour n'importe quel moteur vocal compatible avec Soundboard. Pure C#, zéro dépendance d'interface utilisateur. | 1.2.0 |
| **[Soundboard.Maui.Audio](https://www.nuget.org/packages/Soundboard.Maui.Audio)** | Adaptateur de lecture PCM16 basé sur NAudio pour Windows. Fournit un `IAudioPlayer` avec mise en mémoire tampon, démarrage/arrêt/vidage sécurisé par thread et suivi de l'état de la lecture. | 1.0.0 |

---

## Démarrage rapide

### Installer le SDK

```bash
dotnet add package Soundboard.Client
```

### Parler en cinq lignes

```csharp
using Soundboard.Client;
using Soundboard.Client.Models;

await using var client = new SoundboardClient();

// Discover what the engine offers
var presets = await client.GetPresetsAsync();
var voices  = await client.GetVoicesAsync();

// Stream speech — chunks arrive as they are synthesized
var progress = new Progress<AudioChunk>(chunk =>
{
    // Feed chunk.PcmData (PCM16, mono) to your audio output
});

await client.SpeakAsync(
    new SpeakRequest("Hello from the SDK.", presets[0], voices[0]),
    progress);
```

Aucune dépendance MAUI. Fonctionne dans les applications console, WPF, ASP.NET, ou tout ce qui cible .NET 8+.

### Configuration

Le client lit la variable d'environnement `SOUNDBOARD_BASE_URL`, par défaut à `http://localhost:8765`. Vous pouvez la remplacer dans le code :

```csharp
var client = new SoundboardClient(new SoundboardClientOptions
{
    BaseUrl = "http://my-engine:9000",
    HttpTimeout = TimeSpan.FromSeconds(15),
    WebSocketConnectTimeout = TimeSpan.FromSeconds(10),
    WebSocketReceiveTimeout = TimeSpan.FromSeconds(60)
});
```

### Interface du SDK

| Méthode | Description |
|---|---|
| `GetHealthAsync()` | Vérification de l'état du moteur — renvoie les informations de version et l'état de disponibilité. |
| `GetPresetsAsync()` | Liste les identifiants de préréglages disponibles (par exemple, `narrateur`, `conversationnel`). |
| `GetVoicesAsync()` | Liste les identifiants de voix disponibles. |
| `SpeakAsync(request, progress)` | Diffuse le discours synthétisé ; renvoie les `AudioChunk` via `IProgress<T>`. |
| `StopAsync()` | Envoie une commande d'arrêt au moteur. |

Toutes les méthodes acceptent un `CancellationToken`. Le client implémente `IAsyncDisposable`.

---

## Architecture

```
This repository
+-------------------------------------------+
|                                           |
|  Soundboard.Client (SDK)     net8.0+      |  <-- The product
|  Soundboard.Maui.Audio       net8.0       |  <-- NAudio adapter (Windows)
|  Soundboard.Maui             net10.0      |  <-- Reference client (MAUI)
|  soundboard-cli              net8.0       |  <-- Reference client (console)
|                                           |
+-------------------------------------------+
            |  HTTP (control) + WebSocket (audio)
            v
+-------------------------------------------+
|  voice-soundboard (engine repo)           |
|  Any engine implementing the API contract |
+-------------------------------------------+
```

**Plan de contrôle** (HTTP) — état, préréglages, voix, arrêt.
**Plan de données** (WebSocket) — bidirectionnel : les commandes de parole sont envoyées vers le haut, les morceaux audio PCM16 sont diffusés vers le bas.

Le SDK gère automatiquement le cycle de vie de la connexion, le formatage JSON, le décodage base64, la fermeture propre de WebSocket et les vérifications de compatibilité de version de l'API.

---

## Installation à partir du code source

### Prérequis

- SDK [.NET 10.0](https://dotnet.microsoft.com/) avec la charge de travail MAUI (pour l'application de bureau)
- SDK .NET 8.0 (suffisant pour le SDK et l'outil en ligne de commande seuls)
- Windows 10/11 (pour l'application MAUI et la lecture NAudio)
- Un moteur [voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard) en cours d'exécution.

### Cloner et exécuter

```bash
git clone https://github.com/mcp-tool-shop-org/soundboard-maui.git
cd soundboard-maui

# Run unit + integration tests (no engine required)
dotnet test

# Run the MAUI desktop app
set SOUNDBOARD_BASE_URL=http://localhost:8765
dotnet run --project src/Soundboard.Maui

# Run the CLI client
dotnet run --project src/soundboard-cli -- health
dotnet run --project src/soundboard-cli -- presets
dotnet run --project src/soundboard-cli -- speak "Hello world" --preset narrator
```

---

## Structure du projet

```
src/
  Soundboard.Client/         SDK — pure C#, net8.0/9.0/10.0, zero UI deps
  Soundboard.Maui.Audio/     NAudio PCM16 playback adapter (Windows, net8.0)
  Soundboard.Maui/           Reference desktop client (MAUI, net10.0)
  soundboard-cli/            Reference console client (net8.0)

examples/
  Quickstart/                Connect → speak → save WAV in 30 seconds
  AgentTool/                 SDK as a callable tool in an AI agent pipeline

tests/
  Soundboard.Client.Tests/         27 unit tests (no engine required)
  Soundboard.IntegrationTests/     17 integration + contract tests

docs/
  api.md                     SDK API reference (v1.0 stability guarantees)
  api-contract.md            Engine <-> SDK wire protocol
  compatibility.md           SDK-engine compatibility matrix & trust contract
  getting-started-sdk.md     SDK integration guide
  streaming-model.md         How audio streaming works
  error-model.md             Failure modes and handling
  feature-map.md             Feature-to-layer mapping
  known-limitations.md       Current boundaries
  evaluation-guide.md        How to evaluate Soundboard
  publishing.md              NuGet publish runbook
```

---

## Exemples

| Exemple | Ce qu'il montre |
|---|---|
| [Quickstart](examples/Quickstart/) | Connexion, parole, sauvegarde WAV — configuration minimale. |
| [Agent Tool](examples/AgentTool/) | SDK utilisé comme outil appelable dans une chaîne de traitement d'un agent d'IA. |

---

## Documentation

- [Premiers pas avec le SDK](docs/getting-started-sdk.md)
- [Modèle de diffusion en continu](docs/streaming-model.md)
- [Modèle d'erreur](docs/error-model.md)
- [Référence de l'API](docs/api.md)
- [Contrat de l'API](docs/api-contract.md)
- [Compatibilité et sécurité](docs/compatibility.md)
- [Configuration du moteur](docs/engine-setup.md)
- [Guide de mise à niveau et de restauration](docs/upgrade-playbook.md)
- [Publication du SDK](docs/publishing.md)
- [Validation de l'installation initiale](docs/fresh-install.md)
- [Guide d'évaluation](docs/evaluation-guide.md)
- [Journal des modifications](CHANGELOG.md)
- [Comment contribuer](CONTRIBUTING.md)

---

## FAQ

**Qu'est-ce que le SDK ?**
`Soundboard.Client` est une bibliothèque .NET 8+ autonome qui gère toute la communication avec le moteur, notamment les vérifications de l'état, la découverte et la diffusion de la parole via WebSocket. Vous pouvez l'utiliser dans n'importe quel projet .NET.

**Qu'est-ce que l'application MAUI ?**
Il s'agit d'un client de référence qui illustre l'utilisation du SDK avec une interface utilisateur de bureau. Ce n'est pas le produit en lui-même, mais plutôt une façon de montrer comment utiliser le SDK.

**Est-ce prêt pour la production ?**
L'API du SDK (v1.0) est stable. L'application MAUI est de qualité démonstration. Consultez [les limitations connues](docs/known-limitations.md).

**Puis-je créer ma propre interface utilisateur ?**
Oui, c'est le but. Le SDK n'a aucune dépendance en matière d'interface utilisateur. Implémentez `IAudioPlayer` pour votre plateforme et vous êtes prêt.

**Où se trouve le moteur ?**
Il se trouve dans un dépôt distinct : [voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard). Ce dépôt ne contient aucun code de moteur.

---

## Licence

Ce projet est sous licence [MIT License](LICENSE).

---

## Liens

- [Dépôt du moteur](https://github.com/mcp-tool-shop-org/voice-soundboard)
- [MCP Tool Shop](https://mcptoolshop.com)
- [Soundboard.Client sur NuGet](https://www.nuget.org/packages/Soundboard.Client)
- [Soundboard.Maui.Audio sur NuGet](https://www.nuget.org/packages/Soundboard.Maui.Audio)
- [Limitations connues](docs/known-limitations.md)
