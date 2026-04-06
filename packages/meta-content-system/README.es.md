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

**Sistema de contenido compartido para aplicaciones de práctica de mecanografía: lecciones, progreso y dificultad adaptable.**

Meta Content System es el sistema de procesamiento de contenido que se utiliza en [Dev-Op-Typer](https://github.com/mcp-tool-shop-org/dev-op-typer) (Windows) y [linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer) (plataforma cruzada). Este sistema recibe archivos de código fuente, los normaliza de manera determinista, calcula métricas de dificultad y genera una biblioteca indexada que ambas aplicaciones utilizan de la misma manera, independientemente de la plataforma.

## ¿Por qué Meta Content System?

- **Una canalización, para todas las plataformas:** Los mismos archivos de entrada producen el mismo `library.index.json` en Windows, Linux y macOS. No hay diferencias de comportamiento entre plataformas.
- **Sin dependencias externas:** Biblioteca .NET 8 pura, construida completamente sobre la BCL (Base Class Library). No hay nada que instalar, ni conflictos posibles.
- **Arquitectura basada en interfaces:** Cada etapa de la canalización (`IContentSource`, `IExtractor`, `IMetricCalculator`, `IContentLibrary`) está implementada a través de una abstracción para facilitar las pruebas y la extensibilidad.
- **Detección de lenguaje determinista:** Identificación basada en reglas, utilizando extensiones de archivo y heurísticas del contenido. Soporta más de 20 idiomas de forma predeterminada.
- **Desduplicación de contenido mediante SHA-256:** Los identificadores basados en el contenido evitan duplicados durante la importación. Si importa el mismo archivo dos veces, solo se crea una entrada.
- **Métricas que consideran la dificultad:** La densidad de símbolos, la profundidad de la indentación, el número de líneas y la distribución de caracteres permiten ajustar la dificultad de forma adaptativa en las aplicaciones que utilizan esta biblioteca.
- **Extracción inteligente:** Los archivos grandes se dividen en bloques de práctica de tamaño adecuado; los archivos pequeños se mantienen completos. Se pueden configurar los umbrales.

## Paquete NuGet

| Paquete | Descripción |
| --------- | ------------- |
| [`DevOpTyper.Content`](https://www.nuget.org/packages/DevOpTyper.Content) | Ingestión, normalización y detección de contenido, cálculo de métricas y generación de índices. Sin dependencias externas. |

```bash
dotnet add package DevOpTyper.Content
```

## Cómo empezar

### Como biblioteca

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

### Usando la CLI (línea de comandos)

```bash
dotnet run --project src/DevOpTyper.Content.Cli -- build --source ./my-code --out library.index.json

dotnet run --project src/DevOpTyper.Content.Cli -- paste --lang csharp --title "Hello World" --text "Console.WriteLine(\"Hello\");"
```

## Arquitectura

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

### Idiomas soportados

El detector de idiomas cubre más de 20 idiomas mediante el mapeo de extensiones y heurísticas del contenido:

Python, C#, Java, JavaScript, TypeScript, SQL, Bash, Rust, Go, Kotlin, C, C++, JSON, YAML, Markdown, y más a través del mapa de extensiones. Los archivos desconocidos se clasifican como "text".

### Métricas calculadas

| Métrica | Type | Descripción |
| -------- | ------ | ------------- |
| `Lines` | `int` | Número total de líneas |
| `Characters` | `int` | Número total de caracteres, incluyendo espacios en blanco |
| `SymbolDensity` | `float` | Relación entre caracteres de símbolos y caracteres que no son espacios en blanco (0.0--1.0) |
| `MaxIndentDepth` | `int` | Nivel de indentación más profundo (tabulaciones de 4 espacios) |

Estas métricas permiten ajustar la dificultad de forma adaptativa: un fragmento con alta densidad de símbolos y una indentación profunda es más difícil de mecanografiar que un texto plano.

## Requisitos previos

- SDK de .NET 8 ([https://dotnet.microsoft.com/download/dotnet/8.0](https://dotnet.microsoft.com/download/dotnet/8.0)) o posterior

No se requieren otras herramientas ni dependencias.

## Compilación desde el código fuente

```bash
git clone https://github.com/mcp-tool-shop-org/meta-content-system.git
cd meta-content-system
dotnet restore
dotnet build -c Release
dotnet test -c Release
```

## Estructura del proyecto

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

## Objetivos de diseño

| Goal | How |
| ------ |-----|
| **Platform-stable output** | Normalización LF, ordenamiento determinista, identificadores basados en el contenido |
| **Sin dependencias externas** | BCL .NET 8 pura: sin paquetes NuGet de terceros |
| **Interface-driven** | Cada etapa de la canalización está implementada a través de una abstracción |
| **Testable** | Conjunto de pruebas xUnit con verificaciones de paridad dorada |
| **Extensible** | Implemente `IContentSource` para la ingestión personalizada, `IExtractor` para la división personalizada |

## Aplicaciones que utilizan esta biblioteca

| App | Plataforma | Repositorio |
|-----| ---------- | ------------ |
| Dev-Op-Typer | Windows (WinUI 3) | [mcp-tool-shop-org/dev-op-typer](https://github.com/mcp-tool-shop-org/dev-op-typer) |
| linux-dev-typer | Multiplataforma (.NET) | [mcp-tool-shop-org/linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer) |

## Licencia

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcptoolshop.com">MCP Tool Shop</a>
</p>
