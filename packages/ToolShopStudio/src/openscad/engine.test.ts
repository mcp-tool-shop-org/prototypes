import { describe, test, expect } from "vitest";
import { buildOpenSCADArgs } from "./build-args.js";
import type { OpenSCADCommandArgs } from "./build-args.js";
import {
  OPENSCAD_PRESET_SPECS,
  buildOpenSCADBaseArgs,
  qualityToFn,
} from "./preset-spec.js";
import type { OpenSCADPreset, RenderModel } from "./schemas.js";
import { RenderModelSchema } from "./schemas.js";
import {
  estimateOpenSCADOutputBytes,
  checkOpenSCADDangerousConstructs,
} from "./preflight.js";
import {
  isOpenSCADStepLine,
  extractOpenSCADPercent,
  calculateOpenSCADPercent,
} from "./progress.js";

// ── Helper ───────────────────────────────────────────────────────

function makeReq(overrides: Partial<RenderModel> = {}): RenderModel {
  return RenderModelSchema.parse({
    inputPath: "/sandbox/user/smoke/test.scad",
    outputPath: "/sandbox/user/smoke/out.stl",
    preset: "stl-print-ready",
    ...overrides,
  });
}

// ── buildOpenSCADArgs ────────────────────────────────────────────

describe("buildOpenSCADArgs", () => {
  test.each(Object.keys(OPENSCAD_PRESET_SPECS) as OpenSCADPreset[])(
    "preset %s returns command='openscad'",
    (preset) => {
      const cmd = buildOpenSCADArgs(makeReq({ preset, outputPath: `out.${OPENSCAD_PRESET_SPECS[preset].outputExt}` }));
      expect(cmd.command).toBe("openscad");
    },
  );

  test.each(Object.keys(OPENSCAD_PRESET_SPECS) as OpenSCADPreset[])(
    "preset %s includes -o flag",
    (preset) => {
      const cmd = buildOpenSCADArgs(makeReq({ preset, outputPath: `out.${OPENSCAD_PRESET_SPECS[preset].outputExt}` }));
      expect(cmd.args).toContain("-o");
    },
  );

  test.each(Object.keys(OPENSCAD_PRESET_SPECS) as OpenSCADPreset[])(
    "preset %s has input path as last arg",
    (preset) => {
      const req = makeReq({ preset, outputPath: `out.${OPENSCAD_PRESET_SPECS[preset].outputExt}` });
      const cmd = buildOpenSCADArgs(req);
      expect(cmd.args[cmd.args.length - 1]).toBe(req.inputPath);
    },
  );

  test("stl-print-ready includes --render", () => {
    const cmd = buildOpenSCADArgs(makeReq({ preset: "stl-print-ready" }));
    expect(cmd.args).toContain("--render");
  });

  test("png-preview includes --preview and --viewall", () => {
    const cmd = buildOpenSCADArgs(makeReq({ preset: "png-preview", outputPath: "out.png" }));
    expect(cmd.args).toContain("--preview");
    expect(cmd.args).toContain("--viewall");
  });

  test("png-preview does NOT include --render", () => {
    const cmd = buildOpenSCADArgs(makeReq({ preset: "png-preview", outputPath: "out.png" }));
    expect(cmd.args).not.toContain("--render");
  });

  test("base args are always present", () => {
    const cmd = buildOpenSCADArgs(makeReq());
    const baseArgs = buildOpenSCADBaseArgs();
    for (const arg of baseArgs) {
      expect(cmd.args).toContain(arg);
    }
  });

  test("standard quality injects $fn=32", () => {
    const cmd = buildOpenSCADArgs(makeReq({ quality: "standard" }));
    expect(cmd.args).toContain("-D");
    expect(cmd.args).toContain("$fn=32");
  });

  test("draft quality injects $fn=16", () => {
    const cmd = buildOpenSCADArgs(makeReq({ quality: "draft" }));
    expect(cmd.args).toContain("$fn=16");
  });

  test("high quality injects $fn=64", () => {
    const cmd = buildOpenSCADArgs(makeReq({ quality: "high" }));
    expect(cmd.args).toContain("$fn=64");
  });

  test("user variables are injected as -D key=value", () => {
    const cmd = buildOpenSCADArgs(makeReq({
      variables: { width: 10, height: 20, label: "test" },
    }));
    expect(cmd.args).toContain("width=10");
    expect(cmd.args).toContain("height=20");
    expect(cmd.args).toContain("label=test");
    // Each variable gets a -D prefix
    const dCount = cmd.args.filter((a) => a === "-D").length;
    // $fn + 3 user variables = 4 -D flags
    expect(dCount).toBe(4);
  });

  test("no variables → only $fn injected", () => {
    const cmd = buildOpenSCADArgs(makeReq());
    const dCount = cmd.args.filter((a) => a === "-D").length;
    expect(dCount).toBe(1); // just $fn
  });

  test("output path follows -o flag", () => {
    const cmd = buildOpenSCADArgs(makeReq({ outputPath: "/out/result.stl" }));
    const oIdx = cmd.args.indexOf("-o");
    expect(cmd.args[oIdx + 1]).toBe("/out/result.stl");
  });
});

// ── PresetSpec ───────────────────────────────────────────────────

describe("OPENSCAD_PRESET_SPECS", () => {
  test("has exactly 5 presets", () => {
    expect(Object.keys(OPENSCAD_PRESET_SPECS)).toHaveLength(5);
  });

  test("3mf-color is premium with stl-print-ready fallback", () => {
    const spec = OPENSCAD_PRESET_SPECS["3mf-color"];
    expect(spec.isPremium).toBe(true);
    expect(spec.fallbackTo).toBe("stl-print-ready");
  });

  test("all guaranteed presets have fallbackTo=null", () => {
    const guaranteed = Object.entries(OPENSCAD_PRESET_SPECS)
      .filter(([, s]) => !s.isPremium);
    expect(guaranteed).toHaveLength(4);
    for (const [, spec] of guaranteed) {
      expect(spec.fallbackTo).toBeNull();
    }
  });

  test("all presets have positive estimatedSteps", () => {
    for (const spec of Object.values(OPENSCAD_PRESET_SPECS)) {
      expect(spec.estimatedSteps).toBeGreaterThan(0);
    }
  });
});

// ── qualityToFn ──────────────────────────────────────────────────

describe("qualityToFn", () => {
  test("draft → 16", () => expect(qualityToFn("draft")).toBe(16));
  test("standard → 32", () => expect(qualityToFn("standard")).toBe(32));
  test("high → 64", () => expect(qualityToFn("high")).toBe(64));
});

// ── Progress parser ──────────────────────────────────────────────

describe("isOpenSCADStepLine", () => {
  test("recognizes 'Compiling design...'", () => {
    expect(isOpenSCADStepLine("Compiling design (AST generation)...")).toBe(true);
  });

  test("recognizes 'Rendering...'", () => {
    expect(isOpenSCADStepLine("Rendering...")).toBe(true);
  });

  test("recognizes 'Geometries in cache: 42'", () => {
    expect(isOpenSCADStepLine("Geometries in cache: 42")).toBe(true);
  });

  test("recognizes 'Facets: 1280'", () => {
    expect(isOpenSCADStepLine("Facets:         1280")).toBe(true);
  });

  test("recognizes '...rendering complete.'", () => {
    expect(isOpenSCADStepLine("...rendering complete.")).toBe(true);
  });

  test("ignores unrelated output", () => {
    expect(isOpenSCADStepLine("Top level object is a 3D object:")).toBe(false);
  });

  test("ignores empty string", () => {
    expect(isOpenSCADStepLine("")).toBe(false);
  });
});

describe("extractOpenSCADPercent", () => {
  test("extracts '50%'", () => {
    expect(extractOpenSCADPercent("Progress: 50%")).toBe(50);
  });

  test("extracts '100%'", () => {
    expect(extractOpenSCADPercent("100% complete")).toBe(100);
  });

  test("extracts '0%'", () => {
    expect(extractOpenSCADPercent("0% started")).toBe(0);
  });

  test("returns null for no percent", () => {
    expect(extractOpenSCADPercent("Rendering...")).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(extractOpenSCADPercent("")).toBeNull();
  });
});

describe("calculateOpenSCADPercent", () => {
  test("0/7 → 0", () => expect(calculateOpenSCADPercent(0, 7)).toBe(0));
  test("3/7 → 42", () => expect(calculateOpenSCADPercent(3, 7)).toBe(42));
  test("7/7 → 99 (capped)", () => expect(calculateOpenSCADPercent(7, 7)).toBe(99));
  test("10/7 → 99 (capped)", () => expect(calculateOpenSCADPercent(10, 7)).toBe(99));
  test("0 steps → 0", () => expect(calculateOpenSCADPercent(5, 0)).toBe(0));
});

// ── Output estimation ────────────────────────────────────────────

describe("estimateOpenSCADOutputBytes", () => {
  test("stl-print-ready uses 8× multiplier", () => {
    expect(estimateOpenSCADOutputBytes(1000, "stl-print-ready")).toBe(8000);
  });

  test("3mf-color uses 10× multiplier", () => {
    expect(estimateOpenSCADOutputBytes(1000, "3mf-color")).toBe(10000);
  });

  test("png-preview uses 2× multiplier", () => {
    expect(estimateOpenSCADOutputBytes(1000, "png-preview")).toBe(2000);
  });

  test("dxf-2d uses 3× multiplier", () => {
    expect(estimateOpenSCADOutputBytes(1000, "dxf-2d")).toBe(3000);
  });

  test("obj-mesh uses 6× multiplier", () => {
    expect(estimateOpenSCADOutputBytes(1000, "obj-mesh")).toBe(6000);
  });
});

// ── Dangerous construct detection ────────────────────────────────

describe("checkOpenSCADDangerousConstructs", () => {
  test("clean source returns no warnings", () => {
    expect(checkOpenSCADDangerousConstructs("cube([10,10,10]);")).toHaveLength(0);
  });

  test("detects import()", () => {
    const warns = checkOpenSCADDangerousConstructs('import("/etc/passwd");');
    expect(warns.length).toBeGreaterThan(0);
  });

  test("detects surface()", () => {
    const warns = checkOpenSCADDangerousConstructs('surface(file="/data/heights.dat");');
    expect(warns.length).toBeGreaterThan(0);
  });

  test("detects include <file>", () => {
    const warns = checkOpenSCADDangerousConstructs("include <../../secret.scad>");
    expect(warns.length).toBeGreaterThan(0);
  });

  test("detects use <file>", () => {
    const warns = checkOpenSCADDangerousConstructs("use <../lib/utils.scad>");
    expect(warns.length).toBeGreaterThan(0);
  });

  test("detects multiple dangerous constructs", () => {
    const warns = checkOpenSCADDangerousConstructs(
      'import("file.stl");\nuse <lib.scad>\nsurface(file="h.dat");',
    );
    expect(warns.length).toBe(3);
  });
});

// ── Schema validation ────────────────────────────────────────────

describe("RenderModelSchema", () => {
  test("defaults quality to standard", () => {
    const req = RenderModelSchema.parse({
      inputPath: "test.scad",
      outputPath: "out.stl",
      preset: "stl-print-ready",
    });
    expect(req.quality).toBe("standard");
  });

  test("defaults timeoutSeconds to 900", () => {
    const req = RenderModelSchema.parse({
      inputPath: "test.scad",
      outputPath: "out.stl",
      preset: "stl-print-ready",
    });
    expect(req.timeoutSeconds).toBe(900);
  });

  test("accepts variables record", () => {
    const req = RenderModelSchema.parse({
      inputPath: "test.scad",
      outputPath: "out.stl",
      preset: "stl-print-ready",
      variables: { width: 42, label: "hello" },
    });
    expect(req.variables).toEqual({ width: 42, label: "hello" });
  });

  test("rejects empty inputPath", () => {
    expect(() =>
      RenderModelSchema.parse({
        inputPath: "",
        outputPath: "out.stl",
        preset: "stl-print-ready",
      }),
    ).toThrow();
  });

  test("rejects invalid preset", () => {
    expect(() =>
      RenderModelSchema.parse({
        inputPath: "test.scad",
        outputPath: "out.stl",
        preset: "not-a-preset",
      }),
    ).toThrow();
  });
});
