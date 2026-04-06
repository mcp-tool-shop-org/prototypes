<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/meta-content-system/readme.png" alt="Meta Content System" width="400"></p>

<h1 align="center">Meta Content System</h1>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/meta-content-system/actions/workflows/build.yml"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/meta-content-system/build.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <img src="https://img.shields.io/badge/.NET-8-purple?style=flat-square&logo=dotnet" alt=".NET 8">
  <a href="https://www.nuget.org/packages/DevOpTyper.Content"><img src="https://img.shields.io/nuget/v/DevOpTyper.Content?style=flat-square&logo=nuget&label=NuGet" alt="NuGet"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/meta-content-system?style=flat-square" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/meta-content-system/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

**Système de contenu partagé pour les applications d'entraînement à la frappe : leçons, progression et difficulté adaptative.**

Meta Content System est le système de traitement de contenu portable qui est à la base de [Dev-Op-Typer](https://github.com/mcp-tool-shop-org/dev-op-typer) (Windows) et de [linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer) (multiplateforme). Il ingère les fichiers de code source, les normalise de manière déterministe, calcule des métriques de difficulté et produit une bibliothèque indexée que les deux applications utilisent de la même manière, quel que soit le système d'exploitation.

## Pourquoi Meta Content System ?

- **Un seul pipeline, pour toutes les plateformes** : Les mêmes fichiers d'entrée produisent le même fichier `library.index.json` sur Windows, Linux et macOS. Pas de divergence entre les plateformes.
- **Aucune dépendance externe** : Bibliothèque .NET 8 pure, construite entièrement sur la BCL. Rien à installer, aucun conflit possible.
- **Architecture basée sur des interfaces** : Chaque étape du pipeline (`IContentSource`, `IExtractor`, `IMetricCalculator`, `IContentLibrary`) est abstraite pour faciliter les tests et l'extension.
- **Détection de langage déterministe** : Identification basée sur des règles, en utilisant les extensions de fichiers et les heuristiques du contenu. Prend en charge plus de 20 langues par défaut.
- **Déduplication de contenu basée sur le hachage SHA-256** : Les identifiants basés sur le contenu évitent les doublons lors de l'importation. Importez le même fichier deux fois, et vous n'obtiendrez qu'une seule entrée.
- **Métriques sensibles à la difficulté** : La densité des symboles, la profondeur de l'indentation, le nombre de lignes et la distribution des caractères permettent d'adapter la difficulté dans les applications consommatrices.
- **Extraction intelligente** : Les fichiers volumineux sont divisés en blocs d'entraînement de taille appropriée ; les petits fichiers sont conservés intacts. Les seuils sont configurables.

## Package NuGet

| Package | Description |
| --------- | ------------- |
| [`DevOpTyper.Content`](https://www.nuget.org/packages/DevOpTyper.Content) | Ingestion, normalisation et détection de contenu, calcul de métriques et génération d'index. Aucune dépendance externe. |

```bash
dotnet add package DevOpTyper.Content
```

## Démarrage rapide

### En tant que bibliothèque

```csharp
using DevOpTyper.Content.Abstractions;
using DevOpTyper.Content.Models;
using DevOpTyper.Content.Services;

// 1. Create the pipeline components
IExtractor extractor = new DefaultExtractor();
IMetricCalculator metrics = new MetricCalculator();
var builder = new LibraryIndexBuilder(extractor, metrics);

// 2. Build an index from a content source
IContentSource source = new MyFolderSource("./samples");
LibraryIndex index = await builder.BuildAsync(source);

// 3. Query the library
var library = new InMemoryContentLibrary(index.Items);
var pythonSnippets = library.Query(new ContentQuery
{
    Language = "python",
    MinLines = 5,
    MaxSymbolDensity = 0.4f
});

// 4. Persist the index
var store = new JsonLibraryIndexStore();
store.Save("library.index.json", index);
```

### Utilisation de l'interface en ligne de commande (CLI)

```bash
dotnet run --project src/DevOpTyper.Content.Cli -- build --source ./my-code --out library.index.json

dotnet run --project src/DevOpTyper.Content.Cli -- paste --lang csharp --title "Hello World" --text "Console.WriteLine(\"Hello\");"
```

## Architecture

```
IContentSource                    Enumerates raw files
       |
       v
LanguageDetector                  Extension map + content heuristics
       |
       v
IExtractor                        Split large files into practice blocks
       |
       v
Normalizer                        Line endings -> LF, trailing newline
       |
       v
ContentId                         SHA-256(language + normalized code)
       |                          First 16 bytes -> 32-char hex ID
       v
IMetricCalculator                 Lines, characters, symbol density,
       |                          max indent depth
       v
LibraryIndexBuilder               Deduplicates, sorts, emits index
       |
       v
ILibraryIndexStore                Serialize/deserialize library.index.json
       |
       v
IContentLibrary                   Query by language, source, line count,
                                  symbol density range
```

### Langues prises en charge

Le détecteur de langue prend en charge plus de 20 langues grâce à la correspondance des extensions et aux heuristiques du contenu :

Python, C#, Java, JavaScript, TypeScript, SQL, Bash, Rust, Go, Kotlin, C, C++, JSON, YAML, Markdown – et plus encore grâce à la carte des extensions. Les fichiers inconnus sont traités comme du texte (`text`).

### Métriques calculées

| Metric | Type | Description |
| -------- | ------ | ------------- |
| `Lines` | `int` | Nombre total de lignes |
| `Characters` | `int` | Nombre total de caractères, espaces compris |
| `SymbolDensity` | `float` | Ratio entre le nombre de caractères de symboles et le nombre de caractères non-espaces (0.0 à 1.0) |
| `MaxIndentDepth` | `int` | Niveau d'indentation maximal (espaces de tabulation) |

Ces métriques permettent d'adapter la difficulté : un extrait avec une densité de symboles élevée et une indentation profonde est plus difficile à taper qu'un texte simple.

## Prérequis

- SDK .NET 8 ([https://dotnet.microsoft.com/download/dotnet/8.0](https://dotnet.microsoft.com/download/dotnet/8.0)) ou version ultérieure

Aucun autre outil ou dépendance n'est requis.

## Compilation à partir du code source

```bash
git clone https://github.com/mcp-tool-shop-org/meta-content-system.git
cd meta-content-system
dotnet restore
dotnet build -c Release
dotnet test -c Release
```

## Structure du projet

```
meta-content-system/
├── src/
│   ├── DevOpTyper.Content/            # Core library (NuGet package)
│   │   ├── Abstractions/              # IContentLibrary, IContentSource,
│   │   │                              #   IExtractor, IMetricCalculator, ILibraryIndexStore
│   │   ├── Models/                    # CodeItem, CodeMetrics, LibraryIndex
│   │   └── Services/                  # LanguageDetector, Normalizer, ContentId,
│   │                                  #   MetricCalculator, LibraryIndexBuilder,
│   │                                  #   InMemoryContentLibrary, JsonLibraryIndexStore
│   └── DevOpTyper.Content.Cli/        # CLI tool for batch indexing
├── tests/
│   └── DevOpTyper.Content.Tests/      # xUnit tests (normalization, metrics, detection,
│                                      #   extraction, indexing, golden parity, store)
├── docs/                              # Design documents (extraction, detection, metrics)
├── spec/                              # JSON schemas (codeitem, libraryindex)
├── DevOpTyper.Content.sln
├── logo.png
└── LICENSE
```

## Objectifs de conception

| Goal | How |
| ------ |-----|
| **Platform-stable output** | Normalisation LF, tri déterministe, identifiants basés sur le contenu |
| **Aucune dépendance externe** | BCL .NET 8 pure – aucun package NuGet tiers |
| **Interface-driven** | Chaque étape du pipeline est abstraite |
| **Testable** | Suite de tests xUnit avec vérifications de conformité |
| **Extensible** | Implémentez `IContentSource` pour l'ingestion personnalisée, `IExtractor` pour le découpage personnalisé |

## Applications consommatrices

| App | Plateforme | Dépôt |
|-----| ---------- | ------------ |
| Dev-Op-Typer | Windows (WinUI 3) | [mcp-tool-shop-org/dev-op-typer](https://github.com/mcp-tool-shop-org/dev-op-typer) |
| linux-dev-typer | Multiplateforme (.NET) | [mcp-tool-shop-org/linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer) |

## Licence

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcptoolshop.com">MCP Tool Shop</a>
</p>
