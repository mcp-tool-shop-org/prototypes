import { describe, it, expect, vi } from "vitest";
import {
  transformGeo,
  type TransformGeoContext,
} from "./transform.js";
import { createGDALCRUD } from "./crud.js";
import { ensureGDALExtension } from "./output-polish.js";
import { GDAL_PRESET_SPECS } from "./preset-spec.js";
import type { GDALGeoDataAsset } from "./schemas.js";
import type { GDALNotification } from "./types.js";
import type { GDALInputCheck, GDALAssertionResult } from "./preflight.js";
import type { GDALCommandArgs } from "./build-args.js";

// ── Fixtures ─────────────────────────────────────────────────────

const GOOD_INPUT_CHECK: GDALInputCheck = {
  ok: true,
  warnings: [],
  sizeBytes: 50_000,
};

const GOOD_ASSERTION: GDALAssertionResult = {
  ok: true,
  warnings: [],
};

const BAD_ASSERTION: GDALAssertionResult = {
  ok: false,
  warnings: ["Output file is empty — GDAL produced no content."],
};

function makeCtx(
  crud: ReturnType<typeof createGDALCRUD>,
  overrides?: Partial<TransformGeoContext>,
): {
  ctx: TransformGeoContext;
  notifications: GDALNotification[];
} {
  const notifications: GDALNotification[] = [];
  const ac = new AbortController();

  const ctx: TransformGeoContext = {
    signal: ac.signal,
    userId: "user1",
    notify: (n) => notifications.push(n),
    createAsset: async (a) => { await crud.create(a); },
    runGDAL: vi.fn(async (_cmd: GDALCommandArgs, _signal, onProgress) => {
      onProgress(50);
      onProgress(99);
    }),
    checkInput: vi.fn(async () => GOOD_INPUT_CHECK),
    assertOutput: vi.fn(async () => GOOD_ASSERTION),
    statFile: vi.fn(async () => ({ size: 120_000 })),
    ...overrides,
  };

  return { ctx, notifications };
}

// ── Tests ────────────────────────────────────────────────────────

describe("gdal full integration", () => {
  it("raster-wgs84-tiff happy path: polish + CRUD create + correct metadata", async () => {
    const crud = createGDALCRUD();
    const { ctx, notifications } = makeCtx(crud);

    const asset = await transformGeo(
      {
        inputPath: "/data/sandbox/user1/terrain.tif",
        outputPath: "/data/sandbox/user1/terrain_wgs84.tif",
        preset: "raster-wgs84-tiff",
      },
      ctx,
    );

    // Asset shape
    expect(asset.id).toBeTruthy();
    expect(asset.preset).toBe("raster-wgs84-tiff");
    expect(asset.quality).toBe("standard"); // default
    expect(asset.outputPath).toBe("/data/sandbox/user1/terrain_wgs84.tif");
    expect(asset.outputProbe.format).toBe("TIF");
    expect(asset.outputProbe.sizeBytes).toBe(120_000);
    expect(asset.expiresAt).toBeTruthy();
    expect(new Date(asset.expiresAt).getTime()).toBeGreaterThan(Date.now());

    // CRUD persisted
    const stored = await crud.read(asset.id);
    expect(stored).not.toBeNull();
    expect(stored?.id).toBe(asset.id);

    const all = await crud.list();
    expect(all).toHaveLength(1);

    // Filter by preset
    const filtered = await crud.list({ preset: "vector-geojson" });
    expect(filtered).toHaveLength(0);

    // Notifications: progress → ready
    const readyNotifs = notifications.filter((n) => n.type === "gdal:ready");
    expect(readyNotifs).toHaveLength(1);
    expect(
      readyNotifs[0].type === "gdal:ready" && readyNotifs[0].sizeBytes,
    ).toBe(120_000);
  });

  it("clip-raster fallback → correct preset in asset + warning emitted", async () => {
    let assertCallCount = 0;
    const crud = createGDALCRUD();
    const { ctx, notifications } = makeCtx(crud, {
      assertOutput: vi.fn(async () => {
        assertCallCount++;
        return assertCallCount === 1 ? BAD_ASSERTION : GOOD_ASSERTION;
      }),
    });

    const asset = await transformGeo(
      {
        inputPath: "/data/sandbox/user1/region.tif",
        outputPath: "/data/sandbox/user1/region_clip.tif",
        preset: "clip-raster",
        bbox: [-122.5, 37.0, -121.5, 38.0],
      },
      ctx,
    );

    // Should have fallen back to raster-wgs84-tiff
    expect(asset.preset).toBe("raster-wgs84-tiff");
    expect(asset.outputProbe.format).toBe("TIF");

    // CRUD has the fallback asset
    const stored = await crud.read(asset.id);
    expect(stored?.preset).toBe("raster-wgs84-tiff");

    // Warning about fallback was emitted
    const warningNotifs = notifications.filter(
      (n) => n.type === "gdal:warning",
    );
    expect(warningNotifs.length).toBeGreaterThanOrEqual(1);
    expect(
      warningNotifs.some(
        (n) =>
          n.type === "gdal:warning" &&
          n.warnings.some((w) => w.includes("falling back")),
      ),
    ).toBe(true);
  });

  it("dual preset smoke: raster + vector in same CRUD store", async () => {
    const crud = createGDALCRUD();

    // Raster reproject
    const { ctx: ctx1 } = makeCtx(crud);
    const rasterAsset = await transformGeo(
      {
        inputPath: "/data/sandbox/user1/dem.tif",
        outputPath: "/data/sandbox/user1/dem_wgs84.tif",
        preset: "raster-wgs84-tiff",
      },
      ctx1,
    );

    // Vector conversion
    const { ctx: ctx2 } = makeCtx(crud);
    const vectorAsset = await transformGeo(
      {
        inputPath: "/data/sandbox/user1/roads.shp",
        outputPath: "/data/sandbox/user1/roads.geojson",
        preset: "vector-geojson",
      },
      ctx2,
    );

    // Both stored
    const all = await crud.list();
    expect(all).toHaveLength(2);

    // Filter works
    const rasters = await crud.list({ preset: "raster-wgs84-tiff" });
    expect(rasters).toHaveLength(1);
    expect(rasters[0].id).toBe(rasterAsset.id);

    const vectors = await crud.list({ preset: "vector-geojson" });
    expect(vectors).toHaveLength(1);
    expect(vectors[0].id).toBe(vectorAsset.id);

    // Different output formats
    expect(rasterAsset.outputProbe.format).toBe("TIF");
    expect(vectorAsset.outputProbe.format).toBe("GEOJSON");
  });
});

// ── Output polish unit tests ─────────────────────────────────────

describe("ensureGDALExtension", () => {
  it("returns unchanged if extension matches", () => {
    const spec = GDAL_PRESET_SPECS["raster-wgs84-tiff"];
    expect(ensureGDALExtension("terrain.tif", spec)).toBe("terrain.tif");
  });

  it("appends extension if missing", () => {
    const spec = GDAL_PRESET_SPECS["vector-geojson"];
    expect(ensureGDALExtension("roads", spec)).toBe("roads.geojson");
  });

  it("appends correct extension if different", () => {
    const spec = GDAL_PRESET_SPECS["raster-to-png"];
    expect(ensureGDALExtension("raster.tif", spec)).toBe("raster.tif.png");
  });
});
