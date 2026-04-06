---
title: Beginners
description: New to Meta Content System? Start here to learn the concepts and build your first index.
sidebar:
  order: 99
---

## What is Meta Content System?

Meta Content System is a .NET 8 library that turns source code files into a searchable, difficulty-rated index for typing-practice applications. It powers both Dev-Op-Typer (Windows) and linux-dev-typer (cross-platform) with a single, deterministic pipeline.

The core idea: feed source code in, get a `library.index.json` out. That index contains normalized snippets with language tags and difficulty metrics that apps use to serve practice content at the right level.

## Who is it for?

- **App developers** building typing-practice or code-reading tools who need a content pipeline
- **Educators** assembling curated code snippet libraries for classroom exercises
- **Contributors** to Dev-Op-Typer or linux-dev-typer who want to understand the shared content layer

If you just want to use Dev-Op-Typer or linux-dev-typer as an end user, you do not need this library directly -- the apps bundle it internally.

## Core concepts

**Content source** -- Any provider of raw text. This could be a folder of files, a single pasted snippet, or a custom data source you implement via the `IContentSource` interface.

**Language detection** -- The pipeline identifies the programming language of each file using file extensions first, then content heuristics as a fallback. Over 20 languages are recognized. Anything unrecognized becomes `text`.

**Extraction** -- Large files are automatically split into right-sized practice blocks at blank-line boundaries. Small files pass through whole. This keeps each snippet comfortable for a typing session.

**Normalization** -- All line endings are converted to LF (`\n`) and a trailing newline is ensured. This makes output identical across Windows, macOS, and Linux.

**Content ID** -- Each snippet gets a SHA-256 content-addressed ID derived from its language and normalized text. Importing the same file twice produces the same ID, so duplicates are automatically eliminated.

**Metrics** -- Four difficulty metrics are computed for every snippet: line count, character count, symbol density (how punctuation-heavy the code is), and maximum indent depth. These let consuming apps rank snippets by difficulty.

## Prerequisites

You need the [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) or later. No other tools or dependencies are required -- the library is built entirely on the .NET Base Class Library with zero third-party packages.

## Hands-on walkthrough

### Step 1 -- Install the package

Create a new console project and add the NuGet package:

```bash
dotnet new console -n MyContentDemo
cd MyContentDemo
dotnet add package DevOpTyper.Content
```

### Step 2 -- Build an index from the CLI

The fastest way to see the pipeline in action is the built-in CLI. Clone the repo and index a folder of source files:

```bash
git clone https://github.com/mcp-tool-shop-org/meta-content-system.git
cd meta-content-system
dotnet run --project src/DevOpTyper.Content.Cli -- build \
  --source ./src --out my-index.json
```

Open `my-index.json` to see the generated index with items, metrics, and stats.

### Step 3 -- Paste a single snippet

You can also add individual snippets without scanning a folder:

```bash
dotnet run --project src/DevOpTyper.Content.Cli -- paste \
  --lang python --title "Hello" --text "print('hello world')"
```

This writes a one-item index to `library.index.json`.

### Step 4 -- Query the index in code

```csharp
using DevOpTyper.Content.Models;
using DevOpTyper.Content.Services;

// Load a previously generated index
var store = new JsonLibraryIndexStore();
var index = store.Load("my-index.json");

// Query for C# snippets with moderate difficulty
var library = new InMemoryContentLibrary(index.Items);
var results = library.Query(new DevOpTyper.Content.Abstractions.ContentQuery
{
    Language = "csharp",
    MaxSymbolDensity = 0.5f
});

Console.WriteLine($"Found {results.Count} matching snippets");
foreach (var item in results)
    Console.WriteLine($"  {item.Title} ({item.Metrics.Lines} lines, density {item.Metrics.SymbolDensity:F2})");
```

## Common pitfalls

- **Missing .NET 8 SDK** -- The library targets `net8.0`. Running `dotnet --version` should show 8.0 or higher. Earlier SDK versions will not restore the package.
- **Binary files in the source folder** -- The CLI skips files larger than 2 MB and silently skips unreadable files, but indexing a folder full of images or binaries will produce an empty or sparse index. Point `--source` at actual code.
- **Expecting real-time updates** -- The index is a static JSON file. If you add new source files, rebuild the index to pick them up.
- **Language misdetection** -- Content heuristics are intentionally simple and ordered. A JavaScript file without `=>` or `function ` that happens to contain `class {` may be detected as Java. Use file extensions or the `LanguageHint` field on `RawContent` for reliable detection.

## Where to go next

- **[Getting Started](/meta-content-system/handbook/getting-started/)** -- Full library API walkthrough with code samples
- **[Architecture](/meta-content-system/handbook/architecture/)** -- How the pipeline stages connect and what each interface does
- **[Reference](/meta-content-system/handbook/reference/)** -- Complete CLI flags, query filters, metric definitions, and language tables
