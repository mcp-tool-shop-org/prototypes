import { describe, it, expect, vi } from "vitest";
import {
  transformGeo,
  type TransformGeoContext,
} from "./transform.js";
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
  overrides?: Partial<TransformGeoContext>,
): {
  ctx: TransformGeoContext;
  notifications: GDALNotification[];
  assets: GDALGeoDataAsset[];
} {
  const notifications: GDALNotification[] = [];
  const assets: GDALGeoDataAsset[] = [];
  const ac = new AbortController();

  const ctx: TransformGeoContext = {
    signal: ac.signal,
    userId: "user1",
    notify: (n) => notifications.push(n),
    createAsset: vi.fn(async (a) => {
      assets.push(a);
    }),
    runGDAL: vi.fn(async (_cmd: GDALCommandArgs, _signal, onProgress) => {
      onProgress(50);
      onProgress(99);
    }),
    checkInput: vi.fn(async () => GOOD_INPUT_CHECK),
    assertOutput: vi.fn(async () => GOOD_ASSERTION),
    statFile: vi.fn(async () => ({ size: 120_000 })),
    ...overrides,
  };

  return { ctx, notifications, assets };
}

const VALID_REQ = {
  inputPath: "/data/sandbox/user1/data.tif",
  outputPath: "/data/sandbox/user1/data_wgs84.tif",
  preset: "raster-wgs84-tiff" as const,
  quality: "standard" as const,
  timeoutSeconds: 600,
  maxOutputBytes: 0,
};

// ── Tests ────────────────────────────────────────────────────────

describe("transformGeo pipeline", () => {
  it("raster-wgs84-tiff happy path: produces asset with correct shape", async () => {
    const { ctx, notifications, assets } = makeCtx();

    const asset = await transformGeo(VALID_REQ, ctx);

    expect(asset.id).toBeTruthy();
    expect(asset.inputPath).toBe(VALID_REQ.inputPath);
    expect(asset.outputPath).toBe(VALID_REQ.outputPath);
    expect(asset.preset).toBe("raster-wgs84-tiff");
    expect(asset.quality).toBe("standard");
    expect(asset.outputProbe.format).toBe("TIF");
    expect(asset.outputProbe.sizeBytes).toBe(120_000);
    expect(assets).toHaveLength(1);

    // Should have progress + ready notifications
    const progressNotifs = notifications.filter(
      (n) => n.type === "gdal:progress",
    );
    const readyNotifs = notifications.filter(
      (n) => n.type === "gdal:ready",
    );
    expect(progressNotifs.length).toBeGreaterThan(0);
    expect(readyNotifs).toHaveLength(1);

    // Final progress must be 100%
    const last100 = progressNotifs.filter(
      (n) => n.type === "gdal:progress" && n.percent === 100,
    );
    expect(last100.length).toBeGreaterThanOrEqual(1);

    // Ready notification has correct shape
    const ready = readyNotifs[0];
    expect(ready.type === "gdal:ready" && ready.preset).toBe(
      "raster-wgs84-tiff",
    );
    expect(ready.type === "gdal:ready" && ready.sizeBytes).toBe(120_000);
  });

  it("clip-raster → fallback to raster-wgs84-tiff on assertion fail + warning emitted", async () => {
    let assertCallCount = 0;
    const { ctx, notifications } = makeCtx({
      assertOutput: vi.fn(async () => {
        assertCallCount++;
        // First call (clip-raster) → fails assertion
        // Second call (raster-wgs84-tiff fallback) → passes
        return assertCallCount === 1 ? BAD_ASSERTION : GOOD_ASSERTION;
      }),
    });

    const asset = await transformGeo(
      {
        ...VALID_REQ,
        preset: "clip-raster",
        bbox: [-122.5, 37.0, -121.5, 38.0] as [number, number, number, number],
      },
      ctx,
    );

    expect(asset).toBeDefined();
    // Should have fallen back to raster-wgs84-tiff
    expect(asset.preset).toBe("raster-wgs84-tiff");

    // Should have a warning notification about fallback
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

  it("AbortSignal cancels immediately", async () => {
    const ac = new AbortController();
    ac.abort(); // pre-abort

    const { ctx } = makeCtx({ signal: ac.signal });

    await expect(transformGeo(VALID_REQ, ctx)).rejects.toThrow("Aborted");
  });

  it("maxOutputBytes preflight rejects when estimate exceeds limit", async () => {
    const { ctx } = makeCtx();

    // raster-wgs84-tiff → factor 1.4 → 50000 * 1.4 = 70000
    // Set maxOutputBytes to 100 (way below 70000)
    await expect(
      transformGeo(
        {
          ...VALID_REQ,
          maxOutputBytes: 100,
        },
        ctx,
      ),
    ).rejects.toThrow("exceeds maxOutputBytes");
  });
});
