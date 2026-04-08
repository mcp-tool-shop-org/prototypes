# Changelog

All notable changes to this project will be documented in this file.

## [1.7.0-toolshop] - 2026-02-19

### Added
- **Blender MCP**: headless 3D rendering tool (5 presets: png-preview, glb-export, video-1080p, stl-from-mesh, cycles-render)
- Blender safe execution: pre-baked Python one-liners for GLB/STL export (no user code)
- Blender two-tier encoding: premium Cycles render with automatic fallback to Workbench png-preview
- Blender schema-first design: Zod schemas for RenderBlend, BlenderRenderAsset, quality tiers
- buildBlenderArgs pure function (base → input → engine → scene → frames → quality → output → pythonExpr)
- Blender custom line-buffer progress parser (Fra:/Rendered/tiles keywords + step-counting)
- Blender pre/post-flight assertions (input validation, dangerous construct detection, render output checks)
- Blender context DI pattern (RenderBlendContext) with 7 throwIfAborted checkpoints
- BlenderRenderCRUD with lazy hydration + optional JSON persistence
- Blender output polish (auto-extension, typed output metadata, configurable expiry)
- Docker image now includes blender for headless 3D rendering
- Registry now includes Blender (6 tools, 32 presets, 9 premium, 23 guaranteed)
- Six-tool smoke test (FFmpeg + Pandoc + FreeCAD + GDAL + OpenSCAD + Blender, 15 end-to-end tests)
- 318 unit/integration tests (13 FFmpeg + 29 Pandoc + 33 FreeCAD + 39 GDAL + 75 OpenSCAD + 81 Blender + 48 Registry)
- Generated docs updated (8 files — adds docs/tools/blender.md)

### Changed
- Total test count: 237 → 318 (81 Blender tests)
- Smoke tests: 13 → 15 (Blender png-preview + glb-export)
- README updated with Blender preset table, Quick Start example, architecture bullet
- Dockerfile relabeled for v1.7.0-toolshop with six runtime binaries
- CI labels updated for all six tools + registry
- Registry version: 1.5.0-toolshop → 1.7.0-toolshop

---

## [1.5.0-toolshop] - 2026-02-19

### Added
- **Live Registry**: self-documenting, validated, MCP-ready registry as first-class citizen
- Registry Phase 1: type-safe `ToolDefinition` schema, `TOOL_REGISTRY` with all 5 tools, 11 `SHARED_PATTERNS`, search/introspection functions
- Registry Phase 2: `validateRegistry()` engine with Zod refinements (preset existence, fallback integrity, shared pattern coverage), enriched search (`searchAllByPreset`, `searchByOutputExt`, `getPremiumPresetMap`, `getToolsByPattern`), consistency checks
- Registry Phase 3: `loadRegistry()` validated singleton, MCP introspection tools (`listTools`, `getToolInfo`, `searchPresets`), CLI (`toolshop registry list|show|summary|json|docs`), auto-docs generator (pure markdown)
- Registry Phase 4: MCP resources (`getRegistryResource`, `getToolResource`), `generateAllToolDocs()` build step, unified `allRegistryMcpTools` table (5 MCP tools), `json` and `docs` CLI subcommands
- 7 auto-generated markdown docs committed (5 per-tool + registry.md + presets.md)
- `npm run docs:generate` script for regenerating docs
- `npm run toolshop registry` CLI with 5 subcommands
- CI now validates registry JSON + generates docs on every push
- 48 new registry tests (8 golden + 15 engine + 16 runtime + 9 integration)
- Smoke test 13: registry validation + listTools + getRegistryResource

### Changed
- Total test count: 189 → 237 (48 registry tests)
- Smoke tests: 12 → 13 (registry smoke block)
- README updated with registry table, CLI docs, generated docs section, architecture bullet
- Dockerfile relabeled for v1.5.0-toolshop with registry description
- CI job name reflects registry presence
- package.json description highlights live Registry

---

## [1.4.0-toolshop] - 2026-02-19

### Added
- **OpenSCAD MCP**: pure-text parametric CAD tool (5 presets: stl-print-ready, obj-mesh, 3mf-color, png-preview, dxf-2d)
- OpenSCAD quality-to-$fn mapping: draft=16, standard=32, high=64 (injected via `-D $fn=N`)
- OpenSCAD two-tier encoding: premium 3mf-color with automatic fallback to stl-print-ready
- OpenSCAD schema-first design: Zod schemas for RenderModel, OpenSCADModelAsset, quality tiers
- buildOpenSCADArgs pure function (single-binary, `-o output`, `-D $fn=N`, variables, input last)
- OpenSCAD custom line-buffer progress parser (plain text stderr, not key=value)
- OpenSCAD dangerous construct detection (import, surface, include, use directives)
- OpenSCAD pre/post-flight assertions (input validation, suspicious expansion detection)
- OpenSCAD context DI pattern (RenderModelContext) matching GDAL/FreeCAD/Pandoc/FFmpeg
- OpenSCADModelCRUD with lazy hydration + optional JSON persistence
- OpenSCAD output polish (auto-extension, typed output metadata, configurable expiry)
- Docker image now includes openscad for parametric CAD rendering
- Quint-tool smoke test (FFmpeg + Pandoc + FreeCAD + GDAL + OpenSCAD, 12 end-to-end tests)
- 189 unit/integration tests (13 FFmpeg + 29 Pandoc + 33 FreeCAD + 39 GDAL + 75 OpenSCAD)

### Changed
- README refreshed for quint-tool showcase with OpenSCAD preset table
- Docker image relabeled for v1.4.0-toolshop with five runtime binaries
- CI labels updated for all five tools

---

## [1.3.0-toolshop] - 2026-02-19

### Added
- **GDAL MCP**: full geospatial transform tool (5 presets: raster-wgs84-tiff, vector-geojson, raster-to-png, vector-shapefile, clip-raster)
- GDAL multi-binary dispatch: gdalwarp, ogr2ogr, gdal_translate selected per preset
- GDAL two-tier encoding: premium clip-raster with automatic fallback to raster-wgs84-tiff
- GDAL schema-first design: Zod schemas for TransformGeo, GDALGeoDataAsset, quality tiers
- buildGDALArgs pure function (deterministic $INPUT/$OUTPUT/$BBOX substitution)
- GDAL dual-mode progress parser (direct percent + step-counting fallback)
- GDAL pre/post-flight assertions (input validation, format compatibility, suspicious expansion detection)
- GDAL context DI pattern (TransformGeoContext) matching FreeCAD/Pandoc/FFmpeg
- GDALGeoDataCRUD with lazy hydration + optional JSON persistence
- GDAL output polish (auto-extension, typed output metadata, configurable expiry)
- Docker image now includes gdal-bin for geospatial transforms
- Quad-tool smoke test (FFmpeg + Pandoc + FreeCAD + GDAL, 10 end-to-end tests)
- 114 unit/integration tests (13 FFmpeg + 29 Pandoc + 33 FreeCAD + 39 GDAL)

### Changed
- Multilingual README: EN + 7 translations (JA, ZH, ES, FR, HI, IT, PT-BR)
- Docker image relabeled for v1.3.0-toolshop
- CI labels updated for all four tools

---

## [1.2.0-toolshop] - 2026-02-19

### Added
- **FreeCAD MCP**: full 3D CAD export tool (5 presets: stl-print-ready, step-precision, glb-web-ready, 3mf-slicer-ready, obj-mesh)
- FreeCAD safe execution: pre-baked Python one-liners via FreeCADCmd -c (no exec/eval/user code)
- FreeCAD two-tier encoding: premium 3MF with automatic fallback to STL
- FreeCAD schema-first design: Zod schemas for ExportPart, FreeCADPartAsset, quality tiers
- buildFreeCADArgs pure function (deterministic $INPUT/$OUTPUT substitution)
- FreeCAD progress parser reusing root line-buffer infrastructure
- FreeCAD pre/post-flight assertions (input validation, mesh degenerate detection, format compatibility)
- FreeCAD context DI pattern (ExportPartContext) matching Pandoc/FFmpeg
- FreeCADPartCRUD with lazy hydration + optional JSON persistence
- FreeCAD output polish (auto-extension, typed output metadata, configurable expiry)
- Docker image now includes freecad-cmd for headless CAD export
- Triple-tool smoke test (FFmpeg + Pandoc + FreeCAD, 8 end-to-end tests)
- 75 unit/integration tests (13 FFmpeg + 29 Pandoc + 33 FreeCAD)

### Changed
- README refreshed for triple-tool story with FreeCAD preset table
- Docker image relabeled for v1.2.0-toolshop
- CI labels updated for all three tools

---

## [1.1.0-toolshop] - 2026-02-19

### Added
- **Pandoc MCP**: full document conversion tool (5 presets: blog-post, academic-pdf, ebook, slides, newsletter)
- Pandoc two-tier encoding: premium newsletter with automatic fallback to blog-post
- Pandoc schema-first design: Zod schemas for ConvertDocument, PandocDocumentAsset, metadata
- Pandoc buildPandocArgs pure function (deterministic, zero raw flags)
- Pandoc progress parser reusing FFmpeg line-buffer infrastructure
- Pandoc pre/post-flight assertions (input validation, output extension/size checks)
- Pandoc context DI pattern (ConvertDocumentContext) matching FFmpeg's TranscodeContext
- PandocDocumentCRUD with lazy hydration + optional JSON persistence
- Output polish helpers (auto-extension, typed metadata, configurable expiry)
- Unified Docker image with both ffmpeg and pandoc binaries + non-root user
- GitHub Actions CI (paths-gated, single workflow, typecheck + test + build + smoke)
- Dual-tool smoke test (FFmpeg + Pandoc end-to-end)
- 42 unit/integration tests (13 FFmpeg + 29 Pandoc)

### Changed
- README refreshed for dual-tool story with both preset tables
- Docker image relabeled for v1.1.0-toolshop
- Release script updated with npm publish step

---

## [1.0.0-yt-safe] - 2026-02-19

### Added
- Full YouTube 2026 preset layer (7 presets: guaranteed + premium with fallback)
- Two-tier encoding: premium H.265 with automatic fallback to guaranteed H.264
- Closed-GOP locks on all presets (scenecut=0, keyint=60)
- Dual thumbnail generation (16:9 landscape + 4:5 portrait) with style controls
- Robust line-buffered ffmpeg progress parser with percent tracking
- AbortController cancellation propagated to all pipeline stages
- Pre-flight checks: interlace detection, output size estimation
- Post-flight assertions: container, codec, profile, pix_fmt, audio spec validation
- Zod schemas for all inputs/outputs (type-safe end-to-end)
- In-memory CRUD with optional JSON file persistence
- Context DI pattern for full testability (13 unit tests + smoke)
- Multi-stage Docker image with OCI labels
- Logo integrated
