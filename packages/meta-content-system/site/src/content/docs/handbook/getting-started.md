---
title: Getting Started
description: Install the NuGet package and build your first content index.
sidebar:
  order: 1
---

## Install

Add the NuGet package to your .NET project:

```bash
dotnet add package DevOpTyper.Content
```

Requires .NET 8 SDK or later. No other tools or dependencies needed.

## Build an index from code

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

// 4. Save the index
var store = new JsonLibraryIndexStore();
store.Save("library.index.json", index);
```

## Using the CLI

Build an index from the command line:

```bash
dotnet run --project src/DevOpTyper.Content.Cli -- build \
  --source ./my-code --out library.index.json
```

Paste a single snippet:

```bash
dotnet run --project src/DevOpTyper.Content.Cli -- paste \
  --lang csharp --title "Hello World" \
  --text "Console.WriteLine(\"Hello\");"
```

## Building from source

```bash
git clone https://github.com/mcp-tool-shop-org/meta-content-system.git
cd meta-content-system
dotnet restore
dotnet build -c Release
dotnet test -c Release
```
