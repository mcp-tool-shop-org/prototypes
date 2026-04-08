import { describe, it, expect, vi } from "vitest";
import {
  exportPart,
  type ExportPartContext,
} from "./export.js";
import { createFreeCADCRUD } from "./crud.js";
import { ensureFreeCADExtension } from "./output-polish.js";
import { FREECAD_PRESET_SPECS } from "./preset-spec.js";
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
  crud: ReturnType<typeof createFreeCADCRUD>,
  overrides?: Partial<ExportPartContext>,
): {
  ctx: ExportPartContext;
  notifications: FreeCADNotification[];
} {
  const notifications: FreeCADNotification[] = [];
  const ac = new AbortController();

  const ctx: ExportPartContext = {
    signal: ac.signal,
    userId: "user1",
    notify: (n) => notifications.push(n),
    createAsset: async (a) => { await crud.create(a); },
    runFreeCAD: vi.fn(async (_args, _signal, onProgress) => {
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

describe("freecad full integration", () => {
  it("stl-print-ready happy path: polish + CRUD create + correct metadata", async () => {
    const crud = createFreeCADCRUD();
    const { ctx, notifications } = makeCtx(crud);

    const asset = await exportPart(
      {
        inputPath: "/data/sandbox/user1/model.FCStd",
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
    const filtered = await crud.list({ preset: "step-precision" });
    expect(filtered).toHaveLength(0);

    // Notifications: progress → ready
    const readyNotifs = notifications.filter((n) => n.type === "freecad:ready");
    expect(readyNotifs).toHaveLength(1);
    expect(
      readyNotifs[0].type === "freecad:ready" && readyNotifs[0].sizeBytes,
    ).toBe(120_000);
  });

  it("3mf fallback → correct preset in asset + stl extension in polished path + warning emitted", async () => {
    let assertCallCount = 0;
    const crud = createFreeCADCRUD();
    const { ctx, notifications } = makeCtx(crud, {
      assertOutput: vi.fn(async () => {
        assertCallCount++;
        return assertCallCount === 1 ? BAD_ASSERTION : GOOD_ASSERTION;
      }),
    });

    const asset = await exportPart(
      {
        inputPath: "/data/sandbox/user1/housing.FCStd",
        outputPath: "/data/sandbox/user1/housing.3mf",
        preset: "3mf-slicer-ready",
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

  it("dual preset smoke: stl + step in same CRUD store", async () => {
    const crud = createFreeCADCRUD();

    // STL export
    const { ctx: ctx1 } = makeCtx(crud);
    const stlAsset = await exportPart(
      {
        inputPath: "/data/sandbox/user1/bracket.FCStd",
        outputPath: "/data/sandbox/user1/bracket.stl",
        preset: "stl-print-ready",
      },
      ctx1,
    );

    // STEP export
    const { ctx: ctx2 } = makeCtx(crud);
    const stepAsset = await exportPart(
      {
        inputPath: "/data/sandbox/user1/shaft.FCStd",
        outputPath: "/data/sandbox/user1/shaft.step",
        preset: "step-precision",
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

    const steps = await crud.list({ preset: "step-precision" });
    expect(steps).toHaveLength(1);
    expect(steps[0].id).toBe(stepAsset.id);

    // Different output formats
    expect(stlAsset.outputProbe.format).toBe("STL");
    expect(stepAsset.outputProbe.format).toBe("STEP");
  });
});

// ── Output polish unit tests ─────────────────────────────────────

describe("ensureFreeCADExtension", () => {
  it("returns unchanged if extension matches", () => {
    const spec = FREECAD_PRESET_SPECS["stl-print-ready"];
    expect(ensureFreeCADExtension("model.stl", spec)).toBe("model.stl");
  });

  it("appends extension if missing", () => {
    const spec = FREECAD_PRESET_SPECS["step-precision"];
    expect(ensureFreeCADExtension("shaft", spec)).toBe("shaft.step");
  });

  it("appends correct extension if different", () => {
    const spec = FREECAD_PRESET_SPECS["glb-web-ready"];
    expect(ensureFreeCADExtension("model.obj", spec)).toBe("model.obj.glb");
  });
});
