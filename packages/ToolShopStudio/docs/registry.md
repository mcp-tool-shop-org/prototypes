# ToolShopStudio Registry

> 6 tools, 32 presets (23 guaranteed, 9 premium)

**Version:** 1.7.0-toolshop  
**Output Formats:** 3MF, DXF, EPUB, GEOJSON, GLB, HTML5, MP4, OBJ, PDF, PNG, REVEALJS, SHP, STEP, STL, TIF

---

# FFmpeg YouTube MCP

> YouTube-safe presets (guaranteed + premium with fallback), closed-GOP locks, dual thumbnails

**Version:** 1.7.0-toolshop  
**Pipeline:** `transcodeForYouTube`

## Presets

| Preset | Format | Extension | Tier | Fallback |
|--------|--------|-----------|------|----------|
| `yt-1080p-h264` | MP4 | `.mp4` | Guaranteed | — |
| `yt-1080p-h265` | MP4 | `.mp4` | Premium | yt-1080p-h264 |
| `yt-4k-h264` | MP4 | `.mp4` | Guaranteed | — |
| `yt-4k-h265` | MP4 | `.mp4` | Premium | yt-4k-h264 |
| `yt-4k-hdr-h265` | MP4 | `.mp4` | Premium | yt-4k-h265 |
| `yt-shorts-h264` | MP4 | `.mp4` | Guaranteed | — |
| `yt-shorts-h265` | MP4 | `.mp4` | Premium | yt-shorts-h264 |

## Architectural Patterns

- schema-first (Zod parse on entry)
- context DI (all side effects injected)
- sandbox validation (path traversal prevention)
- preflight input check (async, stat-based)
- postflight output assertion (async, stat-based)
- spec-driven fallback (premium → guaranteed)
- AbortSignal cancellation (7+ checkpoints)
- typed notifications (progress, warning, ready)
- buildAndNotifyAsset helper
- CRUD factory with lazy hydration
- output polish (auto-extension, metadata, expiry)
- closed-GOP locks (scenecut=0, keyint=60)
- dual thumbnail generation (16:9 + 4:5)
- ffprobe-based input probing

## Example

**SDR 1080p transcode**

```typescript
await transcodeForYouTube(
  { inputPath: "input.mp4", outputPath: "output.mp4", preset: "yt-1080p-h264" },
  { signal, userId, notify, createAsset, runFfmpeg, runProbe },
);
```

---

# Pandoc MCP

> Zero-flag document conversion: blog, academic PDF, ebook, slides, newsletter

**Version:** 1.7.0-toolshop  
**Pipeline:** `convertDocument`

## Presets

| Preset | Format | Extension | Tier | Fallback |
|--------|--------|-----------|------|----------|
| `blog-post` | html5 | `.html` | Guaranteed | — |
| `academic-pdf` | pdf | `.pdf` | Guaranteed | — |
| `ebook` | epub | `.epub` | Guaranteed | — |
| `slides` | revealjs | `.html` | Guaranteed | — |
| `newsletter` | html5 | `.html` | Premium | blog-post |

## Architectural Patterns

- schema-first (Zod parse on entry)
- context DI (all side effects injected)
- sandbox validation (path traversal prevention)
- preflight input check (async, stat-based)
- postflight output assertion (async, stat-based)
- spec-driven fallback (premium → guaranteed)
- AbortSignal cancellation (7+ checkpoints)
- typed notifications (progress, warning, ready)
- buildAndNotifyAsset helper
- CRUD factory with lazy hydration
- output polish (auto-extension, metadata, expiry)

## Example

**Convert markdown to academic PDF**

```typescript
await pandoc.convertDocument(
  { inputPath: "thesis.md", outputPath: "thesis.pdf", preset: "academic-pdf" },
  { signal, userId, notify, createAsset, runPandoc, checkInput, assertOutput, statFile },
);
```

---

# FreeCAD MCP

> Safe 3D CAD export: STL, STEP, GLB, 3MF, OBJ — headless, no user code

**Version:** 1.7.0-toolshop  
**Pipeline:** `exportPart`

## Presets

| Preset | Format | Extension | Tier | Fallback |
|--------|--------|-----------|------|----------|
| `stl-print-ready` | STL | `.stl` | Guaranteed | — |
| `step-precision` | STEP | `.step` | Guaranteed | — |
| `glb-web-ready` | GLB | `.glb` | Guaranteed | — |
| `3mf-slicer-ready` | 3MF | `.3mf` | Premium | stl-print-ready |
| `obj-mesh` | OBJ | `.obj` | Guaranteed | — |

## Architectural Patterns

- schema-first (Zod parse on entry)
- context DI (all side effects injected)
- sandbox validation (path traversal prevention)
- preflight input check (async, stat-based)
- postflight output assertion (async, stat-based)
- spec-driven fallback (premium → guaranteed)
- AbortSignal cancellation (7+ checkpoints)
- typed notifications (progress, warning, ready)
- buildAndNotifyAsset helper
- CRUD factory with lazy hydration
- output polish (auto-extension, metadata, expiry)
- safe Python one-liners via FreeCADCmd -c (no exec/eval)
- $INPUT/$OUTPUT placeholder substitution

## Example

**Export FreeCAD part to print-ready STL**

```typescript
await freecad.exportPart(
  { inputPath: "bracket.FCStd", outputPath: "bracket.stl", preset: "stl-print-ready" },
  { signal, userId, notify, createAsset, runFreeCAD, checkInput, assertOutput, statFile },
);
```

---

# GDAL MCP

> Geospatial transforms: reproject rasters, convert vectors, clip regions — the FFmpeg of GIS

**Version:** 1.7.0-toolshop  
**Pipeline:** `transformGeo`

## Presets

| Preset | Format | Extension | Tier | Fallback |
|--------|--------|-----------|------|----------|
| `raster-wgs84-tiff` | TIF | `.tif` | Guaranteed | — |
| `vector-geojson` | GEOJSON | `.geojson` | Guaranteed | — |
| `raster-to-png` | PNG | `.png` | Guaranteed | — |
| `vector-shapefile` | SHP | `.shp` | Guaranteed | — |
| `clip-raster` | TIF | `.tif` | Premium | raster-wgs84-tiff |

## Architectural Patterns

- schema-first (Zod parse on entry)
- context DI (all side effects injected)
- sandbox validation (path traversal prevention)
- preflight input check (async, stat-based)
- postflight output assertion (async, stat-based)
- spec-driven fallback (premium → guaranteed)
- AbortSignal cancellation (7+ checkpoints)
- typed notifications (progress, warning, ready)
- buildAndNotifyAsset helper
- CRUD factory with lazy hydration
- output polish (auto-extension, metadata, expiry)
- multi-binary dispatch (gdalwarp, ogr2ogr, gdal_translate)
- $INPUT/$OUTPUT/$BBOX template substitution
- format compatibility check (raster vs vector mismatch)

## Example

**Reproject raster to WGS84**

```typescript
await gdal.transformGeo(
  { inputPath: "terrain.tif", outputPath: "terrain_wgs84.tif", preset: "raster-wgs84-tiff" },
  { signal, userId, notify, createAsset, runGDAL, checkInput, assertOutput, statFile },
);
```

---

# OpenSCAD MCP

> Pure-text parametric CAD: STL, OBJ, 3MF, PNG preview, DXF — text in, mesh out

**Version:** 1.7.0-toolshop  
**Pipeline:** `renderModel`

## Presets

| Preset | Format | Extension | Tier | Fallback |
|--------|--------|-----------|------|----------|
| `stl-print-ready` | STL | `.stl` | Guaranteed | — |
| `obj-mesh` | OBJ | `.obj` | Guaranteed | — |
| `3mf-color` | 3MF | `.3mf` | Premium | stl-print-ready |
| `png-preview` | PNG | `.png` | Guaranteed | — |
| `dxf-2d` | DXF | `.dxf` | Guaranteed | — |

## Architectural Patterns

- schema-first (Zod parse on entry)
- context DI (all side effects injected)
- sandbox validation (path traversal prevention)
- preflight input check (async, stat-based)
- postflight output assertion (async, stat-based)
- spec-driven fallback (premium → guaranteed)
- AbortSignal cancellation (7+ checkpoints)
- typed notifications (progress, warning, ready)
- buildAndNotifyAsset helper
- CRUD factory with lazy hydration
- output polish (auto-extension, metadata, expiry)
- quality-to-$fn mapping (draft=16, standard=32, high=64)
- custom line-buffer progress parser (plain text stderr)
- dangerous construct detection (import, surface, include, use)
- user variables injection via -D key=value

## Example

**Render parametric cube to STL**

```typescript
await openscad.renderModel(
  { inputPath: "cube.scad", outputPath: "cube.stl", preset: "stl-print-ready", variables: { size: 20 } },
  { signal, userId, notify, createAsset, runOpenSCAD, checkInput, assertOutput, statFile },
);
```

---

# Blender MCP

> Headless 3D rendering: PNG preview, GLB export, video, STL mesh, Cycles — no GUI needed

**Version:** 1.7.0-toolshop  
**Pipeline:** `renderBlend`

## Presets

| Preset | Format | Extension | Tier | Fallback |
|--------|--------|-----------|------|----------|
| `png-preview` | PNG | `.png` | Guaranteed | — |
| `glb-export` | GLB | `.glb` | Guaranteed | — |
| `video-1080p` | MP4 | `.mp4` | Guaranteed | — |
| `stl-from-mesh` | STL | `.stl` | Guaranteed | — |
| `cycles-render` | PNG | `.png` | Premium | png-preview |

## Architectural Patterns

- schema-first (Zod parse on entry)
- context DI (all side effects injected)
- sandbox validation (path traversal prevention)
- preflight input check (async, stat-based)
- postflight output assertion (async, stat-based)
- spec-driven fallback (premium → guaranteed)
- AbortSignal cancellation (7+ checkpoints)
- typed notifications (progress, warning, ready)
- buildAndNotifyAsset helper
- CRUD factory with lazy hydration
- output polish (auto-extension, metadata, expiry)
- safe pre-baked Python one-liners for GLB/STL export (no user code)
- quality-to-samples mapping (draft=64, standard=256, high=1024)
- custom line-buffer progress parser (Fra:/Rendered/tiles keywords)
- 7 throwIfAborted checkpoints for responsive cancellation

## Example

**Render Blender scene to PNG preview**

```typescript
await blender.renderBlend(
  { inputPath: "scene.blend", outputPath: "render.png", preset: "png-preview" },
  { signal, userId, notify, createAsset, runBlender, checkInput, assertOutput, statFile },
);
```
