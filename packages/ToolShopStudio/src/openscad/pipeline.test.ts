import { describe, it, expect, vi } from "vitest";
import {
  renderModel,
  type RenderModelContext,
} from "./render.js";
import type { OpenSCADModelAsset } from "./schemas.js";
import type { OpenSCADNotification } from "./types.js";
import type { OpenSCADInputCheck, OpenSCADAssertionResult } from "./preflight.js";
import type { OpenSCADCommandArgs } from "./build-args.js";

// ── Fixtures ─────────────────────────────────────────────────────

const GOOD_INPUT_CHECK: OpenSCADInputCheck = {
  ok: true,
  warnings: [],
  sizeBytes: 2048,
  lines: 50,
};

const GOOD_ASSERTION: OpenSCADAssertionResult = {
  ok: true,
  warnings: [],
};

const BAD_ASSERTION: OpenSCADAssertionResult = {
  ok: false,
  warnings: ["Output file is empty (0 bytes)."],
};

function makeCtx(
  overrides?: Partial<RenderModelContext>,
): {
  ctx: RenderModelContext;
  notifications: OpenSCADNotification[];
  assets: OpenSCADModelAsset[];
} {
  const notifications: OpenSCADNotification[] = [];
  const assets: OpenSCADModelAsset[] = [];
  const ac = new AbortController();

  const ctx: RenderModelContext = {
    signal: ac.signal,
    userId: "user1",
    notify: (n) => notifications.push(n),
    createAsset: vi.fn(async (a) => {
      assets.push(a);
    }),
    runOpenSCAD: vi.fn(async (_cmd: OpenSCADCommandArgs, _signal, onProgress) => {
      onProgress(50);
      onProgress(99);
    }),
    checkInput: vi.fn(async () => GOOD_INPUT_CHECK),
    assertOutput: vi.fn(async () => GOOD_ASSERTION),
    statFile: vi.fn(async () => ({ size: 16384 })),
    ...overrides,
  };

  return { ctx, notifications, assets };
}

const VALID_REQ = {
  inputPath: "/data/sandbox/user1/model.scad",
  outputPath: "/data/sandbox/user1/model.stl",
  preset: "stl-print-ready" as const,
  quality: "standard" as const,
  timeoutSeconds: 900,
  maxOutputBytes: 0,
};

// ── Tests ────────────────────────────────────────────────────────

describe("renderModel pipeline", () => {
  it("stl-print-ready happy path: produces asset with correct shape", async () => {
    const { ctx, notifications, assets } = makeCtx();

    const asset = await renderModel(VALID_REQ, ctx);

    expect(asset.id).toBeTruthy();
    expect(asset.inputPath).toBe(VALID_REQ.inputPath);
    expect(asset.outputPath).toBe(VALID_REQ.outputPath);
    expect(asset.preset).toBe("stl-print-ready");
    expect(asset.quality).toBe("standard");
    expect(asset.outputProbe.format).toBe("STL");
    expect(asset.outputProbe.sizeBytes).toBe(16384);
    expect(assets).toHaveLength(1);

    // Should have progress + ready notifications
    const progressNotifs = notifications.filter(
      (n) => n.type === "openscad:progress",
    );
    const readyNotifs = notifications.filter(
      (n) => n.type === "openscad:ready",
    );
    expect(progressNotifs.length).toBeGreaterThan(0);
    expect(readyNotifs).toHaveLength(1);

    // Final progress must be 100%
    const last100 = progressNotifs.filter(
      (n) => n.type === "openscad:progress" && n.percent === 100,
    );
    expect(last100.length).toBeGreaterThanOrEqual(1);

    // Ready notification has correct shape
    const ready = readyNotifs[0];
    expect(ready.type === "openscad:ready" && ready.preset).toBe(
      "stl-print-ready",
    );
    expect(ready.type === "openscad:ready" && ready.sizeBytes).toBe(16384);
  });

  it("3mf-color → fallback to stl-print-ready on assertion fail + warning emitted", async () => {
    let assertCallCount = 0;
    const { ctx, notifications } = makeCtx({
      assertOutput: vi.fn(async () => {
        assertCallCount++;
        // First call (3mf-color) → fails assertion
        // Second call (stl-print-ready fallback) → passes
        return assertCallCount === 1 ? BAD_ASSERTION : GOOD_ASSERTION;
      }),
    });

    const asset = await renderModel(
      {
        ...VALID_REQ,
        preset: "3mf-color" as const,
        outputPath: "/data/sandbox/user1/model.3mf",
      },
      ctx,
    );

    expect(asset).toBeDefined();
    // Should have fallen back to stl-print-ready
    expect(asset.preset).toBe("stl-print-ready");

    // Should have a warning notification about fallback
    const warningNotifs = notifications.filter(
      (n) => n.type === "openscad:warning",
    );
    expect(warningNotifs.length).toBeGreaterThanOrEqual(1);
    expect(
      warningNotifs.some(
        (n) =>
          n.type === "openscad:warning" &&
          n.warnings.some((w) => w.includes("falling back")),
      ),
    ).toBe(true);
  });

  it("AbortSignal cancels immediately", async () => {
    const ac = new AbortController();
    ac.abort(); // pre-abort

    const { ctx } = makeCtx({ signal: ac.signal });

    await expect(renderModel(VALID_REQ, ctx)).rejects.toThrow("Aborted");
  });

  it("maxOutputBytes preflight rejects when estimate exceeds limit", async () => {
    const { ctx } = makeCtx();

    // stl-print-ready → factor 8.0 → 2048 * 8.0 = 16384
    // Set maxOutputBytes to 100 (way below 16384)
    await expect(
      renderModel(
        {
          ...VALID_REQ,
          maxOutputBytes: 100,
        },
        ctx,
      ),
    ).rejects.toThrow("exceeds maxOutputBytes");
  });
});
