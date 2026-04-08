import type { ToolDefinition } from "./types.js";
import { SHARED_PATTERNS } from "./helpers.js";

// ── Tool definitions — single source of truth ────────────────────
//
// Every tool in ToolShopStudio is registered here with its schemas,
// presets, patterns, and examples. This is the one file to update
// when adding a new tool.
//
// Schema references are strings (not imports) to avoid circular
// deps and keep the registry zero-cost at runtime.

const VERSION = "1.7.0-toolshop";

// ── FFmpeg YouTube MCP ──────────────────────────────────────────

const ffmpeg: ToolDefinition = {
  id: "ffmpeg",
  name: "FFmpeg YouTube MCP",
  version: VERSION,
  description: "YouTube-safe presets (guaranteed + premium with fallback), closed-GOP locks, dual thumbnails",
  pipelineFn: "transcodeForYouTube",
  schemas: {
    request: "TranscodeForYouTubeSchema",
    asset: "YouTubeMediaAssetSchema",
    presetEnum: "PresetEnum",
  },
  presets: {
    "yt-1080p-h264": {
      description: "1080p H.264 — guaranteed YouTube-safe",
      isPremium: false,
      fallbackTo: null,
      outputExt: "mp4",
      outputFormat: "MP4",
    },
    "yt-1080p-h265": {
      description: "1080p H.265 — premium quality, falls back to H.264",
      isPremium: true,
      fallbackTo: "yt-1080p-h264",
      outputExt: "mp4",
      outputFormat: "MP4",
    },
    "yt-4k-h264": {
      description: "4K H.264 — guaranteed YouTube-safe",
      isPremium: false,
      fallbackTo: null,
      outputExt: "mp4",
      outputFormat: "MP4",
    },
    "yt-4k-h265": {
      description: "4K H.265 — premium quality, falls back to H.264",
      isPremium: true,
      fallbackTo: "yt-4k-h264",
      outputExt: "mp4",
      outputFormat: "MP4",
    },
    "yt-4k-hdr-h265": {
      description: "4K HDR H.265 — premium HDR, falls back to 4K H.265",
      isPremium: true,
      fallbackTo: "yt-4k-h265",
      outputExt: "mp4",
      outputFormat: "MP4",
    },
    "yt-shorts-h264": {
      description: "Shorts 1080x1920 H.264 — guaranteed YouTube-safe",
      isPremium: false,
      fallbackTo: null,
      outputExt: "mp4",
      outputFormat: "MP4",
    },
    "yt-shorts-h265": {
      description: "Shorts 1080x1920 H.265 — premium, falls back to H.264",
      isPremium: true,
      fallbackTo: "yt-shorts-h264",
      outputExt: "mp4",
      outputFormat: "MP4",
    },
  },
  commonPatterns: [
    ...SHARED_PATTERNS,
    "closed-GOP locks (scenecut=0, keyint=60)",
    "dual thumbnail generation (16:9 + 4:5)",
    "ffprobe-based input probing",
  ],
  examples: [
    {
      description: "SDR 1080p transcode",
      code: `await transcodeForYouTube(
  { inputPath: "input.mp4", outputPath: "output.mp4", preset: "yt-1080p-h264" },
  { signal, userId, notify, createAsset, runFfmpeg, runProbe },
);`,
    },
  ],
};

// ── Pandoc MCP ──────────────────────────────────────────────────

const pandoc: ToolDefinition = {
  id: "pandoc",
  name: "Pandoc MCP",
  version: VERSION,
  description: "Zero-flag document conversion: blog, academic PDF, ebook, slides, newsletter",
  pipelineFn: "convertDocument",
  schemas: {
    request: "ConvertDocumentSchema",
    asset: "PandocDocumentAssetSchema",
    presetEnum: "PandocPresetEnum",
  },
  presets: {
    "blog-post": {
      description: "Markdown → standalone HTML5 with embedded resources",
      isPremium: false,
      fallbackTo: null,
      outputExt: "html",
      outputFormat: "html5",
    },
    "academic-pdf": {
      description: "Markdown → PDF via XeLaTeX with citations, TOC, numbered sections",
      isPremium: false,
      fallbackTo: null,
      outputExt: "pdf",
      outputFormat: "pdf",
    },
    "ebook": {
      description: "Markdown → EPUB with TOC and chapter splitting",
      isPremium: false,
      fallbackTo: null,
      outputExt: "epub",
      outputFormat: "epub",
    },
    "slides": {
      description: "Markdown → Reveal.js HTML presentation",
      isPremium: false,
      fallbackTo: null,
      outputExt: "html",
      outputFormat: "revealjs",
    },
    "newsletter": {
      description: "Markdown → HTML5 newsletter (premium, falls back to blog-post)",
      isPremium: true,
      fallbackTo: "blog-post",
      outputExt: "html",
      outputFormat: "html5",
    },
  },
  commonPatterns: [...SHARED_PATTERNS],
  examples: [
    {
      description: "Convert markdown to academic PDF",
      code: `await pandoc.convertDocument(
  { inputPath: "thesis.md", outputPath: "thesis.pdf", preset: "academic-pdf" },
  { signal, userId, notify, createAsset, runPandoc, checkInput, assertOutput, statFile },
);`,
    },
  ],
};

// ── FreeCAD MCP ─────────────────────────────────────────────────

const freecad: ToolDefinition = {
  id: "freecad",
  name: "FreeCAD MCP",
  version: VERSION,
  description: "Safe 3D CAD export: STL, STEP, GLB, 3MF, OBJ — headless, no user code",
  pipelineFn: "exportPart",
  schemas: {
    request: "ExportPartSchema",
    asset: "FreeCADPartAssetSchema",
    presetEnum: "FreeCADPresetEnum",
  },
  presets: {
    "stl-print-ready": {
      description: "STL mesh export with mesh repair — 3D printing ready",
      isPremium: false,
      fallbackTo: null,
      outputExt: "stl",
      outputFormat: "STL",
    },
    "step-precision": {
      description: "STEP CAD exchange — precision=0.001 for manufacturing",
      isPremium: false,
      fallbackTo: null,
      outputExt: "step",
      outputFormat: "STEP",
    },
    "glb-web-ready": {
      description: "GLB binary glTF — optimized for web 3D viewers",
      isPremium: false,
      fallbackTo: null,
      outputExt: "glb",
      outputFormat: "GLB",
    },
    "3mf-slicer-ready": {
      description: "3MF with color data (premium, falls back to STL)",
      isPremium: true,
      fallbackTo: "stl-print-ready",
      outputExt: "3mf",
      outputFormat: "3MF",
    },
    "obj-mesh": {
      description: "OBJ mesh export — universal compatibility",
      isPremium: false,
      fallbackTo: null,
      outputExt: "obj",
      outputFormat: "OBJ",
    },
  },
  commonPatterns: [
    ...SHARED_PATTERNS,
    "safe Python one-liners via FreeCADCmd -c (no exec/eval)",
    "$INPUT/$OUTPUT placeholder substitution",
  ],
  examples: [
    {
      description: "Export FreeCAD part to print-ready STL",
      code: `await freecad.exportPart(
  { inputPath: "bracket.FCStd", outputPath: "bracket.stl", preset: "stl-print-ready" },
  { signal, userId, notify, createAsset, runFreeCAD, checkInput, assertOutput, statFile },
);`,
    },
  ],
};

// ── GDAL MCP ────────────────────────────────────────────────────

const gdal: ToolDefinition = {
  id: "gdal",
  name: "GDAL MCP",
  version: VERSION,
  description: "Geospatial transforms: reproject rasters, convert vectors, clip regions — the FFmpeg of GIS",
  pipelineFn: "transformGeo",
  schemas: {
    request: "TransformGeoSchema",
    asset: "GDALGeoDataAssetSchema",
    presetEnum: "GDALPresetEnum",
  },
  presets: {
    "raster-wgs84-tiff": {
      description: "Reproject raster to WGS84 GeoTIFF with LZW compression",
      isPremium: false,
      fallbackTo: null,
      outputExt: "tif",
      outputFormat: "TIF",
    },
    "vector-geojson": {
      description: "Convert vector data to GeoJSON",
      isPremium: false,
      fallbackTo: null,
      outputExt: "geojson",
      outputFormat: "GEOJSON",
    },
    "raster-to-png": {
      description: "Raster → PNG with auto-scaling for visualization",
      isPremium: false,
      fallbackTo: null,
      outputExt: "png",
      outputFormat: "PNG",
    },
    "vector-shapefile": {
      description: "Convert vector data to ESRI Shapefile",
      isPremium: false,
      fallbackTo: null,
      outputExt: "shp",
      outputFormat: "SHP",
    },
    "clip-raster": {
      description: "Clip raster to bounding box (premium, falls back to raster-wgs84-tiff)",
      isPremium: true,
      fallbackTo: "raster-wgs84-tiff",
      outputExt: "tif",
      outputFormat: "TIF",
    },
  },
  commonPatterns: [
    ...SHARED_PATTERNS,
    "multi-binary dispatch (gdalwarp, ogr2ogr, gdal_translate)",
    "$INPUT/$OUTPUT/$BBOX template substitution",
    "format compatibility check (raster vs vector mismatch)",
  ],
  examples: [
    {
      description: "Reproject raster to WGS84",
      code: `await gdal.transformGeo(
  { inputPath: "terrain.tif", outputPath: "terrain_wgs84.tif", preset: "raster-wgs84-tiff" },
  { signal, userId, notify, createAsset, runGDAL, checkInput, assertOutput, statFile },
);`,
    },
  ],
};

// ── OpenSCAD MCP ────────────────────────────────────────────────

const openscad: ToolDefinition = {
  id: "openscad",
  name: "OpenSCAD MCP",
  version: VERSION,
  description: "Pure-text parametric CAD: STL, OBJ, 3MF, PNG preview, DXF — text in, mesh out",
  pipelineFn: "renderModel",
  schemas: {
    request: "RenderModelSchema",
    asset: "OpenSCADModelAssetSchema",
    presetEnum: "OpenSCADPresetEnum",
  },
  presets: {
    "stl-print-ready": {
      description: "STL mesh from .scad source — 3D printing ready",
      isPremium: false,
      fallbackTo: null,
      outputExt: "stl",
      outputFormat: "STL",
    },
    "obj-mesh": {
      description: "OBJ mesh from .scad source — universal compatibility",
      isPremium: false,
      fallbackTo: null,
      outputExt: "obj",
      outputFormat: "OBJ",
    },
    "3mf-color": {
      description: "3MF with color from .scad (premium, falls back to STL)",
      isPremium: true,
      fallbackTo: "stl-print-ready",
      outputExt: "3mf",
      outputFormat: "3MF",
    },
    "png-preview": {
      description: "PNG preview render from .scad — quick visual check",
      isPremium: false,
      fallbackTo: null,
      outputExt: "png",
      outputFormat: "PNG",
    },
    "dxf-2d": {
      description: "DXF 2D projection from .scad — laser cutting / CNC",
      isPremium: false,
      fallbackTo: null,
      outputExt: "dxf",
      outputFormat: "DXF",
    },
  },
  commonPatterns: [
    ...SHARED_PATTERNS,
    "quality-to-$fn mapping (draft=16, standard=32, high=64)",
    "custom line-buffer progress parser (plain text stderr)",
    "dangerous construct detection (import, surface, include, use)",
    "user variables injection via -D key=value",
  ],
  examples: [
    {
      description: "Render parametric cube to STL",
      code: `await openscad.renderModel(
  { inputPath: "cube.scad", outputPath: "cube.stl", preset: "stl-print-ready", variables: { size: 20 } },
  { signal, userId, notify, createAsset, runOpenSCAD, checkInput, assertOutput, statFile },
);`,
    },
  ],
};

// ── Blender MCP ──────────────────────────────────────────────────

const blender: ToolDefinition = {
  id: "blender",
  name: "Blender MCP",
  version: VERSION,
  description: "Headless 3D rendering: PNG preview, GLB export, video, STL mesh, Cycles — no GUI needed",
  pipelineFn: "renderBlend",
  schemas: {
    request: "RenderBlendSchema",
    asset: "BlenderRenderAssetSchema",
    presetEnum: "BlenderPresetEnum",
  },
  presets: {
    "png-preview": {
      description: "Quick PNG render via EEVEE/Workbench — visual check",
      isPremium: false,
      fallbackTo: null,
      outputExt: "png",
      outputFormat: "PNG",
    },
    "glb-export": {
      description: "GLB binary glTF export via Python expr — web-ready 3D",
      isPremium: false,
      fallbackTo: null,
      outputExt: "glb",
      outputFormat: "GLB",
    },
    "video-1080p": {
      description: "1080p video render (animation frames → MP4)",
      isPremium: false,
      fallbackTo: null,
      outputExt: "mp4",
      outputFormat: "MP4",
    },
    "stl-from-mesh": {
      description: "STL mesh extraction via Python expr — 3D printing",
      isPremium: false,
      fallbackTo: null,
      outputExt: "stl",
      outputFormat: "STL",
    },
    "cycles-render": {
      description: "High-quality Cycles render (premium, falls back to png-preview)",
      isPremium: true,
      fallbackTo: "png-preview",
      outputExt: "png",
      outputFormat: "PNG",
    },
  },
  commonPatterns: [
    ...SHARED_PATTERNS,
    "safe pre-baked Python one-liners for GLB/STL export (no user code)",
    "quality-to-samples mapping (draft=64, standard=256, high=1024)",
    "custom line-buffer progress parser (Fra:/Rendered/tiles keywords)",
    "7 throwIfAborted checkpoints for responsive cancellation",
  ],
  examples: [
    {
      description: "Render Blender scene to PNG preview",
      code: `await blender.renderBlend(
  { inputPath: "scene.blend", outputPath: "render.png", preset: "png-preview" },
  { signal, userId, notify, createAsset, runBlender, checkInput, assertOutput, statFile },
);`,
    },
  ],
};

// ── Combined registry ───────────────────────────────────────────

/**
 * The complete ToolShopStudio tool registry.
 * Single source of truth for all six tools.
 */
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  ffmpeg,
  pandoc,
  freecad,
  gdal,
  openscad,
  blender,
} as const;

/** All registered tool IDs. */
export const TOOL_IDS = Object.keys(TOOL_REGISTRY) as readonly string[];
