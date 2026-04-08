#!/usr/bin/env node

/**
 * Smoke test: runs the full pipeline with mocked ffmpeg/ffprobe.
 * No real binaries needed — validates the wiring end-to-end.
 *
 * Usage: node smoke.mjs
 */

import { existsSync } from "node:fs";
import {
  transcodeForYouTube,
  createInMemoryCRUD,
  generateYouTubeThumbnail,
  pandoc,
  freecad,
  gdal,
  openscad,
  blender,
} from "./dist/index.js";

const MOCK_PROBE = {
  streams: [
    {
      codec_name: "h264",
      codec_type: "video",
      width: 1920,
      height: 1080,
      pix_fmt: "yuv420p",
      field_order: "progressive",
      profile: "High",
    },
    {
      codec_name: "aac",
      codec_type: "audio",
      channels: 2,
      sample_rate: "48000",
    },
  ],
  format: {
    filename: "/data/sandbox/smoke/input.mp4",
    format_name: "mov,mp4,m4a,3gp,3g2,mj2",
    duration: "15.0",
    size: "5000000",
    bit_rate: "2666666",
  },
};

async function main() {
  console.log("=== ToolShopStudio Smoke Test ===\n");

  const crud = createInMemoryCRUD();
  const notifications = [];
  const ac = new AbortController();

  // ── Test 1: SDR 1080p transcode ──────────────────────────────
  console.log("[1] SDR 1080p transcode...");
  const asset = await transcodeForYouTube(
    {
      inputPath: "/data/sandbox/smoke/input.mp4",
      outputPath: "/data/sandbox/smoke/output.mp4",
      preset: "yt-1080p-h264",
      allowFallback: true,
      timeoutSeconds: 60,
    },
    {
      signal: ac.signal,
      userId: "smoke",
      notify: (n) => notifications.push(n),
      createAsset: (a) => crud.create(a),
      runFfmpeg: async (_flags, _signal, onProgress) => {
        onProgress(25);
        onProgress(50);
        onProgress(75);
        onProgress(100);
      },
      runProbe: async () => MOCK_PROBE,
    },
  );

  console.log(`  Asset ID: ${asset.id}`);
  console.log(`  Warnings: ${asset.warnings.length}`);
  console.log(`  Notifications: ${notifications.length}`);

  // Verify CRUD
  const stored = await crud.read(asset.id);
  if (!stored) throw new Error("CRUD read failed");
  console.log("  CRUD read: OK");

  const listed = await crud.list();
  if (listed.length !== 1) throw new Error("CRUD list failed");
  console.log("  CRUD list: OK");

  // ── Test 2: Shorts preset ──────────────────────────────────
  console.log("\n[2] Shorts H264 transcode...");
  const shortsAsset = await transcodeForYouTube(
    {
      inputPath: "/data/sandbox/smoke/short.mp4",
      outputPath: "/data/sandbox/smoke/short_out.mp4",
      preset: "yt-shorts-h264",
    },
    {
      signal: ac.signal,
      userId: "smoke",
      notify: () => {},
      createAsset: (a) => crud.create(a),
      runFfmpeg: async (_flags, _signal, onProgress) => {
        onProgress(100);
      },
      runProbe: async () => MOCK_PROBE,
    },
  );
  console.log(`  Asset ID: ${shortsAsset.id}`);
  console.log("  OK");

  // ── Test 3: Verify ready notification shape ──────────────────
  console.log("\n[3] Verify notification shape...");
  const ready = notifications.find((n) => n.type === "youtube:ready");
  if (!ready) throw new Error("No youtube:ready notification");
  if (ready.type !== "youtube:ready") throw new Error("Wrong type");
  if (!ready.assetId) throw new Error("Missing assetId");
  if (!ready.outputPath) throw new Error("Missing outputPath");
  console.log("  youtube:ready shape: OK");

  // ── Test 4: Verify logo asset exists ────────────────────────
  console.log("\n[4] Verify logo asset...");
  if (!existsSync("assets/logo.png")) throw new Error("assets/logo.png missing");
  console.log("  assets/logo.png: OK");

  // ── Test 5: Pandoc blog-post conversion ──────────────────────
  console.log("\n[5] Pandoc blog-post conversion...");
  const pandocCrud = pandoc.createPandocCRUD();
  const pandocNotifications = [];

  const pandocAsset = await pandoc.convertDocument(
    {
      inputPath: "/data/sandbox/smoke/doc.md",
      outputPath: "/data/sandbox/smoke/doc.html",
      preset: "blog-post",
    },
    {
      signal: ac.signal,
      userId: "smoke",
      notify: (n) => pandocNotifications.push(n),
      createAsset: (a) => pandocCrud.create(a),
      runPandoc: async (_args, _signal, onProgress) => {
        onProgress(25);
        onProgress(50);
        onProgress(99);
      },
      checkInput: async () => ({
        ok: true,
        warnings: [],
        sizeBytes: 2048,
        detectedFormat: "markdown",
      }),
      assertOutput: async () => ({ ok: true, warnings: [] }),
      statFile: async () => ({ size: 4096 }),
    },
  );

  console.log(`  Asset ID: ${pandocAsset.id}`);
  console.log(`  Preset: ${pandocAsset.preset}`);
  console.log(`  Output format: ${pandocAsset.outputMetadata.format}`);
  console.log(`  Output size: ${pandocAsset.outputMetadata.sizeBytes}`);

  // Verify Pandoc CRUD
  const pandocStored = await pandocCrud.read(pandocAsset.id);
  if (!pandocStored) throw new Error("Pandoc CRUD read failed");
  console.log("  Pandoc CRUD read: OK");

  // Verify Pandoc ready notification
  const pandocReady = pandocNotifications.find((n) => n.type === "pandoc:ready");
  if (!pandocReady) throw new Error("No pandoc:ready notification");
  if (!pandocReady.assetId) throw new Error("Missing pandoc assetId");
  console.log("  pandoc:ready shape: OK");

  // ── Test 6: Pandoc academic-pdf conversion ─────────────────
  console.log("\n[6] Pandoc academic-pdf conversion...");
  const pdfAsset = await pandoc.convertDocument(
    {
      inputPath: "/data/sandbox/smoke/thesis.md",
      outputPath: "/data/sandbox/smoke/thesis.pdf",
      preset: "academic-pdf",
    },
    {
      signal: ac.signal,
      userId: "smoke",
      notify: () => {},
      createAsset: (a) => pandocCrud.create(a),
      runPandoc: async (_args, _signal, onProgress) => {
        onProgress(99);
      },
      checkInput: async () => ({
        ok: true,
        warnings: [],
        sizeBytes: 10240,
        detectedFormat: "markdown",
      }),
      assertOutput: async () => ({ ok: true, warnings: [] }),
      statFile: async () => ({ size: 8192 }),
    },
  );
  console.log(`  Asset ID: ${pdfAsset.id}`);
  console.log(`  Output format: ${pdfAsset.outputMetadata.format}`);
  console.log("  OK");

  // Verify both Pandoc assets in CRUD
  const allPandocAssets = await pandocCrud.list();
  if (allPandocAssets.length !== 2) throw new Error(`Expected 2 Pandoc assets, got ${allPandocAssets.length}`);
  console.log("  Pandoc CRUD list (2 assets): OK");

  // ── Test 7: FreeCAD stl-print-ready export ──────────────────
  console.log("\n[7] FreeCAD stl-print-ready export...");
  const freecadCrud = freecad.createFreeCADCRUD();
  const freecadNotifications = [];

  const freecadAsset = await freecad.exportPart(
    {
      inputPath: "/data/sandbox/smoke/part.FCStd",
      outputPath: "/data/sandbox/smoke/part.stl",
      preset: "stl-print-ready",
    },
    {
      signal: ac.signal,
      userId: "smoke",
      notify: (n) => freecadNotifications.push(n),
      createAsset: (a) => freecadCrud.create(a),
      runFreeCAD: async (_args, _signal, onProgress) => {
        onProgress(25);
        onProgress(50);
        onProgress(99);
      },
      checkInput: async () => ({
        ok: true,
        warnings: [],
        sizeBytes: 50000,
      }),
      assertOutput: async () => ({ ok: true, warnings: [] }),
      statFile: async () => ({ size: 75000 }),
    },
  );

  console.log(`  Asset ID: ${freecadAsset.id}`);
  console.log(`  Preset: ${freecadAsset.preset}`);
  console.log(`  Output format: ${freecadAsset.outputProbe.format}`);
  console.log(`  Output size: ${freecadAsset.outputProbe.sizeBytes}`);

  // Verify FreeCAD CRUD
  const freecadStored = await freecadCrud.read(freecadAsset.id);
  if (!freecadStored) throw new Error("FreeCAD CRUD read failed");
  console.log("  FreeCAD CRUD read: OK");

  // Verify FreeCAD ready notification
  const freecadReady = freecadNotifications.find((n) => n.type === "freecad:ready");
  if (!freecadReady) throw new Error("No freecad:ready notification");
  if (!freecadReady.assetId) throw new Error("Missing freecad assetId");
  console.log("  freecad:ready shape: OK");

  // ── Test 8: FreeCAD step-precision export ─────────────────
  console.log("\n[8] FreeCAD step-precision export...");
  const stepAsset = await freecad.exportPart(
    {
      inputPath: "/data/sandbox/smoke/gear.FCStd",
      outputPath: "/data/sandbox/smoke/gear.step",
      preset: "step-precision",
    },
    {
      signal: ac.signal,
      userId: "smoke",
      notify: () => {},
      createAsset: (a) => freecadCrud.create(a),
      runFreeCAD: async (_args, _signal, onProgress) => {
        onProgress(99);
      },
      checkInput: async () => ({
        ok: true,
        warnings: [],
        sizeBytes: 80000,
      }),
      assertOutput: async () => ({ ok: true, warnings: [] }),
      statFile: async () => ({ size: 72000 }),
    },
  );
  console.log(`  Asset ID: ${stepAsset.id}`);
  console.log(`  Output format: ${stepAsset.outputProbe.format}`);
  console.log("  OK");

  // Verify both FreeCAD assets in CRUD
  const allFreeCADAssets = await freecadCrud.list();
  if (allFreeCADAssets.length !== 2) throw new Error(`Expected 2 FreeCAD assets, got ${allFreeCADAssets.length}`);
  console.log("  FreeCAD CRUD list (2 assets): OK");

  // ── Test 9: GDAL raster-wgs84-tiff transform ──────────────────
  console.log("\n[9] GDAL raster-wgs84-tiff transform...");
  const gdalCrud = gdal.createGDALCRUD();
  const gdalNotifications = [];

  const gdalAsset = await gdal.transformGeo(
    {
      inputPath: "/data/sandbox/smoke/terrain.tif",
      outputPath: "/data/sandbox/smoke/terrain_wgs84.tif",
      preset: "raster-wgs84-tiff",
    },
    {
      signal: ac.signal,
      userId: "smoke",
      notify: (n) => gdalNotifications.push(n),
      createAsset: (a) => gdalCrud.create(a),
      runGDAL: async (_cmd, _signal, onProgress) => {
        onProgress(25);
        onProgress(50);
        onProgress(99);
      },
      checkInput: async () => ({
        ok: true,
        warnings: [],
        sizeBytes: 100000,
      }),
      assertOutput: async () => ({ ok: true, warnings: [] }),
      statFile: async () => ({ size: 140000 }),
    },
  );

  console.log(`  Asset ID: ${gdalAsset.id}`);
  console.log(`  Preset: ${gdalAsset.preset}`);
  console.log(`  Output format: ${gdalAsset.outputProbe.format}`);
  console.log(`  Output size: ${gdalAsset.outputProbe.sizeBytes}`);

  // Verify GDAL CRUD
  const gdalStored = await gdalCrud.read(gdalAsset.id);
  if (!gdalStored) throw new Error("GDAL CRUD read failed");
  console.log("  GDAL CRUD read: OK");

  // Verify GDAL ready notification
  const gdalReady = gdalNotifications.find((n) => n.type === "gdal:ready");
  if (!gdalReady) throw new Error("No gdal:ready notification");
  if (!gdalReady.assetId) throw new Error("Missing gdal assetId");
  console.log("  gdal:ready shape: OK");

  // ── Test 10: GDAL vector-geojson transform ────────────────────
  console.log("\n[10] GDAL vector-geojson transform...");
  const geojsonAsset = await gdal.transformGeo(
    {
      inputPath: "/data/sandbox/smoke/roads.shp",
      outputPath: "/data/sandbox/smoke/roads.geojson",
      preset: "vector-geojson",
    },
    {
      signal: ac.signal,
      userId: "smoke",
      notify: () => {},
      createAsset: (a) => gdalCrud.create(a),
      runGDAL: async (_cmd, _signal, onProgress) => {
        onProgress(99);
      },
      checkInput: async () => ({
        ok: true,
        warnings: [],
        sizeBytes: 50000,
      }),
      assertOutput: async () => ({ ok: true, warnings: [] }),
      statFile: async () => ({ size: 60000 }),
    },
  );
  console.log(`  Asset ID: ${geojsonAsset.id}`);
  console.log(`  Output format: ${geojsonAsset.outputProbe.format}`);
  console.log("  OK");

  // Verify both GDAL assets in CRUD
  const allGDALAssets = await gdalCrud.list();
  if (allGDALAssets.length !== 2) throw new Error(`Expected 2 GDAL assets, got ${allGDALAssets.length}`);
  console.log("  GDAL CRUD list (2 assets): OK");

  // ── Test 11: OpenSCAD stl-print-ready render ──────────────────
  console.log("\n[11] OpenSCAD stl-print-ready render...");
  const openscadCrud = openscad.createOpenSCADCRUD();
  const openscadNotifications = [];

  const openscadAsset = await openscad.renderModel(
    {
      inputPath: "/data/sandbox/smoke/cube.scad",
      outputPath: "/data/sandbox/smoke/cube.stl",
      preset: "stl-print-ready",
    },
    {
      signal: ac.signal,
      userId: "smoke",
      notify: (n) => openscadNotifications.push(n),
      createAsset: (a) => openscadCrud.create(a),
      runOpenSCAD: async (_cmd, _signal, onProgress) => {
        onProgress(25);
        onProgress(50);
        onProgress(99);
      },
      checkInput: async () => ({
        ok: true,
        warnings: [],
        sizeBytes: 1024,
        lines: 25,
      }),
      assertOutput: async () => ({ ok: true, warnings: [] }),
      statFile: async () => ({ size: 8192 }),
    },
  );

  console.log(`  Asset ID: ${openscadAsset.id}`);
  console.log(`  Preset: ${openscadAsset.preset}`);
  console.log(`  Output format: ${openscadAsset.outputProbe.format}`);
  console.log(`  Output size: ${openscadAsset.outputProbe.sizeBytes}`);

  // Verify OpenSCAD CRUD
  const openscadStored = await openscadCrud.read(openscadAsset.id);
  if (!openscadStored) throw new Error("OpenSCAD CRUD read failed");
  console.log("  OpenSCAD CRUD read: OK");

  // Verify OpenSCAD ready notification
  const openscadReady = openscadNotifications.find((n) => n.type === "openscad:ready");
  if (!openscadReady) throw new Error("No openscad:ready notification");
  if (!openscadReady.assetId) throw new Error("Missing openscad assetId");
  console.log("  openscad:ready shape: OK");

  // ── Test 12: OpenSCAD png-preview render ────────────────────
  console.log("\n[12] OpenSCAD png-preview render...");
  const pngAsset2 = await openscad.renderModel(
    {
      inputPath: "/data/sandbox/smoke/vase.scad",
      outputPath: "/data/sandbox/smoke/vase.png",
      preset: "png-preview",
      quality: "draft",
      variables: { height: 50, radius: 10 },
    },
    {
      signal: ac.signal,
      userId: "smoke",
      notify: () => {},
      createAsset: (a) => openscadCrud.create(a),
      runOpenSCAD: async (_cmd, _signal, onProgress) => {
        onProgress(99);
      },
      checkInput: async () => ({
        ok: true,
        warnings: [],
        sizeBytes: 512,
        lines: 15,
      }),
      assertOutput: async () => ({ ok: true, warnings: [] }),
      statFile: async () => ({ size: 4096 }),
    },
  );
  console.log(`  Asset ID: ${pngAsset2.id}`);
  console.log(`  Output format: ${pngAsset2.outputProbe.format}`);
  console.log(`  Quality: ${pngAsset2.quality}`);
  console.log(`  Variables: ${JSON.stringify(pngAsset2.variables)}`);
  console.log("  OK");

  // Verify both OpenSCAD assets in CRUD
  const allOpenSCADAssets = await openscadCrud.list();
  if (allOpenSCADAssets.length !== 2) throw new Error(`Expected 2 OpenSCAD assets, got ${allOpenSCADAssets.length}`);
  console.log("  OpenSCAD CRUD list (2 assets): OK");

  // ── Test 13: Blender png-preview render ──────────────────────
  console.log("\n[13] Blender png-preview render...");
  const blenderCrud = blender.createBlenderCRUD();
  const blenderNotifications = [];

  const blenderAsset = await blender.renderBlend(
    {
      inputPath: "/data/sandbox/smoke/scene.blend",
      outputPath: "/data/sandbox/smoke/scene.png",
      preset: "png-preview",
    },
    {
      signal: ac.signal,
      userId: "smoke",
      notify: (n) => blenderNotifications.push(n),
      createAsset: (a) => blenderCrud.create(a),
      runBlender: async (_cmd, _signal, onProgress) => {
        onProgress(25);
        onProgress(50);
        onProgress(99);
      },
      checkInput: async () => ({
        ok: true,
        warnings: [],
        sizeBytes: 4096,
      }),
      assertOutput: async () => ({ ok: true, warnings: [] }),
      statFile: async () => ({ size: 32768 }),
    },
  );

  console.log(`  Asset ID: ${blenderAsset.id}`);
  console.log(`  Preset: ${blenderAsset.preset}`);
  console.log(`  Output format: ${blenderAsset.outputProbe.format}`);
  console.log(`  Output size: ${blenderAsset.outputProbe.sizeBytes}`);

  // Verify Blender CRUD
  const blenderStored = await blenderCrud.read(blenderAsset.id);
  if (!blenderStored) throw new Error("Blender CRUD read failed");
  console.log("  Blender CRUD read: OK");

  // Verify Blender ready notification
  const blenderReady = blenderNotifications.find((n) => n.type === "blender:ready");
  if (!blenderReady) throw new Error("No blender:ready notification");
  if (!blenderReady.assetId) throw new Error("Missing blender assetId");
  console.log("  blender:ready shape: OK");

  // ── Test 14: Blender glb-export ─────────────────────────────
  console.log("\n[14] Blender glb-export...");
  const glbAsset = await blender.renderBlend(
    {
      inputPath: "/data/sandbox/smoke/character.blend",
      outputPath: "/data/sandbox/smoke/character.glb",
      preset: "glb-export",
    },
    {
      signal: ac.signal,
      userId: "smoke",
      notify: () => {},
      createAsset: (a) => blenderCrud.create(a),
      runBlender: async (_cmd, _signal, onProgress) => {
        onProgress(99);
      },
      checkInput: async () => ({
        ok: true,
        warnings: [],
        sizeBytes: 8192,
      }),
      assertOutput: async () => ({ ok: true, warnings: [] }),
      statFile: async () => ({ size: 16000 }),
    },
  );
  console.log(`  Asset ID: ${glbAsset.id}`);
  console.log(`  Output format: ${glbAsset.outputProbe.format}`);
  console.log("  OK");

  // Verify both Blender assets in CRUD
  const allBlenderAssets = await blenderCrud.list();
  if (allBlenderAssets.length !== 2) throw new Error(`Expected 2 Blender assets, got ${allBlenderAssets.length}`);
  console.log("  Blender CRUD list (2 assets): OK");

  // ── Test 15: Registry smoke ──────────────────────────────────
  console.log("\n[15] Registry smoke...");
  const { loadRegistry, listTools, getRegistryResource } = await import("./dist/registry/index.js");
  const reg = loadRegistry();
  console.log(`  Registry validated: ${reg.validated}`);
  console.log(`  Tools: ${reg.summary.toolCount}`);
  console.log(`  Presets: ${reg.summary.totalPresets}`);
  if (reg.summary.toolCount !== 6) throw new Error(`Expected 6 tools, got ${reg.summary.toolCount}`);
  if (reg.summary.totalPresets !== 32) throw new Error(`Expected 32 presets, got ${reg.summary.totalPresets}`);

  // MCP listTools
  const toolList = await listTools({});
  if (toolList.length !== 6) throw new Error(`listTools returned ${toolList.length}, expected 6`);
  console.log(`  listTools: ${toolList.length} tools OK`);

  // MCP getRegistryResource
  const resource = await getRegistryResource();
  if (resource.tools.length !== 6) throw new Error(`getRegistryResource returned ${resource.tools.length} tools`);
  if (resource.summary.premiumPresets !== 9) throw new Error(`Expected 9 premium presets, got ${resource.summary.premiumPresets}`);
  console.log(`  getRegistryResource: ${resource.tools.length} tools, ${resource.summary.totalPresets} presets OK`);
  console.log("  Registry smoke: OK");

  // ── Summary ──────────────────────────────────────────────────
  const allAssets = await crud.list();
  console.log(`\n=== Smoke Test PASSED (15 tests) ===`);
  console.log(`  FFmpeg assets: ${allAssets.length}`);
  console.log(`  Pandoc assets: ${allPandocAssets.length}`);
  console.log(`  FreeCAD assets: ${allFreeCADAssets.length}`);
  console.log(`  GDAL assets: ${allGDALAssets.length}`);
  console.log(`  OpenSCAD assets: ${allOpenSCADAssets.length}`);
  console.log(`  Blender assets: ${allBlenderAssets.length}`);
  console.log(`  FFmpeg notifications: ${notifications.length}`);
  console.log(`  Pandoc notifications: ${pandocNotifications.length}`);
  console.log(`  FreeCAD notifications: ${freecadNotifications.length}`);
  console.log(`  GDAL notifications: ${gdalNotifications.length}`);
  console.log(`  OpenSCAD notifications: ${openscadNotifications.length}`);
  console.log(`  Blender notifications: ${blenderNotifications.length}`);
  console.log(`  Registry: ${reg.summary.toolCount} tools, ${reg.summary.totalPresets} presets`);
}

main().catch((err) => {
  console.error("\n=== Smoke Test FAILED ===");
  console.error(err);
  process.exit(1);
});
