import { describe, it, expect, vi } from "vitest";
import {
  renderBlend,
  type RenderBlendContext,
} from "./render.js";
import { createBlenderCRUD } from "./crud.js";
import { ensureBlenderExtension } from "./output-polish.js";
import { BLENDER_PRESET_SPECS } from "./preset-spec.js";
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
  crud: ReturnType<typeof createBlenderCRUD>,
  overrides?: Partial<RenderBlendContext>,
): {
  ctx: RenderBlendContext;
  notifications: BlenderNotification[];
} {
  const notifications: BlenderNotification[] = [];
  const ac = new AbortController();

  const ctx: RenderBlendContext = {
    signal: ac.signal,
    userId: "user1",
    notify: (n) => notifications.push(n),
    createAsset: async (a) => { await crud.create(a); },
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
    statFile: vi.fn(async () => ({ size: 16_384 })),
    ...overrides,
  };

  return { ctx, notifications };
}

// ── Tests ────────────────────────────────────────────────────────

describe("blender full integration", () => {
  it("png-preview happy path: polish + CRUD create + correct metadata", async () => {
    const crud = createBlenderCRUD();
    const { ctx, notifications } = makeCtx(crud);

    const asset = await renderBlend(
      {
        inputPath: "/data/sandbox/user1/scene.blend",
        outputPath: "/data/sandbox/user1/render.png",
        preset: "png-preview",
      },
      ctx,
    );

    // Asset shape
    expect(asset.id).toBeTruthy();
    expect(asset.preset).toBe("png-preview");
    expect(asset.quality).toBe("standard"); // default
    expect(asset.outputPath).toBe("/data/sandbox/user1/render.png");
    expect(asset.outputProbe.format).toBe("PNG");
    expect(asset.outputProbe.sizeBytes).toBe(16_384);
    expect(asset.expiresAt).toBeTruthy();
    expect(new Date(asset.expiresAt).getTime()).toBeGreaterThan(Date.now());

    // CRUD persisted
    const stored = await crud.read(asset.id);
    expect(stored).not.toBeNull();
    expect(stored?.id).toBe(asset.id);

    const all = await crud.list();
    expect(all).toHaveLength(1);

    // Filter by preset
    const filtered = await crud.list({ preset: "glb-export" });
    expect(filtered).toHaveLength(0);

    // Notifications: progress → ready
    const readyNotifs = notifications.filter((n) => n.type === "blender:ready");
    expect(readyNotifs).toHaveLength(1);
    expect(
      readyNotifs[0].type === "blender:ready" && readyNotifs[0].sizeBytes,
    ).toBe(16_384);
  });

  it("cycles-render fallback → correct preset in asset + png extension in polished path + warning emitted", async () => {
    let assertCallCount = 0;
    const crud = createBlenderCRUD();
    const { ctx, notifications } = makeCtx(crud, {
      assertOutput: vi.fn(async () => {
        assertCallCount++;
        return assertCallCount === 1 ? BAD_ASSERTION : GOOD_ASSERTION;
      }),
    });

    const asset = await renderBlend(
      {
        inputPath: "/data/sandbox/user1/hero.blend",
        outputPath: "/data/sandbox/user1/hero.png",
        preset: "cycles-render",
      },
      ctx,
    );

    // Should have fallen back to png-preview
    expect(asset.preset).toBe("png-preview");
    // .png matches both cycles-render and png-preview, so no extension change
    expect(asset.outputPath).toBe("/data/sandbox/user1/hero.png");
    expect(asset.outputProbe.format).toBe("PNG");

    // CRUD has the fallback asset
    const stored = await crud.read(asset.id);
    expect(stored?.preset).toBe("png-preview");

    // Warning about fallback was emitted
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

  it("dual preset smoke: png + glb in same CRUD store with filtering", async () => {
    const crud = createBlenderCRUD();

    // PNG render
    const { ctx: ctx1 } = makeCtx(crud);
    const pngAsset = await renderBlend(
      {
        inputPath: "/data/sandbox/user1/model.blend",
        outputPath: "/data/sandbox/user1/model.png",
        preset: "png-preview",
      },
      ctx1,
    );

    // GLB export
    const { ctx: ctx2 } = makeCtx(crud);
    const glbAsset = await renderBlend(
      {
        inputPath: "/data/sandbox/user1/model.blend",
        outputPath: "/data/sandbox/user1/model.glb",
        preset: "glb-export",
      },
      ctx2,
    );

    // Both stored
    const all = await crud.list();
    expect(all).toHaveLength(2);

    // Filter works
    const pngs = await crud.list({ preset: "png-preview" });
    expect(pngs).toHaveLength(1);
    expect(pngs[0].id).toBe(pngAsset.id);

    const glbs = await crud.list({ preset: "glb-export" });
    expect(glbs).toHaveLength(1);
    expect(glbs[0].id).toBe(glbAsset.id);

    // Different output formats
    expect(pngAsset.outputProbe.format).toBe("PNG");
    expect(glbAsset.outputProbe.format).toBe("GLB");
  });
});

// ── Output polish unit tests ─────────────────────────────────────

describe("ensureBlenderExtension", () => {
  it("returns unchanged if extension matches", () => {
    const spec = BLENDER_PRESET_SPECS["png-preview"];
    expect(ensureBlenderExtension("render.png", spec)).toBe("render.png");
  });

  it("appends extension if missing", () => {
    const spec = BLENDER_PRESET_SPECS["glb-export"];
    expect(ensureBlenderExtension("model", spec)).toBe("model.glb");
  });

  it("appends correct extension if different", () => {
    const spec = BLENDER_PRESET_SPECS["stl-from-mesh"];
    expect(ensureBlenderExtension("model.obj", spec)).toBe("model.obj.stl");
  });
});
