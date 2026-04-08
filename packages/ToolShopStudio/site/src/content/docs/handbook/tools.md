---
title: Tools
description: Overview of all six tools bundled in ToolShopStudio.
sidebar:
  order: 2
---

## FFmpeg YouTube MCP

YouTube-safe presets with guaranteed + premium tiers, closed-GOP locks, and dual thumbnails. All presets produce MP4 with AAC audio at 48 kHz stereo (192 kbps), `faststart` for streaming, and closed-GOP keyframes every 2 seconds.

| Preset | Codec | Resolution | CRF | Max Rate | Tier |
|--------|-------|-----------|-----|----------|------|
| `yt-1080p-h264` | libx264 | 1920x1080 | 18 | 12M | Guaranteed |
| `yt-1080p-h265` | libx265 | 1920x1080 | 20 | 8M | Premium |
| `yt-4k-h264` | libx264 | 3840x2160 | 18 | 40M | Guaranteed |
| `yt-4k-h265` | libx265 | 3840x2160 | 20 | 25M | Premium |
| `yt-4k-hdr-h265` | libx265 | 3840x2160 | 18 | 40M | Premium (HDR) |
| `yt-shorts-h264` | libx264 | 1080x1920 | 18 | 12M | Guaranteed |
| `yt-shorts-h265` | libx265 | 1080x1920 | 20 | 8M | Premium |

## Pandoc MCP

Zero-flag document conversion with five presets. All presets convert from Markdown. Optional fields include `templatePath`, `bibliographyPath`, and `cssPath` for custom styling.

| Preset | To Format | Extra Flags | Tier |
|--------|-----------|-------------|------|
| `blog-post` | HTML5 | `--standalone --embed-resources` | Guaranteed |
| `academic-pdf` | PDF | `--pdf-engine=xelatex --citeproc --toc --number-sections` | Guaranteed |
| `ebook` | EPUB | `--toc --toc-depth=2 --epub-chapter-level=2` | Guaranteed |
| `slides` | Reveal.js | `--standalone --slide-level=2` | Guaranteed |
| `newsletter` | HTML5 | `--standalone --embed-resources` | Premium |

## FreeCAD MCP

Safe 3D CAD export — headless (`--headless --no-gui`), no user code. Uses pre-baked Python one-liners via `FreeCADCmd -c` with `$INPUT`/`$OUTPUT` placeholder substitution.

| Preset | Format | Quality Flag | Tier |
|--------|--------|-------------|------|
| `stl-print-ready` | STL | `--mesh-repair` | Guaranteed |
| `step-precision` | STEP | `--precision=0.001` | Guaranteed |
| `glb-web-ready` | GLB | `--optimize` | Guaranteed |
| `3mf-slicer-ready` | 3MF | `--color` | Premium |
| `obj-mesh` | OBJ | -- | Guaranteed |

## GDAL MCP

Geospatial transforms — the FFmpeg of GIS. Multi-binary dispatch selects `gdalwarp`, `ogr2ogr`, or `gdal_translate` per preset. Argument templates use `$INPUT`, `$OUTPUT`, and `$BBOX` placeholders.

| Preset | Binary | Output | Flags | Tier |
|--------|--------|--------|-------|------|
| `raster-wgs84-tiff` | gdalwarp | GeoTIFF | `-t_srs EPSG:4326 -co COMPRESS=LZW` | Guaranteed |
| `vector-geojson` | ogr2ogr | GeoJSON | `-f GeoJSON` | Guaranteed |
| `raster-to-png` | gdal_translate | PNG | `-of PNG -scale` | Guaranteed |
| `vector-shapefile` | ogr2ogr | Shapefile | `-f "ESRI Shapefile"` | Guaranteed |
| `clip-raster` | gdalwarp | GeoTIFF | `-te <bbox> -co COMPRESS=LZW` | Premium |

## OpenSCAD MCP

Pure-text parametric CAD — text in, mesh out. Quality controls the `$fn` fragment count for curve smoothness: draft=16, standard=32, high=64. User variables are injected via `-D key=value` flags.

| Preset | Format | $fn (draft/std/high) | Tier |
|--------|--------|---------------------|------|
| `stl-print-ready` | STL | 16 / 32 / 64 | Guaranteed |
| `obj-mesh` | OBJ | 16 / 32 / 64 | Guaranteed |
| `3mf-color` | 3MF | 16 / 32 / 64 | Premium |
| `png-preview` | PNG | 16 / 32 / 64 | Guaranteed |
| `dxf-2d` | DXF | 16 / 32 / 64 | Guaranteed |

## Blender MCP

Headless 3D rendering — no GUI needed. Runs with `-b -noaudio`. Quality controls render sample count: draft=64, standard=256, high=1024. GLB and STL export use safe pre-baked Python expressions.

| Preset | Engine | Output | Samples (draft/std/high) | Tier |
|--------|--------|--------|------------------------|------|
| `png-preview` | Workbench | PNG | 64 / 256 / 1024 | Guaranteed |
| `glb-export` | Python expr | GLB | -- | Guaranteed |
| `video-1080p` | Default | MP4 (1920x1080) | 64 / 256 / 1024 | Guaranteed |
| `stl-from-mesh` | Python expr | STL | -- | Guaranteed |
| `cycles-render` | Cycles | PNG | 64 / 256 / 1024 | Premium |
