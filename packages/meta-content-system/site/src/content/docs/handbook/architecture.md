---
title: Architecture
description: Pipeline stages, interfaces, and data flow.
sidebar:
  order: 2
---

## Pipeline overview

```
IContentSource          Enumerates raw files
       |
       v
LanguageDetector        Extension map + content heuristics
       |
       v
IExtractor              Split large files into practice blocks
       |
       v
Normalizer              Line endings → LF, trailing newline
       |
       v
ContentId               SHA-256(language + normalized code)
       |                First 16 bytes → 32-char hex ID
       v
IMetricCalculator       Lines, characters, symbol density,
       |                max indent depth
       v
LibraryIndexBuilder     Deduplicates, sorts, emits index
       |
       v
ILibraryIndexStore      Serialize/deserialize library.index.json
       |
       v
IContentLibrary         Query by language, source, line count,
                        symbol density range
```

## Key interfaces

Every pipeline stage is behind an abstraction for testability and extensibility:

| Interface | Purpose |
|-----------|---------|
| `IContentSource` | Enumerates raw input files (implement for custom sources) |
| `IExtractor` | Splits large files into right-sized practice blocks |
| `IMetricCalculator` | Computes difficulty metrics per code item |
| `IContentLibrary` | Queries the indexed library by language, difficulty, etc. |
| `ILibraryIndexStore` | Serializes and deserializes the library index |

## Design goals

| Goal | How |
|------|-----|
| **Platform-stable output** | LF normalization, deterministic sort, content-addressed IDs |
| **Zero external dependencies** | Pure .NET 8 BCL — no third-party NuGet packages |
| **Interface-driven** | Every pipeline stage is behind an abstraction |
| **Testable** | xUnit test suite with golden-parity checks |
| **Extensible** | Implement `IContentSource` for custom ingestion, `IExtractor` for custom splitting |

## Content deduplication

Each code item gets a SHA-256 content-addressed ID computed from `language + normalized_code`. The first 16 bytes produce a 32-character hex ID. Importing the same file twice produces one entry — no duplicates accumulate.

## Smart extraction

`DefaultExtractor` splits large files into right-sized practice blocks using blank-line boundaries. Small files are kept whole. The thresholds are configurable via init-only properties:

| Property | Default | Description |
|----------|---------|-------------|
| `MaxCharsWholeFile` | 4000 | Files at or below this size are returned as a single unit |
| `MinBlockChars` | 200 | Blocks shorter than this are skipped |
| `MaxBlockChars` | 2000 | Blocks longer than this are skipped |

When a large file produces no qualifying blocks (all are too short or too long), the extractor falls back to returning the entire file as one unit.

## Models

### RawContent

The record that `IContentSource` yields for each file:

| Field | Type | Description |
|-------|------|-------------|
| `Path` | `string?` | File path (null for pasted text) |
| `LanguageHint` | `string?` | Optional language override |
| `Title` | `string` | Display title |
| `Text` | `string` | Raw source text |
| `Source` | `string` | Origin category: `builtin`, `corpus`, or `user` |
| `Origin` | `string?` | Pack name or root folder path |

### CodeItem

The record stored in the library index after processing:

| Field | Type | Description |
|-------|------|-------------|
| `Id` | `string` | Content-addressed hex ID (32 chars) |
| `Language` | `string` | Detected language |
| `Source` | `string` | Origin category |
| `Title` | `string` | Display title |
| `Code` | `string` | Normalized source text |
| `Metrics` | `CodeMetrics` | Computed difficulty metrics |
| `CreatedUtc` | `DateTimeOffset` | Timestamp |
| `Origin` | `string?` | Pack name or root path |
| `Concepts` | `string[]?` | Optional concept tags |

### LibraryIndex

| Field | Type | Description |
|-------|------|-------------|
| `Version` | `int` | Schema version (currently `1`) |
| `GeneratedUtc` | `DateTimeOffset` | When the index was built |
| `Items` | `List<CodeItem>` | All indexed code items |
| `Stats` | `LibraryStats?` | Summary statistics (populated on save) |

### LibraryStats

| Field | Type | Description |
|-------|------|-------------|
| `TotalItems` | `int` | Number of items in the index |
| `Languages` | `List<string>` | Distinct languages found |
