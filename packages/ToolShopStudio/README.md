<p align="center">
  <strong>English</strong> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.zh.md">中文</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.hi.md">हिन्दी</a> |
  <a href="README.it.md">Italiano</a> |
  <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ToolShopStudio/readme.png" width="400" height="400" alt="ToolShopStudio">
</p>

<p align="center">
  Six MCP tools + live Registry — one install for ordinary creators.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ToolShopStudio/actions"><img src="https://github.com/mcp-tool-shop-org/ToolShopStudio/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/toolshopstudio"><img src="https://img.shields.io/npm/v/@mcptoolshop/toolshopstudio" alt="npm version"></a>
  <img src="https://img.shields.io/badge/tools-FFmpeg%20%2B%20Pandoc%20%2B%20FreeCAD%20%2B%20GDAL%20%2B%20OpenSCAD%20%2B%20Blender-orange" alt="Tools">
  <img src="https://img.shields.io/badge/tests-323%20passing-brightgreen" alt="Tests">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
</p>

---

## Now Shipping

| Tool | What It Does |
|------|--------------|
| **FFmpeg YouTube MCP** | YouTube-safe presets (guaranteed + premium with fallback), closed-GOP locks, dual thumbnails |
| **Pandoc MCP** | Zero-flag document conversion: blog, academic PDF, ebook, slides, newsletter |
| **FreeCAD MCP** | Safe 3D CAD export: STL, STEP, GLB, 3MF, OBJ — headless, no user code |
| **GDAL MCP** | Geospatial transforms: reproject rasters, convert vectors, clip regions — the FFmpeg of GIS |
| **OpenSCAD MCP** | Pure-text parametric CAD: STL, OBJ, 3MF, PNG preview, DXF — text in, mesh out |
| **Blender MCP** | Headless 3D rendering: PNG preview, GLB export, video, STL mesh, Cycles — no GUI needed |
| **Registry** | Self-documenting, MCP-ready — 6 tools, 32 presets, 15 output formats, auto-generated docs |

All six tools share the same frozen surface: **schema-first, sandboxed, observable, context DI, zero raw args**.

ToolShopStudio now includes a **self-documenting registry** — ask it anything about any tool, preset, or pattern.

```typescript
import { registry } from "@mcptoolshop/toolshopstudio";

registry.findTool("openscad");           // full ToolDefinition
registry.searchByPreset("academic-pdf"); // → { toolId: "pandoc", ... }
registry.searchByOutputFormat("STL");    // → FreeCAD + OpenSCAD + Blender presets
registry.getAllPremiumPresets();          // → 9 premium→guaranteed fallback chains
```

ToolShopStudio now ships with a **live registry** — run `npm run toolshop registry list` or call `listTools()` from any MCP client.

```bash
npm run toolshop registry list         # table of all tools + preset counts
npm run toolshop registry show ffmpeg  # full details for one tool
npm run toolshop registry summary      # 6 tools, 32 presets, 15 formats
npm run toolshop registry json         # registry summary as JSON
npm run toolshop registry docs         # generate markdown docs to docs/
```

## Quick Start

```bash
npm install @mcptoolshop/toolshopstudio
```

```typescript
import {
  transcodeForYouTube,
  createInMemoryCRUD,
  pandoc,
  freecad,
  gdal,
  openscad,
  blender,
} from "@mcptoolshop/toolshopstudio";

// ── FFmpeg: YouTube-safe transcode ──────────────────────────────
const ffmpegCrud = createInMemoryCRUD();
const video = await transcodeForYouTube(
  { inputPath: "input.mp4", outputPath: "output.mp4", preset: "yt-1080p-h264" },
  { signal, userId, notify, createAsset: (a) => ffmpegCrud.create(a), runFfmpeg, runProbe },
);

// ── Pandoc: document conversion ─────────────────────────────────
const pandocCrud = pandoc.createPandocCRUD();
const doc = await pandoc.convertDocument(
  { inputPath: "thesis.md", outputPath: "thesis.pdf", preset: "academic-pdf" },
  { signal, userId, notify, createAsset: (a) => pandocCrud.create(a), runPandoc, checkInput, assertOutput, statFile },
);

// ── FreeCAD: 3D CAD export ──────────────────────────────────────
const freecadCrud = freecad.createFreeCADCRUD();
const part = await freecad.exportPart(
  { inputPath: "bracket.FCStd", outputPath: "bracket.stl", preset: "stl-print-ready" },
  { signal, userId, notify, createAsset: (a) => freecadCrud.create(a), runFreeCAD, checkInput, assertOutput, statFile },
);

// ── GDAL: geospatial transform ──────────────────────────────────
const gdalCrud = gdal.createGDALCRUD();
const geo = await gdal.transformGeo(
  { inputPath: "terrain.tif", outputPath: "terrain_wgs84.tif", preset: "raster-wgs84-tiff" },
  { signal, userId, notify, createAsset: (a) => gdalCrud.create(a), runGDAL, checkInput, assertOutput, statFile },
);

// ── OpenSCAD: parametric CAD render ─────────────────────────────
const openscadCrud = openscad.createOpenSCADCRUD();
const model = await openscad.renderModel(
  { inputPath: "cube.scad", outputPath: "cube.stl", preset: "stl-print-ready" },
  { signal, userId, notify, createAsset: (a) => openscadCrud.create(a), runOpenSCAD, checkInput, assertOutput, statFile },
);

// ── Blender: headless 3D render ────────────────────────────────
const blenderCrud = blender.createBlenderCRUD();
const render = await blender.renderBlend(
  { inputPath: "scene.blend", outputPath: "render.png", preset: "png-preview" },
  { signal, userId, notify, createAsset: (a) => blenderCrud.create(a), runBlender, checkInput, assertOutput, statFile },
);
```

## FFmpeg Presets

| Preset | Codec | Resolution | CRF | Tier |
|--------|-------|-----------|-----|------|
| `yt-1080p-h264` | libx264 | 1920x1080 | 18 | Guaranteed |
| `yt-1080p-h265` | libx265 | 1920x1080 | 20 | Premium |
| `yt-4k-h264` | libx264 | 3840x2160 | 18 | Guaranteed |
| `yt-4k-h265` | libx265 | 3840x2160 | 20 | Premium |
| `yt-4k-hdr-h265` | libx265 | 3840x2160 | 18 | Premium (HDR) |
| `yt-shorts-h264` | libx264 | 1080x1920 | 18 | Guaranteed |
| `yt-shorts-h265` | libx265 | 1080x1920 | 20 | Premium |

## Pandoc Presets

| Preset | From | To | Output | Tier |
|--------|------|----|--------|------|
| `blog-post` | Markdown | HTML5 | `.html` | Guaranteed |
| `academic-pdf` | Markdown | PDF (XeLaTeX) | `.pdf` | Guaranteed |
| `ebook` | Markdown | EPUB | `.epub` | Guaranteed |
| `slides` | Markdown | Reveal.js | `.html` | Guaranteed |
| `newsletter` | Markdown | HTML5 | `.html` | Premium (falls back to blog-post) |

## FreeCAD Presets

| Preset | Format | Output | Quality Flag | Tier |
|--------|--------|--------|-------------|------|
| `stl-print-ready` | STL | `.stl` | `--mesh-repair` | Guaranteed |
| `step-precision` | STEP | `.step` | `--precision=0.001` | Guaranteed |
| `glb-web-ready` | GLB | `.glb` | `--optimize` | Guaranteed |
| `3mf-slicer-ready` | 3MF | `.3mf` | `--color` | Premium (falls back to stl-print-ready) |
| `obj-mesh` | OBJ | `.obj` | — | Guaranteed |

## GDAL Presets

| Preset | Binary | Output | Flags | Tier |
|--------|--------|--------|-------|------|
| `raster-wgs84-tiff` | gdalwarp | `.tif` | `-t_srs EPSG:4326 -co COMPRESS=LZW` | Guaranteed |
| `vector-geojson` | ogr2ogr | `.geojson` | `-f GeoJSON` | Guaranteed |
| `raster-to-png` | gdal_translate | `.png` | `-of PNG -scale` | Guaranteed |
| `vector-shapefile` | ogr2ogr | `.shp` | `-f "ESRI Shapefile"` | Guaranteed |
| `clip-raster` | gdalwarp | `.tif` | `-te <bbox> -co COMPRESS=LZW` | Premium (falls back to raster-wgs84-tiff) |

## OpenSCAD Presets

| Preset | Format | Output | $fn (draft/std/high) | Tier |
|--------|--------|--------|---------------------|------|
| `stl-print-ready` | STL | `.stl` | 16 / 32 / 64 | Guaranteed |
| `obj-mesh` | OBJ | `.obj` | 16 / 32 / 64 | Guaranteed |
| `3mf-color` | 3MF | `.3mf` | 16 / 32 / 64 | Premium (falls back to stl-print-ready) |
| `png-preview` | PNG | `.png` | 16 / 32 / 64 | Guaranteed |
| `dxf-2d` | DXF | `.dxf` | 16 / 32 / 64 | Guaranteed |

## Blender Presets

| Preset | Engine | Output | Quality (draft/std/high) | Tier |
|--------|--------|--------|------------------------|------|
| `png-preview` | Workbench | `.png` | 64 / 256 / 1024 samples | Guaranteed |
| `glb-export` | Python expr | `.glb` | — | Guaranteed |
| `video-1080p` | Default | `.mp4` | 64 / 256 / 1024 samples | Guaranteed |
| `stl-from-mesh` | Python expr | `.stl` | — | Guaranteed |
| `cycles-render` | Cycles | `.png` | 64 / 256 / 1024 samples | Premium (falls back to png-preview) |

## Architecture

- **Schema-first**: Zod schemas for every input/output, fully type-safe
- **Context DI**: All side effects injected via context objects, 100% mockable
- **Sandbox isolation**: Path traversal prevention on every file operation
- **Observable**: Typed notifications (progress, warnings, ready) at every stage
- **Cancellation**: AbortController propagated to every pipeline checkpoint
- **Fallback**: Premium presets auto-degrade to guaranteed on failure/assertion mismatch
- **Safe execution**: FreeCAD uses pre-baked Python one-liners (no exec/eval/user code)
- **Multi-binary**: GDAL dispatches to gdalwarp, ogr2ogr, or gdal_translate per preset
- **Text-first CAD**: OpenSCAD renders pure `.scad` text to mesh/image (no binary input)
- **Headless 3D rendering**: Blender runs headless with pre-baked Python exprs for GLB/STL export
- **Live Registry**: Validated singleton, MCP introspection tools, CLI, auto-generated docs

## Generated Docs

The registry auto-generates markdown docs for every tool, all presets, and the full registry overview:

| Document | Contents |
|----------|----------|
| [`docs/registry.md`](docs/registry.md) | Full registry overview — all 6 tools, presets, patterns |
| [`docs/presets.md`](docs/presets.md) | Preset cross-reference — which presets exist on which tools |
| [`docs/tools/ffmpeg.md`](docs/tools/ffmpeg.md) | FFmpeg YouTube MCP — 7 presets, 14 patterns |
| [`docs/tools/pandoc.md`](docs/tools/pandoc.md) | Pandoc MCP — 5 presets, 11 patterns |
| [`docs/tools/freecad.md`](docs/tools/freecad.md) | FreeCAD MCP — 5 presets, 13 patterns |
| [`docs/tools/gdal.md`](docs/tools/gdal.md) | GDAL MCP — 5 presets, 14 patterns |
| [`docs/tools/openscad.md`](docs/tools/openscad.md) | OpenSCAD MCP — 5 presets, 15 patterns |
| [`docs/tools/blender.md`](docs/tools/blender.md) | Blender MCP — 5 presets, 15 patterns |

Regenerate at any time: `npm run docs:generate`

## Docker

```bash
docker build -t toolshopstudio .
docker run -v ./sandbox:/sandbox toolshopstudio
```

All six runtime binaries (`ffmpeg`, `pandoc`, `freecad-cmd`, `gdal-bin`, `openscad`, `blender`) are pre-installed in the image.

## Development

```bash
npm install          # dependencies
npm run typecheck    # tsc --noEmit
npm test             # vitest (323 tests)
npm run build        # compile to dist/
npm run smoke        # end-to-end smoke (all six tools + registry, 15 tests)
npm run docs:generate # generate registry docs to docs/
```

## License

MIT
