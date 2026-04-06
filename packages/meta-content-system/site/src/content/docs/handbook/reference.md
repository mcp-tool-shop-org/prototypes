---
title: Reference
description: CLI commands, query API, metrics, and supported languages.
sidebar:
  order: 3
---

## CLI commands

Run the CLI via `dotnet run --project src/DevOpTyper.Content.Cli`:

| Command | Description |
|---------|-------------|
| `build --source <dir> --out <file>` | Build a library index from all files in a folder (recursive) |
| `paste --lang <lang> --title <title> --text <text> --out <file>` | Add a single snippet to the index |

Both commands default `--out` to `library.index.json` when omitted.

### Global flags

| Flag | Description |
|------|-------------|
| `--version`, `-V` | Print the assembly version and exit |
| `--help`, `-h` | Show usage help |

### Build behavior

- Recursively enumerates all files under `--source`
- Files larger than 2 MB are skipped
- Unreadable files are silently skipped
- Each file is assigned the `corpus` source category
- The folder path is stored as the `Origin` field

### Paste behavior

- Creates a single item with the `user` source category
- Language is set via `--lang` (defaults to `text`)
- No `Origin` is set

## Query API

`InMemoryContentLibrary` supports filtering on every `ContentQuery` property:

```csharp
var library = new InMemoryContentLibrary(index.Items);
var results = library.Query(new ContentQuery
{
    Language = "python",           // case-insensitive language match
    Source = "corpus",             // filter by source category
    MinLines = 5,                  // minimum line count
    MaxLines = 50,                 // maximum line count
    MinSymbolDensity = 0.1f,       // minimum symbol density
    MaxSymbolDensity = 0.4f        // maximum symbol density
});
```

All filter properties are nullable. Omitting a property skips that filter. Filters are combined with AND logic.

`Languages()` returns a sorted, distinct list of all languages in the library.

## Metrics computed

| Metric | Type | Description |
|--------|------|-------------|
| `Lines` | `int` | Total line count (counts `\n` characters + 1) |
| `Characters` | `int` | Total character count including whitespace |
| `SymbolDensity` | `float` | Ratio of symbol characters to non-whitespace characters (0.0--1.0) |
| `MaxIndentDepth` | `int` | Deepest indentation level (4-space units; tabs count as 4 spaces) |

### Symbol characters

The following characters count as symbols for the density metric:

```
{ } [ ] ( ) < > ; : , . = + - * / % ! & | ^ ~ ? @ # \ " '
```

## Supported languages

### Extension map

| Extension(s) | Language |
|-------------|----------|
| `.py` | `python` |
| `.cs` | `csharp` |
| `.java` | `java` |
| `.js` | `javascript` |
| `.ts` | `typescript` |
| `.sql` | `sql` |
| `.sh`, `.bash` | `bash` |
| `.rs` | `rust` |
| `.go` | `go` |
| `.kt` | `kotlin` |
| `.cpp`, `.cc`, `.cxx`, `.hpp` | `cpp` |
| `.c`, `.h` | `c` |
| `.json` | `json` |
| `.yml`, `.yaml` | `yaml` |
| `.md` | `markdown` |

### Content heuristics

When no file extension is available or the extension is not in the map, the detector falls back to content-based heuristics (checked in this order):

1. **Python** -- contains `def ` and `:` with indented lines
2. **C#** -- contains `namespace ` or `using ` with `;`
3. **Java** -- contains `public static void main` or `class ` with `{`
4. **Rust** -- contains `fn ` with `let ` or `::`
5. **SQL** -- contains `SELECT` and `FROM` (case-insensitive)
6. **JavaScript** -- contains `=>` or `function `
7. **Bash** -- starts with `#!/` or contains `#!/bin/bash`

If no heuristic matches, the language defaults to `text`.

## Consuming apps

| App | Platform | Repository |
|-----|----------|------------|
| Dev-Op-Typer | Windows (WinUI 3) | [mcp-tool-shop-org/dev-op-typer](https://github.com/mcp-tool-shop-org/dev-op-typer) |
| linux-dev-typer | Cross-platform (.NET) | [mcp-tool-shop-org/linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer) |

## Project structure

```
meta-content-system/
├── src/
│   ├── DevOpTyper.Content/            # Core library (NuGet package)
│   │   ├── Abstractions/              # IContentLibrary, IContentSource,
│   │   │                              #   IExtractor, IMetricCalculator, ILibraryIndexStore
│   │   ├── Models/                    # CodeItem, CodeMetrics, LibraryIndex, LibraryStats
│   │   └── Services/                  # LanguageDetector, Normalizer, ContentId,
│   │                                  #   MetricCalculator, LibraryIndexBuilder,
│   │                                  #   DefaultExtractor, InMemoryContentLibrary,
│   │                                  #   JsonLibraryIndexStore
│   └── DevOpTyper.Content.Cli/        # CLI tool for batch indexing
├── tests/
│   └── DevOpTyper.Content.Tests/      # xUnit tests
├── docs/                              # Design documents
├── spec/                              # JSON schemas (codeitem, libraryindex)
└── site/                              # Starlight handbook
```
