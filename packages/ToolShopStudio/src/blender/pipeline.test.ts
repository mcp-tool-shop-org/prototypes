import { describe, it, expect, vi } from "vitest";
import {
  renderBlend,
  type RenderBlendContext,
} from "./render.js";
import type { BlenderRenderAsset } from "./schemas.js";
import type { BlenderNotification } from "./types.js";
import type { BlenderInputCheck, BlenderAssertionResult } from "./preflight.js";
import type { BlenderCommandArgs } from "./build-args.js";
import type { BlenderPresetSpec } from "./preset-spec.js";

// ── Fixtures ─────────────────────────────────────────────────────

const GOOD_INPUT_CHECK: BlenderInputCheck = {
  ok: true,
  warnings: [],
  sizeBytes: 2048,
};

const GOOD_ASSERTION: BlenderAssertionResult = {
  ok: true,
  warnings: [],
};

const BAD_ASSERTION: BlenderAssertionResult = {
  ok: false,
  warnings: ["Output file is empty (0 bytes)."],
};

function makeCtx(
  overrides?: Partial<RenderBlendContext>,
): {
  ctx: RenderBlendContext;
  notifications: BlenderNotification[];
  assets: BlenderRenderAsset[];
} {
  const notifications: BlenderNotification[] = [];
  const assets: BlenderRenderAsset[] = [];
  const ac = new AbortController();

  const ctx: RenderBlendContext = {
    signal: ac.signal,
    userId: "user1",
    notify: (n) => notifications.push(n),
    createAsset: vi.fn(async (a) => {
      assets.push(a);
    }),
    runBlender: vi.fn(async (
      _cmd: BlenderCommandArgs,
      _signal: AbortSignal,
      onProgress: (percent: number) => void,
    ) => {
      onProgress(50);
      onProgress(99);
    }),
    checkInput: vi.fn(async () => GOOD_INPUT_CHECK),
    assertOutput: vi.fn(async (
      _spec: BlenderPresetSpec,
      _outputPath: string,
      _maxOutputBytes: number,
      _inputSizeBytes?: number,
    ) => GOOD_ASSERTION),
    statFile: vi.fn(async () => ({ size: 16384 })),
    ...overrides,
  };

  return { ctx, notifications, assets };
}

const VALID_REQ = {
  inputPath: "/data/sandbox/user1/scene.blend",
  outputPath: "/data/sandbox/user1/render.png",
  preset: "png-preview" as const,
  quality: "standard" as const,
  timeoutSeconds: 900,
  maxOutputBytes: 0,
};

// ── Tests ────────────────────────────────────────────────────────

describe("renderBlend pipeline", () => {
  it("png-preview happy path: produces asset with correct shape", async () => {
    const { ctx, notifications, assets } = makeCtx();

    const asset = await renderBlend(VALID_REQ, ctx);

    expect(asset.id).toBeTruthy();
    expect(asset.inputPath).toBe(VALID_REQ.inputPath);
    expect(asset.outputPath).toBe(VALID_REQ.outputPath);
    expect(asset.preset).toBe("png-preview");
    expect(asset.quality).toBe("standard");
    expect(asset.outputProbe.format).toBe("PNG");
    expect(asset.outputProbe.sizeBytes).toBe(16384);
    expect(assets).toHaveLength(1);

    // Should have progress + ready notifications
    const progressNotifs = notifications.filter(
      (n) => n.type === "blender:progress",
    );
    const readyNotifs = notifications.filter(
      (n) => n.type === "blender:ready",
    );
    expect(progressNotifs.length).toBeGreaterThan(0);
    expect(readyNotifs).toHaveLength(1);

    // Final progress must be 100%
    const last100 = progressNotifs.filter(
      (n) => n.type === "blender:progress" && n.percent === 100,
    );
    expect(last100.length).toBeGreaterThanOrEqual(1);

    // Ready notification has correct shape
    const ready = readyNotifs[0];
    expect(ready.type === "blender:ready" && ready.preset).toBe(
      "png-preview",
    );
    expect(ready.type === "blender:ready" && ready.sizeBytes).toBe(16384);
  });

  it("cycles-render → fallback to png-preview on assertion fail + warning emitted", async () => {
    let assertCallCount = 0;
    const { ctx, notifications } = makeCtx({
      assertOutput: vi.fn(async () => {
        assertCallCount++;
        // First call (cycles-render) → fails assertion
        // Second call (png-preview fallback) → passes
        return assertCallCount === 1 ? BAD_ASSERTION : GOOD_ASSERTION;
      }),
    });

    const asset = await renderBlend(
      {
        ...VALID_REQ,
        preset: "cycles-render" as const,
        outputPath: "/data/sandbox/user1/render.png",
      },
      ctx,
    );

    expect(asset).toBeDefined();
    // Should have fallen back to png-preview
    expect(asset.preset).toBe("png-preview");

    // Should have a warning notification about fallback
    const warningNotifs = notifications.filter(
      (n) => n.type === "blender:warning",
    );
    expect(warningNotifs.length).toBeGreaterThanOrEqual(1);
    expect(
      warningNotifs.some(
        (n) =>
          n.type === "blender:warning" &&
          n.warnings.some((w) => w.includes("falling back")),
      ),
    ).toBe(true);
  });

  it("AbortSignal cancels immediately", async () => {
    const ac = new AbortController();
    ac.abort(); // pre-abort

    const { ctx } = makeCtx({ signal: ac.signal });

    await expect(renderBlend(VALID_REQ, ctx)).rejects.toThrow("Aborted");
  });

  it("maxOutputBytes preflight rejects when estimate exceeds limit", async () => {
    const { ctx } = makeCtx();

    // png-preview → factor 0.5 → 2048 * 0.5 = 1024
    // Set maxOutputBytes to 100 (way below 1024)
    await expect(
      renderBlend(
        {
          ...VALID_REQ,
          maxOutputBytes: 100,
        },
        ctx,
      ),
    ).rejects.toThrow("exceeds maxOutputBytes");
  });
});
