import { describe, it, expect } from "vitest";
import { buildFreeCADArgs } from "./build-args.js";
import {
  FREECAD_PRESET_SPECS,
  buildFreeCADBaseArgs,
  type FreeCADPresetSpec,
} from "./preset-spec.js";
import {
  isFreeCADStepLine,
  calculateFreeCADPercent,
} from "./progress.js";
import {
  estimateFreeCADOutputBytes,
  checkFreeCADFormatCompatibility,
} from "./preflight.js";
import type { ExportPart, FreeCADPreset } from "./schemas.js";

// ── buildFreeCADArgs golden tests ────────────────────────────────

describe("buildFreeCADArgs", () => {
  const ALL_PRESETS = Object.keys(FREECAD_PRESET_SPECS) as FreeCADPreset[];

  it.each(ALL_PRESETS)("preset %s produces correct safe args", (preset) => {
    const req: ExportPart = {
      inputPath: "model.FCStd",
      outputPath: `out.${FREECAD_PRESET_SPECS[preset].outputExt}`,
      preset,
      quality: "standard",
      maxOutputBytes: 0,
      timeoutSeconds: 1800,
    };

    const args = buildFreeCADArgs(req);

    // Must contain base args (--headless, --no-gui, -c)
    for (const baseArg of buildFreeCADBaseArgs()) {
      expect(args).toContain(baseArg);
    }

    // Python expression must have input/output substituted
    const pythonArg = args[args.indexOf("-c") + 1];
    expect(pythonArg).toContain("model.FCStd");
    expect(pythonArg).toContain(
      `out.${FREECAD_PRESET_SPECS[preset].outputExt}`,
    );

    // Python must NOT contain any dangerous patterns
    expect(pythonArg).not.toContain("exec");
    expect(pythonArg).not.toContain("eval(");
    expect(pythonArg).not.toContain("os.system");
    expect(pythonArg).not.toContain("subprocess");

    // Placeholders must be fully resolved
    expect(pythonArg).not.toContain("$INPUT");
    expect(pythonArg).not.toContain("$OUTPUT");
  });

  it("appends quality flag when preset has one", () => {
    const req: ExportPart = {
      inputPath: "model.FCStd",
      outputPath: "out.stl",
      preset: "stl-print-ready",
      quality: "standard",
      maxOutputBytes: 0,
      timeoutSeconds: 1800,
    };

    const args = buildFreeCADArgs(req);
    expect(args).toContain("--mesh-repair");
  });

  it("omits empty quality flag", () => {
    const req: ExportPart = {
      inputPath: "model.FCStd",
      outputPath: "out.obj",
      preset: "obj-mesh",
      quality: "standard",
      maxOutputBytes: 0,
      timeoutSeconds: 1800,
    };

    const args = buildFreeCADArgs(req);
    // obj-mesh has empty qualityFlag
    expect(args.filter((a) => a === "")).toHaveLength(0);
  });

  it("appends --quality override for non-standard tiers", () => {
    const req: ExportPart = {
      inputPath: "model.FCStd",
      outputPath: "out.stl",
      preset: "stl-print-ready",
      quality: "high",
      maxOutputBytes: 0,
      timeoutSeconds: 1800,
    };

    const args = buildFreeCADArgs(req);
    expect(args).toContain("--quality=high");
  });

  it("does NOT append --quality for standard tier", () => {
    const req: ExportPart = {
      inputPath: "model.FCStd",
      outputPath: "out.step",
      preset: "step-precision",
      quality: "standard",
      maxOutputBytes: 0,
      timeoutSeconds: 1800,
    };

    const args = buildFreeCADArgs(req);
    expect(args.some((a) => a.startsWith("--quality="))).toBe(false);
  });
});

// ── Preset spec invariants ───────────────────────────────────────

describe("FREECAD_PRESET_SPECS", () => {
  it("every preset has a positive estimatedSteps", () => {
    for (const [name, spec] of Object.entries(FREECAD_PRESET_SPECS)) {
      expect(spec.estimatedSteps, `${name}.estimatedSteps`).toBeGreaterThan(0);
    }
  });

  it("non-premium presets have no fallback", () => {
    for (const [name, spec] of Object.entries(FREECAD_PRESET_SPECS)) {
      if (!spec.isPremium) {
        expect(spec.fallbackTo, `${name}.fallbackTo`).toBeNull();
      }
    }
  });

  it("premium presets have a valid fallback", () => {
    for (const [name, spec] of Object.entries(FREECAD_PRESET_SPECS)) {
      if (spec.isPremium) {
        expect(
          spec.fallbackTo,
          `${name}.fallbackTo`,
        ).not.toBeNull();
        expect(
          Object.keys(FREECAD_PRESET_SPECS),
          `${name}.fallbackTo points to valid preset`,
        ).toContain(spec.fallbackTo);
      }
    }
  });

  it("3mf premium has fallback to stl-print-ready", () => {
    expect(FREECAD_PRESET_SPECS["3mf-slicer-ready"].fallbackTo).toBe(
      "stl-print-ready",
    );
    expect(FREECAD_PRESET_SPECS["3mf-slicer-ready"].isPremium).toBe(true);
  });

  it("every preset has a non-empty pythonExpr", () => {
    for (const [name, spec] of Object.entries(FREECAD_PRESET_SPECS)) {
      expect(spec.pythonExpr.length, `${name}.pythonExpr`).toBeGreaterThan(10);
    }
  });

  it("every preset pythonExpr contains $INPUT and $OUTPUT placeholders", () => {
    for (const [name, spec] of Object.entries(FREECAD_PRESET_SPECS)) {
      expect(spec.pythonExpr, `${name} $INPUT`).toContain("$INPUT");
      expect(spec.pythonExpr, `${name} $OUTPUT`).toContain("$OUTPUT");
    }
  });
});

// ── Progress parser ──────────────────────────────────────────────

describe("freecad progress", () => {
  it("isFreeCADStepLine recognizes processing keywords", () => {
    expect(isFreeCADStepLine("status", "Exporting STL mesh")).toBe(true);
    expect(isFreeCADStepLine("Mesh", "processing body 1/3")).toBe(true);
    expect(isFreeCADStepLine("info", "tessellating faces")).toBe(true);
    expect(isFreeCADStepLine("info", "converting geometry")).toBe(true);
    expect(isFreeCADStepLine("info", "writing output file")).toBe(true);
    expect(isFreeCADStepLine("status", "Done exporting")).toBe(true);
  });

  it("isFreeCADStepLine rejects non-step lines", () => {
    expect(isFreeCADStepLine("debug", "trace output")).toBe(false);
    expect(isFreeCADStepLine("memory", "allocated 4096")).toBe(false);
    expect(isFreeCADStepLine("version", "0.21.0")).toBe(false);
  });

  it("calculateFreeCADPercent clamps to 0-99", () => {
    expect(calculateFreeCADPercent(0, 10)).toBe(0);
    expect(calculateFreeCADPercent(5, 10)).toBe(50);
    expect(calculateFreeCADPercent(10, 10)).toBe(99); // capped at 99
    expect(calculateFreeCADPercent(15, 10)).toBe(99); // over-step
    expect(calculateFreeCADPercent(0, 0)).toBe(0);    // zero steps
  });
});

// ── Preflight helpers ────────────────────────────────────────────

describe("preflight helpers", () => {
  it("estimateFreeCADOutputBytes applies correct expansion factors", () => {
    const inputSize = 10_000;

    // stl-print-ready → STL → factor 1.5
    expect(estimateFreeCADOutputBytes(inputSize, "stl-print-ready")).toBe(
      Math.ceil(inputSize * 1.5),
    );
    // step-precision → STEP → factor 0.9
    expect(estimateFreeCADOutputBytes(inputSize, "step-precision")).toBe(
      Math.ceil(inputSize * 0.9),
    );
    // glb-web-ready → GLB → factor 0.8
    expect(estimateFreeCADOutputBytes(inputSize, "glb-web-ready")).toBe(
      Math.ceil(inputSize * 0.8),
    );
    // 3mf-slicer-ready → 3MF → factor 1.8
    expect(estimateFreeCADOutputBytes(inputSize, "3mf-slicer-ready")).toBe(
      Math.ceil(inputSize * 1.8),
    );
    // obj-mesh → OBJ → factor 1.3
    expect(estimateFreeCADOutputBytes(inputSize, "obj-mesh")).toBe(
      Math.ceil(inputSize * 1.3),
    );
  });

  it("checkFreeCADFormatCompatibility warns on parametric → mesh", () => {
    const result = checkFreeCADFormatCompatibility(true, "STL");
    expect(result.ok).toBe(true);
    expect(result.warning).toContain("parametric");
    expect(result.warning).toContain("STL");
  });

  it("checkFreeCADFormatCompatibility no warning for parametric → STEP", () => {
    const result = checkFreeCADFormatCompatibility(true, "STEP");
    expect(result.ok).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  it("checkFreeCADFormatCompatibility no warning for non-parametric → STL", () => {
    const result = checkFreeCADFormatCompatibility(false, "STL");
    expect(result.ok).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  it("checkFreeCADFormatCompatibility warns on parametric → OBJ and GLB", () => {
    expect(checkFreeCADFormatCompatibility(true, "OBJ").warning).toContain(
      "parametric",
    );
    expect(checkFreeCADFormatCompatibility(true, "GLB").warning).toContain(
      "parametric",
    );
  });
});
