---
title: Beginners Guide
description: A step-by-step introduction to ToolShopStudio for first-time users.
sidebar:
  order: 99
---

This guide walks you through ToolShopStudio from zero to your first working pipeline. No prior MCP knowledge required.

## What is ToolShopStudio?

ToolShopStudio bundles six professional media tools (FFmpeg, Pandoc, FreeCAD, GDAL, OpenSCAD, Blender) behind a single npm package with a unified, type-safe API. Instead of memorizing CLI flags for each tool, you pick a preset and let ToolShopStudio handle the rest.

Every tool follows the same contract: validate input with Zod schemas, sandbox all file operations, inject side effects via context, and report progress through typed notifications. Premium presets automatically fall back to guaranteed alternatives if the runtime cannot fulfill them.

## Prerequisites

Before installing ToolShopStudio, make sure you have:

- **Node.js 18+** and npm
- **TypeScript 5.7+** (for type-safe usage)
- At least one runtime binary installed for the tool you want to use:

| Tool | Binary | Install (Ubuntu) | Install (macOS) |
|------|--------|-------------------|-----------------|
| FFmpeg | `ffmpeg` | `apt install ffmpeg` | `brew install ffmpeg` |
| Pandoc | `pandoc` | `apt install pandoc` | `brew install pandoc` |
| FreeCAD | `freecad-cmd` | `apt install freecad` | `brew install --cask freecad` |
| GDAL | `gdalwarp`, `ogr2ogr` | `apt install gdal-bin` | `brew install gdal` |
| OpenSCAD | `openscad` | `apt install openscad` | `brew install --cask openscad` |
| Blender | `blender` | `apt install blender` | `brew install --cask blender` |

You only need the binaries for tools you plan to use. The Docker image includes all six pre-installed.

## Installation

Install from npm:

```bash
npm install @mcptoolshop/toolshopstudio
```

Or use Docker for a batteries-included environment:

```bash
docker build -t toolshopstudio .
docker run -v ./sandbox:/sandbox toolshopstudio
```

## Your first conversion

Here is a minimal example that converts a Markdown file to an HTML blog post using the Pandoc tool:

```typescript
import { pandoc } from "@mcptoolshop/toolshopstudio";
import { access, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const crud = pandoc.createPandocCRUD();
const controller = new AbortController();

const doc = await pandoc.convertDocument(
  {
    inputPath: "my-post.md",
    outputPath: "my-post.html",
    preset: "blog-post",
  },
  {
    signal: controller.signal,
    userId: "beginner",
    notify: (n) => console.log(n.type, n),
    createAsset: (a) => crud.create(a),
    runPandoc: async (args, signal, onProgress) => {
      await execFileAsync("pandoc", args);
      onProgress(100);
    },
    checkInput: async (p) => {
      await access(p);
      const s = await stat(p);
      return { ok: true, warnings: [], detectedFormat: "markdown", sizeBytes: s.size };
    },
    assertOutput: async (_spec, p) => {
      await access(p);
      return { ok: true, warnings: [] };
    },
    statFile: (p) => stat(p),
  },
);
```

Every tool follows this same pattern: pass an input/output/preset object, and a context object with injected side effects. The context DI design means you never call `child_process.exec` directly -- you provide a runner function that ToolShopStudio calls with the correct flags.

## Understanding presets

Presets are the core abstraction. Instead of building CLI flags by hand, you pick a preset name and ToolShopStudio generates the correct command.

**Guaranteed presets** always work if the runtime binary is installed. They use widely-supported codecs and settings.

**Premium presets** use advanced features (H.265, HDR, Cycles rendering, colored 3MF). If the runtime cannot handle them, they automatically fall back to a guaranteed preset. You enable this by setting `allowFallback: true` in your request.

For example, FFmpeg has seven presets:

| Preset | What it does | Tier |
|--------|-------------|------|
| `yt-1080p-h264` | 1080p H.264 for YouTube | Guaranteed |
| `yt-1080p-h265` | 1080p H.265 (better compression) | Premium (falls back to h264) |
| `yt-4k-h264` | 4K H.264 | Guaranteed |
| `yt-4k-h265` | 4K H.265 | Premium |
| `yt-4k-hdr-h265` | 4K HDR H.265 | Premium (falls back to h265) |
| `yt-shorts-h264` | Vertical 1080x1920 H.264 | Guaranteed |
| `yt-shorts-h265` | Vertical H.265 | Premium |

All six tools follow the same guaranteed/premium pattern. Use the registry to discover presets at runtime:

```typescript
import { registry } from "@mcptoolshop/toolshopstudio";

// Find all presets that produce STL files
const stlPresets = registry.searchByOutputFormat("STL");

// See all premium presets and their fallback chains
const premiums = registry.getAllPremiumPresets();
```

## Key concepts

### Schema-first validation

Every request is validated through Zod schemas before any work begins. If you pass an invalid preset name or a path outside the sandbox, you get a typed error immediately -- not a cryptic CLI failure halfway through processing.

### Context dependency injection

All side effects (running binaries, reading files, sending notifications) are injected via the context object. This means:

- **Testability**: mock any dependency without touching the filesystem
- **Portability**: run the same pipeline in Node.js, Docker, or an MCP server
- **Observability**: every notification is typed, so you know exactly what events to expect

### Sandbox isolation

File paths are validated against a per-user sandbox before any operation. Path traversal attempts (e.g., `../../etc/passwd`) are rejected at the validation step. In Docker, mount a single volume for complete filesystem isolation.

### The live registry

The registry is a validated singleton that knows about all six tools, their 32 presets, and 15 output formats. Use it to build dynamic UIs, generate documentation, or let MCP clients discover capabilities at runtime.

```bash
# CLI access
npm run toolshop registry list
npm run toolshop registry summary
npm run toolshop registry docs
```

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Missing runtime binary | Install the tool binary (e.g., `apt install ffmpeg`). ToolShopStudio does not bundle binaries -- it generates the correct flags and calls your injected runner. |
| Disabling `allowFallback` | Fallback is enabled by default (`allowFallback: true`). If you set it to `false`, premium presets will throw on failure instead of degrading to the guaranteed tier. |
| Path outside sandbox | All file paths must be within the user's sandbox directory. Use relative paths or ensure your paths resolve inside the sandbox root. |
| Not handling notifications | The `notify` callback receives typed events (`progress`, `warning`, `ready`). Wire it up to see real-time progress instead of waiting silently. |
| Skipping the `signal` | Always pass an `AbortController.signal`. Long-running renders (Blender Cycles, 4K transcodes) need cancellation support. |

## Next steps

Once you have your first conversion working:

- **Explore other tools** -- try FreeCAD for 3D CAD, GDAL for geospatial data, OpenSCAD for parametric modeling, or Blender for rendering. All follow the same request + context pattern.
- **Use the registry** -- query available presets at runtime with `registry.searchByOutputFormat("STL")` or discover premium fallback chains with `registry.getAllPremiumPresets()`.
- **Try Docker** -- run `docker build -t toolshopstudio .` for a batteries-included environment with all six binaries pre-installed.
- **Read the architecture page** -- understand the shared contract (schema-first, context DI, sandbox isolation, observable notifications) that all six tools share.
- **Check the security page** -- learn about sandbox path validation, preflight checks, and cancellation guarantees.
