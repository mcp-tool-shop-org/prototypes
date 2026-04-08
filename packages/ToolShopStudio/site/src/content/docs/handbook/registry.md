---
title: Live Registry
description: Query tools, presets, and output formats at runtime with the self-documenting registry.
sidebar:
  order: 3
---

The registry is a validated singleton that provides MCP introspection, CLI access, and auto-generated docs for all six tools.

## API

```typescript
import { registry } from "@mcptoolshop/toolshopstudio";

// Look up tools
registry.findTool("openscad");           // full ToolDefinition or null
registry.getAllToolIds();                 // ["ffmpeg", "pandoc", ...]
registry.getAllTools();                   // all ToolDefinition objects

// Preset search
registry.searchByPreset("academic-pdf"); // first tool owning this preset
registry.searchAllByPreset("stl-print-ready"); // all tools with this preset (FreeCAD + OpenSCAD)

// Format search
registry.searchByOutputFormat("STL");    // all presets producing STL
registry.searchByOutputExt("html");      // all presets producing .html files

// Pattern search
registry.getCommonPattern("sandbox");    // tools using "sandbox" pattern
registry.getToolsByPattern("python");    // tool IDs using "python" pattern

// Premium / fallback introspection
registry.getAllPremiumPresets();          // 9 premium->guaranteed fallback chains
registry.getPremiumPresetMap();          // { ffmpeg: ["yt-1080p-h265", ...], ... }
```

## CLI

```bash
npm run toolshop registry list         # table of all tools + preset counts
npm run toolshop registry show ffmpeg  # full details for one tool
npm run toolshop registry summary      # 6 tools, 32 presets, 15 formats
npm run toolshop registry json         # registry summary as JSON
npm run toolshop registry docs         # generate markdown docs to docs/
```

## Generated docs

The registry auto-generates markdown for every tool:

| Document | Contents |
|----------|----------|
| `docs/registry.md` | Full registry overview |
| `docs/presets.md` | Preset cross-reference |
| `docs/tools/ffmpeg.md` | FFmpeg — 7 presets, 14 patterns |
| `docs/tools/pandoc.md` | Pandoc — 5 presets, 11 patterns |
| `docs/tools/freecad.md` | FreeCAD — 5 presets, 13 patterns |
| `docs/tools/gdal.md` | GDAL — 5 presets, 14 patterns |
| `docs/tools/openscad.md` | OpenSCAD — 5 presets, 15 patterns |
| `docs/tools/blender.md` | Blender — 5 presets, 15 patterns |

Regenerate at any time with `npm run docs:generate`.

## MCP introspection tools

The registry exposes three MCP-compatible introspection tools for use with any MCP client:

| Tool Name | Description |
|-----------|-------------|
| `registry.listTools` | List all registered tools with preset counts and premium counts |
| `registry.getToolInfo` | Get the full definition for a specific tool by ID |
| `registry.searchPresets` | Search for a preset name across all registered tools |

These tools use Zod-validated request/response schemas and are ready for direct MCP server registration:

```typescript
import { registryMcpTools } from "@mcptoolshop/toolshopstudio";

for (const [name, { schema, handler }] of Object.entries(registryMcpTools)) {
  server.addTool(name, schema, handler);
}
```
