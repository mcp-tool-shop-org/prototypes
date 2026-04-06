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

**用于打字练习应用的共享内容系统：课程、进度和自适应难度。**

Meta Content System 是 [Dev-Op-Typer](https://github.com/mcp-tool-shop-org/dev-op-typer)（Windows）和 [linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer)（跨平台）背后的可移植内容流水线。它接收源代码文件，对其进行确定性的标准化处理，计算难度指标，并生成一个索引库，这两个应用程序无论在哪个平台上运行，都以相同的方式使用该库。

## 为什么选择 Meta Content System？

- **一个流水线，适用于所有平台**：相同的输入文件在 Windows、Linux 和 macOS 上都会生成相同的 `library.index.json` 文件。没有平台差异。
- **零外部依赖**：纯 .NET 8 库，完全基于 BCL。无需安装任何内容，不会与其他内容冲突。
- **基于接口的架构**：每个流水线阶段（`IContentSource`、`IExtractor`、`IMetricCalculator`、`IContentLibrary`）都通过抽象来实现，以便进行测试和扩展。
- **确定性的语言检测**：基于规则的识别，通过文件扩展名和内容启发式方法进行判断。支持 20 多个语言。
- **基于 SHA-256 的内容去重**：基于内容的 ID 可防止导入时出现重复项。即使导入相同的文件两次，也只会创建一个条目。
- **基于难度的指标**：符号密度、缩进深度、行数和字符分布，为应用程序中的自适应难度提供支持。
- **智能提取**：大文件会被拆分成适当大小的练习块；小文件保持完整。可以配置阈值。

## NuGet 包

| 包 | 描述 |
| --------- | ------------- |
| [`DevOpTyper.Content`](https://www.nuget.org/packages/DevOpTyper.Content) | 内容摄取、标准化、语言检测、指标计算和索引生成。零外部依赖。 |

```bash
dotnet add package DevOpTyper.Content
```

## 快速开始

### 作为库

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

### 使用 CLI

```bash
dotnet run --project src/DevOpTyper.Content.Cli -- build --source ./my-code --out library.index.json

dotnet run --project src/DevOpTyper.Content.Cli -- paste --lang csharp --title "Hello World" --text "Console.WriteLine(\"Hello\");"
```

## 架构

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

### 支持的语言

语言检测器通过扩展映射和内容启发式方法支持 20 多个语言：

Python、C#、Java、JavaScript、TypeScript、SQL、Bash、Rust、Go、Kotlin、C、C++、JSON、YAML、Markdown，以及更多语言通过扩展映射支持。未知文件默认为 `text`。

### 计算的指标

| 指标 | Type | 描述 |
| -------- | ------ | ------------- |
| `Lines` | `int` | 总行数 |
| `Characters` | `int` | 包括空格的总字符数 |
| `SymbolDensity` | `float` | 符号字符与非空格字符的比例（0.0--1.0） |
| `MaxIndentDepth` | `int` | 最深的缩进级别（4 个空格制表符） |

这些指标用于自适应难度：与纯文本相比，具有高符号密度和深层嵌套的代码片段更难输入。

## 先决条件

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) 或更高版本

不需要其他工具或依赖项。

## 从源代码构建

```bash
git clone https://github.com/mcp-tool-shop-org/meta-content-system.git
cd meta-content-system
dotnet restore
dotnet build -c Release
dotnet test -c Release
```

## 项目结构

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

## 设计目标

| Goal | How |
| ------ |-----|
| **Platform-stable output** | LF 归一化、确定性排序、基于内容的 ID |
| **零外部依赖** | 纯 .NET 8 BCL，不使用任何第三方 NuGet 包 |
| **Interface-driven** | 每个流水线阶段都通过抽象来实现 |
| **Testable** | 带有黄金匹配检查的 xUnit 测试套件 |
| **Extensible** | 实现 `IContentSource` 以进行自定义摄取，实现 `IExtractor` 以进行自定义拆分 |

## 使用应用程序

| App | 平台 | 仓库 |
|-----| ---------- | ------------ |
| Dev-Op-Typer | Windows (WinUI 3) | [mcp-tool-shop-org/dev-op-typer](https://github.com/mcp-tool-shop-org/dev-op-typer) |
| linux-dev-typer | 跨平台（.NET） | [mcp-tool-shop-org/linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer) |

## 许可证

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcptoolshop.com">MCP Tool Shop</a>
</p>
