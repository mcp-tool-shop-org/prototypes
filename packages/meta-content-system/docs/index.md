# Meta Content System

Shared content pipeline for typing-practice apps — ingests source code, normalizes, computes difficulty metrics, and produces an indexed library.

## Key Features

- **Deterministic Pipeline** — Identical output across all platforms
- **Zero Dependencies** — Pure .NET 8 library
- **Smart Extraction** — Splits large files into right-sized practice blocks
- **Content Deduplication** — SHA-256 content-addressed IDs
- **Difficulty Metrics** — Symbol density, indent depth, line count scoring

## NuGet Package

```bash
dotnet add package DevOpTyper.Content
```

## Links

- [GitHub Repository](https://github.com/mcp-tool-shop-org/meta-content-system)
- [DevOpTyper.Content on NuGet](https://www.nuget.org/packages/DevOpTyper.Content)
- [MCP Tool Shop](https://github.com/mcp-tool-shop-org)
