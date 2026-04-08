import { describe, it, expect, vi } from "vitest";
import {
  renderModel,
  type RenderModelContext,
} from "./render.js";
import { createOpenSCADCRUD } from "./crud.js";
import { ensureOpenSCADExtension } from "./output-polish.js";
import { OPENSCAD_PRESET_SPECS } from "./preset-spec.js";
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
  crud: ReturnType<typeof createOpenSCADCRUD>,
  overrides?: Partial<RenderModelContext>,
): {
  ctx: RenderModelContext;
  notifications: OpenSCADNotification[];
} {
  const notifications: OpenSCADNotification[] = [];
  const ac = new AbortController();

  const ctx: RenderModelContext = {
    signal: ac.signal,
    userId: "user1",
    notify: (n) => notifications.push(n),
    createAsset: async (a) => { await crud.create(a); },
    runOpenSCAD: vi.fn(async (_cmd: OpenSCADCommandArgs, _signal, onProgress) => {
      onProgress(50);
      onProgress(99);
    }),
    checkInput: vi.fn(async () => GOOD_INPUT_CHECK),
    assertOutput: vi.fn(async () => GOOD_ASSERTION),
    statFile: vi.fn(async () => ({ size: 16_384 })),
    ...overrides,
  };

  return { ctx, notifications };
}

// ── Tests ────────────────────────────────────────────────────────

describe("openscad full integration", () => {
  it("stl-print-ready happy path: polish + CRUD create + correct metadata", async () => {
    const crud = createOpenSCADCRUD();
    const { ctx, notifications } = makeCtx(crud);

    const asset = await renderModel(
      {
        inputPath: "/data/sandbox/user1/model.scad",
        outputPath: "/data/sandbox/user1/model.stl",
        preset: "stl-print-ready",
      },
      ctx,
    );

    // Asset shape
    expect(asset.id).toBeTruthy();
    expect(asset.preset).toBe("stl-print-ready");
    expect(asset.quality).toBe("standard"); // default
    expect(asset.outputPath).toBe("/data/sandbox/user1/model.stl");
    expect(asset.outputProbe.format).toBe("STL");
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
    const filtered = await crud.list({ preset: "png-preview" });
    expect(filtered).toHaveLength(0);

    // Notifications: progress → ready
    const readyNotifs = notifications.filter((n) => n.type === "openscad:ready");
    expect(readyNotifs).toHaveLength(1);
    expect(
      readyNotifs[0].type === "openscad:ready" && readyNotifs[0].sizeBytes,
    ).toBe(16_384);
  });

  it("3mf-color fallback → correct preset in asset + stl extension in polished path + warning emitted", async () => {
    let assertCallCount = 0;
    const crud = createOpenSCADCRUD();
    const { ctx, notifications } = makeCtx(crud, {
      assertOutput: vi.fn(async () => {
        assertCallCount++;
        return assertCallCount === 1 ? BAD_ASSERTION : GOOD_ASSERTION;
      }),
    });

    const asset = await renderModel(
      {
        inputPath: "/data/sandbox/user1/housing.scad",
        outputPath: "/data/sandbox/user1/housing.3mf",
        preset: "3mf-color",
      },
      ctx,
    );

    // Should have fallen back to stl-print-ready
    expect(asset.preset).toBe("stl-print-ready");
    // Polish should have auto-corrected .3mf → .3mf.stl
    expect(asset.outputPath).toBe("/data/sandbox/user1/housing.3mf.stl");
    expect(asset.outputProbe.format).toBe("STL");

    // CRUD has the fallback asset
    const stored = await crud.read(asset.id);
    expect(stored?.preset).toBe("stl-print-ready");

    // Warning about fallback was emitted
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

  it("dual preset smoke: stl + png-preview in same CRUD store", async () => {
    const crud = createOpenSCADCRUD();

    // STL render
    const { ctx: ctx1 } = makeCtx(crud);
    const stlAsset = await renderModel(
      {
        inputPath: "/data/sandbox/user1/bracket.scad",
        outputPath: "/data/sandbox/user1/bracket.stl",
        preset: "stl-print-ready",
      },
      ctx1,
    );

    // PNG preview
    const { ctx: ctx2 } = makeCtx(crud);
    const pngAsset = await renderModel(
      {
        inputPath: "/data/sandbox/user1/bracket.scad",
        outputPath: "/data/sandbox/user1/bracket.png",
        preset: "png-preview",
      },
      ctx2,
    );

    // Both stored
    const all = await crud.list();
    expect(all).toHaveLength(2);

    // Filter works
    const stls = await crud.list({ preset: "stl-print-ready" });
    expect(stls).toHaveLength(1);
    expect(stls[0].id).toBe(stlAsset.id);

    const pngs = await crud.list({ preset: "png-preview" });
    expect(pngs).toHaveLength(1);
    expect(pngs[0].id).toBe(pngAsset.id);

    // Different output formats
    expect(stlAsset.outputProbe.format).toBe("STL");
    expect(pngAsset.outputProbe.format).toBe("PNG");
  });
});

// ── Output polish unit tests ─────────────────────────────────────

describe("ensureOpenSCADExtension", () => {
  it("returns unchanged if extension matches", () => {
    const spec = OPENSCAD_PRESET_SPECS["stl-print-ready"];
    expect(ensureOpenSCADExtension("model.stl", spec)).toBe("model.stl");
  });

  it("appends extension if missing", () => {
    const spec = OPENSCAD_PRESET_SPECS["dxf-2d"];
    expect(ensureOpenSCADExtension("drawing", spec)).toBe("drawing.dxf");
  });

  it("appends correct extension if different", () => {
    const spec = OPENSCAD_PRESET_SPECS["png-preview"];
    expect(ensureOpenSCADExtension("model.stl", spec)).toBe("model.stl.png");
  });
});
