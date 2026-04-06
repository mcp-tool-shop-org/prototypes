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

**Sistema de conteúdo compartilhado para aplicativos de prática de digitação -- lições, progressão e dificuldade adaptativa.**

O Meta Content System é a infraestrutura de processamento de conteúdo que está por trás do [Dev-Op-Typer](https://github.com/mcp-tool-shop-org/dev-op-typer) (Windows) e do [linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer) (plataforma cruzada). Ele recebe arquivos de código-fonte, os normaliza de forma determinística, calcula métricas de dificuldade e gera uma biblioteca indexada que ambos os aplicativos utilizam da mesma forma, independentemente da plataforma.

## Por que usar o Meta Content System?

- **Uma pipeline para todas as plataformas** -- Os mesmos arquivos de entrada produzem o mesmo `library.index.json` no Windows, Linux e macOS. Sem desvios de plataforma.
- **Zero dependências externas** -- Biblioteca .NET 8 pura, construída inteiramente na BCL. Nada para instalar, nada para conflitar.
- **Arquitetura orientada a interfaces** -- Cada etapa da pipeline (`IContentSource`, `IExtractor`, `IMetricCalculator`, `IContentLibrary`) está por trás de uma abstração para testabilidade e extensibilidade.
- **Detecção de linguagem determinística** -- Identificação baseada em regras, a partir de extensões de arquivo e heurísticas de conteúdo. Suporta mais de 20 idiomas por padrão.
- **Desduplicação de conteúdo com SHA-256** -- Os IDs baseados no conteúdo evitam duplicatas durante a importação. Importe o mesmo arquivo duas vezes e obtenha apenas uma entrada.
- **Métricas com consciência de dificuldade** -- A densidade de símbolos, a profundidade de indentação, o número de linhas e a distribuição de caracteres permitem a dificuldade adaptativa nos aplicativos que consomem.
- **Extração inteligente** -- Arquivos grandes são divididos em blocos de prática de tamanho adequado; arquivos pequenos são mantidos inteiros. Limiares configuráveis.

## Pacote NuGet

| Pacote | Descrição |
| --------- | ------------- |
| [`DevOpTyper.Content`](https://www.nuget.org/packages/DevOpTyper.Content) | Ingestão, normalização e detecção de conteúdo, cálculo de métricas e geração de índice. Zero dependências externas. |

```bash
dotnet add package DevOpTyper.Content
```

## Como começar

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

### Usando a CLI

```bash
dotnet run --project src/DevOpTyper.Content.Cli -- build --source ./my-code --out library.index.json

dotnet run --project src/DevOpTyper.Content.Cli -- paste --lang csharp --title "Hello World" --text "Console.WriteLine(\"Hello\");"
```

## Arquitetura

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

### Idiomas suportados

O detector de idiomas cobre mais de 20 idiomas por meio de mapeamento de extensões e heurísticas de conteúdo:

Python, C#, Java, JavaScript, TypeScript, SQL, Bash, Rust, Go, Kotlin, C, C++, JSON, YAML, Markdown -- e mais por meio do mapeamento de extensões. Arquivos desconhecidos são classificados como `text`.

### Métricas calculadas

| Métrica | Type | Descrição |
| -------- | ------ | ------------- |
| `Lines` | `int` | Número total de linhas |
| `Characters` | `int` | Número total de caracteres, incluindo espaços em branco |
| `SymbolDensity` | `float` | Razão entre caracteres de símbolos e caracteres não espaços em branco (0,0--1,0) |
| `MaxIndentDepth` | `int` | Nível de indentação mais profundo (tabulações de 4 espaços) |

Essas métricas permitem a dificuldade adaptativa: um trecho com alta densidade de símbolos e aninhamento profundo é mais difícil de digitar do que um texto simples.

## Pré-requisitos

- SDK .NET 8 ([https://dotnet.microsoft.com/download/dotnet/8.0](https://dotnet.microsoft.com/download/dotnet/8.0)) ou posterior

Nenhuma outra ferramenta ou dependência é necessária.

## Construção a partir do código-fonte

```bash
git clone https://github.com/mcp-tool-shop-org/meta-content-system.git
cd meta-content-system
dotnet restore
dotnet build -c Release
dotnet test -c Release
```

## Estrutura do projeto

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

## Objetivos de design

| Goal | How |
| ------ |-----|
| **Platform-stable output** | Normalização LF, ordenação determinística, IDs baseados no conteúdo |
| **Zero dependências externas** | BCL .NET 8 pura -- sem pacotes NuGet de terceiros |
| **Interface-driven** | Cada etapa da pipeline está por trás de uma abstração |
| **Testable** | Conjunto de testes xUnit com verificações de paridade |
| **Extensible** | Implemente `IContentSource` para ingestão personalizada, `IExtractor` para divisão personalizada |

## Aplicativos que consomem

| App | Plataforma | Repositório |
|-----| ---------- | ------------ |
| Dev-Op-Typer | Windows (WinUI 3) | [mcp-tool-shop-org/dev-op-typer](https://github.com/mcp-tool-shop-org/dev-op-typer) |
| linux-dev-typer | Multiplataforma (.NET) | [mcp-tool-shop-org/linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer) |

## Licença

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcptoolshop.com">MCP Tool Shop</a>
</p>
