<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/InControl-Desktop/readme.png" alt="InControl Desktop" width="400"></p>

<h1 align="center">InControl Desktop</h1>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/InControl-Desktop/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/InControl-Desktop/ci.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <a href="https://www.nuget.org/packages/InControl.Core"><img src="https://img.shields.io/nuget/v/InControl.Core?style=flat-square&label=InControl.Core" alt="InControl.Core NuGet"></a>
  <a href="https://www.nuget.org/packages/InControl.Inference"><img src="https://img.shields.io/nuget/v/InControl.Inference?style=flat-square&label=InControl.Inference" alt="InControl.Inference NuGet"></a>
  <img src="https://img.shields.io/badge/.NET-9-purple?style=flat-square&logo=dotnet" alt=".NET 9">
  <img src="https://img.shields.io/badge/WinUI-3-blue?style=flat-square" alt="WinUI 3">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/InControl-Desktop?style=flat-square" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/InControl-Desktop/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

**Assistant de chat local pour Windows**

Une application de chat axée sur la confidentialité et optimisée pour les GPU, qui exécute des modèles de langage volumineux entièrement sur votre machine. Pas de cloud requis.

## Pourquoi InControl ?

- **Privé par défaut** - Vos conversations ne quittent jamais votre ordinateur.
- **Optimisé pour RTX** - Conçu pour les GPU NVIDIA avec accélération CUDA.
- **Expérience Windows native** - WinUI 3 avec Fluent Design.
- **Plusieurs backends** - Ollama, llama.cpp, ou utilisez le vôtre.
- **Rendu Markdown** - Texte enrichi, blocs de code et surlignage syntaxique.

## Packages NuGet

Les bibliothèques principales sont disponibles sous forme de packages NuGet autonomes pour créer vos propres intégrations d'IA locales :

| Package | Version | Description |
| --------- | --------- | ------------- |
| [InControl.Core](https://www.nuget.org/packages/InControl.Core) | [![NuGet](https://img.shields.io/nuget/v/InControl.Core?style=flat-square)](https://www.nuget.org/packages/InControl.Core) | Modèles de domaine, types de conversation et abstractions partagées pour les applications de chat IA locales. |
| [InControl.Inference](https://www.nuget.org/packages/InControl.Inference) | [![NuGet](https://img.shields.io/nuget/v/InControl.Inference?style=flat-square)](https://www.nuget.org/packages/InControl.Inference) | Couche d'abstraction du backend LLM avec chat en streaming, gestion des modèles et vérifications de l'état. Inclut l'implémentation d'Ollama. |

```bash
dotnet add package InControl.Core
dotnet add package InControl.Inference
```

```csharp
// Example: use InControl.Inference in your own app
var client = inferenceClientFactory.Create("ollama");
await foreach (var token in client.StreamChatAsync(messages))
{
    Console.Write(token);
}
```

## Matériel cible

| Composant | Minimum | Recommandé |
| ----------- | --------- | ------------- |
| GPU | RTX 3060 (8 Go) | RTX 4080/5080 (16 Go) |
| RAM | 16GB | 32GB |
| OS | Windows 10 1809+ | Windows 11 |
| .NET | 9.0 | 9.0 |

## Installation

### À partir de la version (recommandé)

1. Téléchargez le dernier package MSIX depuis [Releases](https://github.com/mcp-tool-shop-org/InControl-Desktop/releases)
2. Double-cliquez pour installer.
3. Lancez l'application depuis le menu Démarrer.

### À partir du code source

```bash
# Clone and build
git clone https://github.com/mcp-tool-shop-org/InControl-Desktop.git
cd InControl-Desktop
dotnet restore
dotnet build

# Run (requires Ollama running locally)
dotnet run --project src/InControl.App
```

## Prérequis

InControl nécessite un backend LLM local. Nous recommandons [Ollama](https://ollama.ai/):

```bash
# Install Ollama from https://ollama.ai/download

# Pull a model
ollama pull llama3.2

# Start the server (runs on http://localhost:11434)
ollama serve
```

## Construction

### Vérifier l'environnement de construction

```powershell
# Run verification script
./scripts/verify.ps1
```

### Construction de développement

```bash
dotnet build
```

### Construction de version

```powershell
# Creates release artifacts in artifacts/
./scripts/release.ps1
```

### Exécuter les tests

```bash
dotnet test
```

## Architecture

InControl suit une architecture propre et modulaire :

```
+-------------------------------------------+
|         InControl.App (WinUI 3)           |  UI Layer
+-------------------------------------------+
|         InControl.ViewModels              |  Presentation
+-------------------------------------------+
|         InControl.Services                |  Business Logic
+-------------------------------------------+
|         InControl.Inference               |  LLM Backends
+-------------------------------------------+
|         InControl.Core                    |  Shared Types
+-------------------------------------------+
```

Consultez [ARCHITECTURE.md](./docs/ARCHITECTURE.md) pour une documentation détaillée de la conception.

## Stockage des données

Toutes les données sont stockées localement :

| Data | Emplacement |
| ------ | ---------- |
| Sessions | `%LOCALAPPDATA%\InControl\sessions\` |
| Logs | `%LOCALAPPDATA%\InControl\logs\` |
| Cache | `%LOCALAPPDATA%\InControl\cache\` |
| Exports | `%USERPROFILE%\Documents\InControl\exports\` |

Consultez [PRIVACY.md](./docs/PRIVACY.md) pour une documentation complète de la gestion des données.

## Dépannage

Les problèmes courants et leurs solutions sont documentés dans [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md).

### Corrections rapides

**L'application ne démarre pas :**
- Vérifiez que le runtime .NET 9.0 est installé.
- Exécutez `dotnet --list-runtimes` pour vérifier.

**Aucun modèle disponible :**
- Assurez-vous qu'Ollama est en cours d'exécution : `ollama serve`
- Téléchargez un modèle : `ollama pull llama3.2`

**GPU non détecté :**
- Mettez à jour les pilotes NVIDIA vers la dernière version.
- Vérifiez l'installation du kit de développement CUDA.

## Contribution

Les contributions sont les bienvenues ! Veuillez :

1. Forker le dépôt.
2. Créer une branche de fonctionnalité.
3. Écrire des tests pour les nouvelles fonctionnalités.
4. Soumettre une demande de tirage (pull request).

## Signalement de problèmes

1. Vérifiez [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) en premier.
2. Utilisez la fonctionnalité "Copier les diagnostics" dans l'application.
3. Ouvrez un problème avec les informations de diagnostic jointes.

## Pile technologique

| Layer | Technologie |
| ------- | ------------ |
| Framework d'interface utilisateur | WinUI 3 (Windows App SDK 1.6) |
| Architecture | MVVM avec CommunityToolkit.Mvvm |
| Intégration LLM | OllamaSharp, Microsoft.Extensions.AI |
| Conteneur de dépendances | Microsoft.Extensions.DependencyInjection |
| Configuration | Microsoft.Extensions.Configuration |
| Journalisation | Microsoft.Extensions.Logging + Serilog |

## Version

Version actuelle : **0.4.0-alpha**

Consultez le fichier [CHANGELOG.md](./CHANGELOG.md) pour l'historique des versions.

## Support

- **Questions / aide :** [Discussions](https://github.com/mcp-tool-shop-org/InControl-Desktop/discussions)
- **Signalement de bugs :** [Issues](https://github.com/mcp-tool-shop-org/InControl-Desktop/issues)
- **Sécurité :** [SECURITY.md](SECURITY.md)

## Licence

[MIT](LICENSE) -- voir [LICENSE](LICENSE) pour le texte complet.

---

*Conçu pour Windows. Fonctionne grâce à l'IA locale.*
