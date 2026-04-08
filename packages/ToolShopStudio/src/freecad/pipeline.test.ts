import { describe, it, expect, vi } from "vitest";
import {
  exportPart,
  type ExportPartContext,
} from "./export.js";
import type { FreeCADPartAsset } from "./schemas.js";
import type { FreeCADNotification } from "./types.js";
import type { FreeCADInputCheck, FreeCADAssertionResult } from "./preflight.js";
import type { FreeCADPresetSpec } from "./preset-spec.js";

// ── Fixtures ─────────────────────────────────────────────────────

const GOOD_INPUT_CHECK: FreeCADInputCheck = {
  ok: true,
  warnings: [],
  sizeBytes: 50_000,
};

const GOOD_ASSERTION: FreeCADAssertionResult = {
  ok: true,
  warnings: [],
};

const BAD_ASSERTION: FreeCADAssertionResult = {
  ok: false,
  warnings: ["Output file is empty — FreeCAD produced no content."],
};

function makeCtx(
  overrides?: Partial<ExportPartContext>,
): {
  ctx: ExportPartContext;
  notifications: FreeCADNotification[];
  assets: FreeCADPartAsset[];
} {
  const notifications: FreeCADNotification[] = [];
  const assets: FreeCADPartAsset[] = [];
  const ac = new AbortController();

  const ctx: ExportPartContext = {
    signal: ac.signal,
    userId: "user1",
    notify: (n) => notifications.push(n),
    createAsset: vi.fn(async (a) => {
      assets.push(a);
    }),
    runFreeCAD: vi.fn(async (_args, _signal, onProgress) => {
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
  inputPath: "/data/sandbox/user1/model.FCStd",
  outputPath: "/data/sandbox/user1/model.stl",
  preset: "stl-print-ready" as const,
  quality: "standard" as const,
  timeoutSeconds: 1800,
  maxOutputBytes: 0,
};

// ── Tests ────────────────────────────────────────────────────────

describe("exportPart pipeline", () => {
  it("stl-print-ready happy path: produces asset with correct shape", async () => {
    const { ctx, notifications, assets } = makeCtx();

    const asset = await exportPart(VALID_REQ, ctx);

    expect(asset.id).toBeTruthy();
    expect(asset.inputPath).toBe(VALID_REQ.inputPath);
    expect(asset.outputPath).toBe(VALID_REQ.outputPath);
    expect(asset.preset).toBe("stl-print-ready");
    expect(asset.quality).toBe("standard");
    expect(asset.outputProbe.format).toBe("STL");
    expect(asset.outputProbe.sizeBytes).toBe(120_000);
    expect(assets).toHaveLength(1);

    // Should have progress + ready notifications
    const progressNotifs = notifications.filter(
      (n) => n.type === "freecad:progress",
    );
    const readyNotifs = notifications.filter(
      (n) => n.type === "freecad:ready",
    );
    expect(progressNotifs.length).toBeGreaterThan(0);
    expect(readyNotifs).toHaveLength(1);

    // Final progress must be 100%
    const last100 = progressNotifs.filter(
      (n) => n.type === "freecad:progress" && n.percent === 100,
    );
    expect(last100.length).toBeGreaterThanOrEqual(1);

    // Ready notification has correct shape
    const ready = readyNotifs[0];
    expect(ready.type === "freecad:ready" && ready.preset).toBe(
      "stl-print-ready",
    );
    expect(ready.type === "freecad:ready" && ready.sizeBytes).toBe(120_000);
  });

  it("3mf-slicer-ready → fallback to stl-print-ready on assertion fail + warning emitted", async () => {
    let assertCallCount = 0;
    const { ctx, notifications } = makeCtx({
      assertOutput: vi.fn(async () => {
        assertCallCount++;
        // First call (3mf) → fails assertion
        // Second call (stl fallback) → passes
        return assertCallCount === 1 ? BAD_ASSERTION : GOOD_ASSERTION;
      }),
    });

    const asset = await exportPart(
      {
        ...VALID_REQ,
        preset: "3mf-slicer-ready",
        outputPath: "/data/sandbox/user1/model.3mf",
      },
      ctx,
    );

    expect(asset).toBeDefined();
    // Should have fallen back to stl-print-ready
    expect(asset.preset).toBe("stl-print-ready");

    // Should have a warning notification about fallback
    const warningNotifs = notifications.filter(
      (n) => n.type === "freecad:warning",
    );
    expect(warningNotifs.length).toBeGreaterThanOrEqual(1);
    expect(
      warningNotifs.some(
        (n) =>
          n.type === "freecad:warning" &&
          n.warnings.some((w) => w.includes("falling back")),
      ),
    ).toBe(true);
  });

  it("AbortSignal cancels immediately", async () => {
    const ac = new AbortController();
    ac.abort(); // pre-abort

    const { ctx } = makeCtx({ signal: ac.signal });

    await expect(exportPart(VALID_REQ, ctx)).rejects.toThrow("Aborted");
  });

  it("maxOutputBytes preflight rejects when estimate exceeds limit", async () => {
    const { ctx } = makeCtx();

    // stl-print-ready → STL → factor 1.5 → 50000 * 1.5 = 75000
    // Set maxOutputBytes to 100 (way below 75000)
    await expect(
      exportPart(
        {
          ...VALID_REQ,
          maxOutputBytes: 100,
        },
        ctx,
      ),
    ).rejects.toThrow("exceeds maxOutputBytes");
  });
});
