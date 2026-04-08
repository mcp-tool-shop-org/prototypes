---
title: Architecture
description: Shared contract and design principles behind ToolShopStudio.
sidebar:
  order: 4
---

## Shared contract

All six tools share the same frozen surface:

- **Schema-first** — Zod schemas for every input/output, fully type-safe, zero raw CLI args
- **Context DI** — All side effects injected via context objects, 100% mockable
- **Sandbox isolation** — Path traversal prevention on every file operation
- **Observable** — Typed notifications (progress, warnings, ready) at every pipeline stage
- **Cancellation** — AbortController propagated to every pipeline checkpoint
- **Fallback** — Premium presets auto-degrade to guaranteed on failure or assertion mismatch

## Tool-specific design

### FFmpeg
Closed-GOP locks (`scenecut=0`, `keyint=60`) and dual thumbnail generation (16:9 landscape + 4:5 portrait) ensure YouTube compliance. `ffprobe`-based input probing detects interlaced content and estimates output file size before encoding begins.

### Pandoc
Zero-flag document conversion with format compatibility checks. The preset spec controls `--from`, `--to`, extra args (e.g., `--pdf-engine=xelatex`, `--citeproc`, `--toc`), and output extension correction. All presets inherit base args: `--verbose` for progress parsing and `--fail-if-warnings` for strict error handling.

### FreeCAD
Pre-baked Python one-liners executed via `FreeCADCmd -c` — no `exec()`, no `eval()`, no user code. `$INPUT` and `$OUTPUT` placeholders are substituted by the argument builder. Runs headless with `--headless --no-gui`.

### GDAL
Multi-binary dispatch: `gdalwarp`, `ogr2ogr`, or `gdal_translate` selected per preset via an argument template system. Templates use `$INPUT`, `$OUTPUT`, and `$BBOX` placeholders. Format compatibility checks prevent raster/vector mismatches.

### OpenSCAD
Text-first CAD: renders pure `.scad` text to mesh or image with no binary input. Quality maps to `$fn` fragment count (draft=16, standard=32, high=64 for curve smoothness). Dangerous constructs (`import`, `surface`, `include`, `use`) are detected during preflight. User variables are injected safely via `-D key=value` flags.

### Blender
Headless mode (`-b -noaudio`) with pre-baked Python expressions for GLB/STL export and Cycles rendering. Quality maps to render sample count (draft=64, standard=256, high=1024). Seven `throwIfAborted` checkpoints ensure responsive cancellation during long renders.

## Preset tiers

Each tool has guaranteed and premium presets:

- **Guaranteed** — Always works if the runtime binary is installed
- **Premium** — Uses advanced features; auto-falls back to a guaranteed preset on failure
