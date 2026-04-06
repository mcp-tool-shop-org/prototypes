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

**Sistema di condivisione dei contenuti per applicazioni di pratica di digitazione: lezioni, progressione e difficoltà adattiva.**

Meta Content System è il sistema di gestione dei contenuti portatile che fa da base a [Dev-Op-Typer](https://github.com/mcp-tool-shop-org/dev-op-typer) (Windows) e a [linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer) (multipiattaforma). Esso elabora i file di codice sorgente, li normalizza in modo deterministico, calcola metriche di difficoltà e produce una libreria indicizzata che entrambe le applicazioni utilizzano in modo identico, indipendentemente dalla piattaforma.

## Perché Meta Content System?

- **Una pipeline, per ogni piattaforma** -- Gli stessi file di input producono lo stesso `library.index.json` su Windows, Linux e macOS. Nessuna deriva della piattaforma.
- **Nessuna dipendenza esterna** -- Libreria .NET 8 pura, costruita interamente sulla BCL. Niente da installare, niente con cui entrare in conflitto.
- **Architettura basata su interfacce** -- Ogni fase della pipeline (`IContentSource`, `IExtractor`, `IMetricCalculator`, `IContentLibrary`) è implementata tramite un'astrazione per la testabilità e l'estensibilità.
- **Rilevamento deterministico del linguaggio** -- Identificazione basata su regole, utilizzando estensioni dei file euristiche sul contenuto. Supporta oltre 20 lingue di default.
- **De-duplicazione dei contenuti tramite SHA-256** -- Gli ID basati sul contenuto impediscono la presenza di duplicati durante le importazioni. Importare lo stesso file due volte genera una sola voce.
- **Metriche sensibili alla difficoltà** -- La densità dei simboli, la profondità dell'indentazione, il numero di righe e la distribuzione dei caratteri consentono di adattare la difficoltà nelle applicazioni che la utilizzano.
- **Estrazione intelligente** -- I file di grandi dimensioni vengono suddivisi in blocchi di pratica di dimensioni adeguate; i file più piccoli vengono mantenuti interi. Soglie configurabili.

## Pacchetto NuGet

| Pacchetto | Descrizione |
| --------- | ------------- |
| [`DevOpTyper.Content`](https://www.nuget.org/packages/DevOpTyper.Content) | Importazione, normalizzazione e rilevamento del contenuto, calcolo delle metriche e generazione dell'indice. Nessuna dipendenza esterna. |

```bash
dotnet add package DevOpTyper.Content
```

## Guida rapida

### Come libreria

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

### Utilizzo della CLI

```bash
dotnet run --project src/DevOpTyper.Content.Cli -- build --source ./my-code --out library.index.json

dotnet run --project src/DevOpTyper.Content.Cli -- paste --lang csharp --title "Hello World" --text "Console.WriteLine(\"Hello\");"
```

## Architettura

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

### Linguaggi supportati

Il rilevatore di lingue copre oltre 20 lingue tramite la mappatura delle estensioni e le euristiche sul contenuto:

Python, C#, Java, JavaScript, TypeScript, SQL, Bash, Rust, Go, Kotlin, C, C++, JSON, YAML, Markdown e altri tramite la mappa delle estensioni. I file sconosciuti vengono classificati come `text`.

### Metriche calcolate

| Metrica | Type | Descrizione |
| -------- | ------ | ------------- |
| `Lines` | `int` | Numero totale di righe |
| `Characters` | `int` | Numero totale di caratteri, inclusi gli spazi bianchi |
| `SymbolDensity` | `float` | Rapporto tra caratteri di simbolo e caratteri non-spazio (0.0--1.0) |
| `MaxIndentDepth` | `int` | Livello di indentazione più profondo (tabulazioni a 4 spazi) |

Queste metriche consentono di adattare la difficoltà: un frammento con un'alta densità di simboli e un'indentazione profonda è più difficile da digitare rispetto a un testo semplice.

## Prerequisiti

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) o versione successiva

Non sono necessari altri strumenti o dipendenze.

## Compilazione dal codice sorgente

```bash
git clone https://github.com/mcp-tool-shop-org/meta-content-system.git
cd meta-content-system
dotnet restore
dotnet build -c Release
dotnet test -c Release
```

## Struttura del progetto

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

## Obiettivi di progettazione

| Goal | How |
| ------ |-----|
| **Platform-stable output** | Normalizzazione LF, ordinamento deterministico, ID basati sul contenuto |
| **Nessuna dipendenza esterna** | BCL .NET 8 pura -- nessun pacchetto NuGet di terze parti |
| **Interface-driven** | Ogni fase della pipeline è implementata tramite un'astrazione |
| **Testable** | Suite di test xUnit con controlli di parità |
| **Extensible** | Implementare `IContentSource` per l'importazione personalizzata, `IExtractor` per la suddivisione personalizzata |

## Applicazioni che utilizzano la libreria

| App | Piattaforma | Repository |
|-----| ---------- | ------------ |
| Dev-Op-Typer | Windows (WinUI 3) | [mcp-tool-shop-org/dev-op-typer](https://github.com/mcp-tool-shop-org/dev-op-typer) |
| linux-dev-typer | Multipiattaforma (.NET) | [mcp-tool-shop-org/linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer) |

## Licenza

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcptoolshop.com">MCP Tool Shop</a>
</p>
