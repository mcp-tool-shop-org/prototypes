<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/code-bearings/readme.png" width="400" alt="Code Bearings">
</p>

# @code-bearings/core

Shared product logic for Code Bearings — source-grounded extraction, graph, review, and rendering.

This package contains all the canonical truth. Both the CLI and VS Code extension are thin consumers of this package.

## Install

```bash
npm install @code-bearings/core
```

## What's Inside

| Module | What it does |
|--------|-------------|
| `indexer` | Indexes TypeScript projects via ts-morph — extracts files, symbols, edges, modules |
| `graph` | SQLite-backed graph store (`BearingsStore`) with files, symbols, edges, modules, metrics |
| `review` | Generates change briefs from git diffs — risk scoring, symbol explanations, reviewer tips |
| `cards` | Module cards and function cards with evidence |
| `evidence` | Evidence collection and formatting |
| `rendering` | HTML reports, Markdown, compact text, SVG dependency graphs |
| `cursor` | Cursor context resolver for editor integration |

## Usage

```typescript
import {
  BearingsStore,
  indexProject,
  generateChangeBrief,
  generateModuleCard,
  generateFunctionCard,
  generateSystemMap,
  formatChangeBrief,
  resolveCursorContext,
} from "@code-bearings/core";

// Index a project
const store = new BearingsStore("bearings.db");
indexProject(store, { projectRoot: "/path/to/project" });

// Generate a module card
const card = generateModuleCard(store, "auth");

// Generate a change brief from a diff
const brief = generateChangeBrief(store, diffText);

// Resolve cursor context for editor integration
const ctx = resolveCursorContext(store, filePath, lineNumber, brief);
```

## Subpath Exports

```typescript
import { BearingsStore } from "@code-bearings/core/graph";
import { indexProject } from "@code-bearings/core/indexer";
import { generateChangeBrief } from "@code-bearings/core/review";
import { generateModuleCard } from "@code-bearings/core/cards";
import { renderHtmlReport } from "@code-bearings/core/rendering";
```

## Key Types

```typescript
// The graph database
BearingsStore

// Records
FileRecord, SymbolRecord, EdgeRecord, ModuleRecord

// Review artifacts
ChangeBrief, ChangedModule, SymbolExplanation, ReviewerTip

// Cards
ModuleCard, FunctionCard, SystemMap

// Editor integration
CursorContext

// Purpose modes
ReviewMode: "general" | "bug-hunter" | "learning" | "architecture" | "exploration"
```

## Security

- Read-only source access via AST parsing (ts-morph)
- Local SQLite database only
- No network access, no telemetry
- No code execution — static analysis only

## License

[MIT](../../LICENSE)

---

Part of [Code Bearings](https://github.com/mcp-tool-shop-org/code-bearings) · Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
