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

**タイピング練習アプリ向けの共有コンテンツシステム -- レッスン、進捗、および適応的な難易度。**

Meta Content Systemは、[Dev-Op-Typer](https://github.com/mcp-tool-shop-org/dev-op-typer)（Windows）および[linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer)（クロスプラットフォーム）で使用されている、可搬性の高いコンテンツ処理パイプラインです。このシステムは、ソースコードファイルを読み込み、それらを決定的に正規化し、難易度指標を計算し、インデックス化されたライブラリを生成します。このライブラリは、どちらのアプリケーションもプラットフォームに関わらず同じように利用します。

## なぜMeta Content Systemを使うのか？

- **単一のパイプライン、すべてのプラットフォーム** -- 同じ入力ファイルから、Windows、Linux、macOSで同じ`library.index.json`が生成されます。プラットフォーム間の差異はありません。
- **外部依存関係ゼロ** -- 完全に.NET 8ライブラリで構築されており、BCL（.NET Base Class Library）のみを使用します。インストールする必要がなく、競合もありません。
- **インターフェース駆動型アーキテクチャ** -- すべてのパイプラインのステージ（`IContentSource`、`IExtractor`、`IMetricCalculator`、`IContentLibrary`）は、テスト容易性と拡張性を実現するために抽象化されています。
- **決定論的な言語検出** -- ファイル拡張子とコンテンツのヒューリスティックに基づくルールベースの識別。20以上の言語を標準でサポートしています。
- **SHA-256によるコンテンツの重複排除** -- コンテンツベースのIDにより、インポート時の重複を防止します。同じファイルを2回インポートしても、1つのエントリのみが作成されます。
- **難易度を考慮したメトリック** -- シンボルの密度、インデントの深さ、行数、および文字の分布が、アプリ側の適応的な難易度設定を可能にします。
- **スマートな抽出** -- 大きなファイルは適切なサイズの練習ブロックに分割され、小さなファイルはそのまま保持されます。設定可能な閾値があります。

## NuGetパッケージ

| パッケージ | 説明 |
| --------- | ------------- |
| [`DevOpTyper.Content`](https://www.nuget.org/packages/DevOpTyper.Content) | コンテンツの読み込み、正規化、言語検出、メトリックの計算、およびインデックスの生成。外部依存関係はゼロです。 |

```bash
dotnet add package DevOpTyper.Content
```

## クイックスタート

### ライブラリとして使用

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

### CLIの使用

```bash
dotnet run --project src/DevOpTyper.Content.Cli -- build --source ./my-code --out library.index.json

dotnet run --project src/DevOpTyper.Content.Cli -- paste --lang csharp --title "Hello World" --text "Console.WriteLine(\"Hello\");"
```

## アーキテクチャ

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

### サポートされている言語

言語検出は、拡張子マッピングとコンテンツヒューリスティックにより、20以上の言語をサポートしています。

Python、C#、Java、JavaScript、TypeScript、SQL、Bash、Rust、Go、Kotlin、C、C++、JSON、YAML、Markdown -- および、拡張子マップによるその他の言語。不明なファイルは`text`として扱われます。

### 計算されるメトリック

| メトリック | Type | 説明 |
| -------- | ------ | ------------- |
| `Lines` | `int` | 総行数 |
| `Characters` | `int` | 空白を含む総文字数 |
| `SymbolDensity` | `float` | シンボル文字と空白以外の文字の比率（0.0～1.0） |
| `MaxIndentDepth` | `int` | 最も深いインデントレベル（4スペースのタブ） |

これらのメトリックは、適応的な難易度設定を可能にします。シンボルの密度が高く、ネストが深いコードは、単純な文章よりもタイピングが難しいです。

## 前提条件

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)またはそれ以降

その他のツールや依存関係は必要ありません。

## ソースコードからのビルド

```bash
git clone https://github.com/mcp-tool-shop-org/meta-content-system.git
cd meta-content-system
dotnet restore
dotnet build -c Release
dotnet test -c Release
```

## プロジェクト構造

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

## 設計目標

| Goal | How |
| ------ |-----|
| **Platform-stable output** | LFによる正規化、決定論的なソート、コンテンツベースのID |
| **外部依存関係ゼロ** | 純粋な.NET 8 BCL -- サードパーティのNuGetパッケージは使用していません。 |
| **Interface-driven** | すべてのパイプラインのステージは抽象化されています。 |
| **Testable** | xUnitテストスイートで、golden-parityチェックを実施しています。 |
| **Extensible** | カスタムのコンテンツ読み込みには`IContentSource`を、カスタムの分割には`IExtractor`を実装してください。 |

## 利用可能なアプリケーション

| App | プラットフォーム | リポジトリ |
|-----| ---------- | ------------ |
| Dev-Op-Typer | Windows (WinUI 3) | [mcp-tool-shop-org/dev-op-typer](https://github.com/mcp-tool-shop-org/dev-op-typer) |
| linux-dev-typer | クロスプラットフォーム対応 (.NET) | [mcp-tool-shop-org/linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer) |

## ライセンス

[MIT](LICENSE)

---

<p align="center">
  Built by <a href="https://mcptoolshop.com">MCP Tool Shop</a>
</p>
