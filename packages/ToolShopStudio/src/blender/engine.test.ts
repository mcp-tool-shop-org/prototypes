import { describe, test, expect } from "vitest";
import { buildBlenderArgs } from "./build-args.js";
import type { BlenderCommandArgs } from "./build-args.js";
import {
  BLENDER_PRESET_SPECS,
  buildBlenderBaseArgs,
  qualityToSamples,
} from "./preset-spec.js";
import type { BlenderPreset, RenderBlend } from "./schemas.js";
import { RenderBlendSchema } from "./schemas.js";
import {
  estimateBlenderOutputBytes,
  checkBlenderDangerousConstructs,
  validateBlenderPresetSafety,
  assertBlenderRenderOutput,
} from "./preflight.js";
import {
  isBlenderStepLine,
  extractBlenderPercent,
  calculateBlenderPercent,
} from "./progress.js";

// ── Helper ───────────────────────────────────────────────────────

function makeReq(overrides: Partial<RenderBlend> = {}): RenderBlend {
  return RenderBlendSchema.parse({
    inputPath: "/sandbox/user/smoke/test.blend",
    outputPath: "/sandbox/user/smoke/out.png",
    preset: "png-preview",
    ...overrides,
  });
}

// ── buildBlenderArgs ─────────────────────────────────────────────

describe("buildBlenderArgs", () => {
  test.each(Object.keys(BLENDER_PRESET_SPECS) as BlenderPreset[])(
    "preset %s returns command='blender'",
    (preset) => {
      const spec = BLENDER_PRESET_SPECS[preset];
      const cmd = buildBlenderArgs(makeReq({ preset, outputPath: `out.${spec.outputExt}` }));
      expect(cmd.command).toBe("blender");
    },
  );

  test.each(Object.keys(BLENDER_PRESET_SPECS) as BlenderPreset[])(
    "preset %s includes base args (-b, -noaudio)",
    (preset) => {
      const spec = BLENDER_PRESET_SPECS[preset];
      const cmd = buildBlenderArgs(makeReq({ preset, outputPath: `out.${spec.outputExt}` }));
      expect(cmd.args).toContain("-b");
      expect(cmd.args).toContain("-noaudio");
    },
  );

  test.each(Object.keys(BLENDER_PRESET_SPECS) as BlenderPreset[])(
    "preset %s includes input path",
    (preset) => {
      const spec = BLENDER_PRESET_SPECS[preset];
      const req = makeReq({ preset, outputPath: `out.${spec.outputExt}` });
      const cmd = buildBlenderArgs(req);
      expect(cmd.args).toContain(req.inputPath);
    },
  );

  test.each(Object.keys(BLENDER_PRESET_SPECS) as BlenderPreset[])(
    "preset %s includes --scene",
    (preset) => {
      const spec = BLENDER_PRESET_SPECS[preset];
      const cmd = buildBlenderArgs(makeReq({ preset, outputPath: `out.${spec.outputExt}` }));
      expect(cmd.args).toContain("--scene");
      expect(cmd.args).toContain("Scene");
    },
  );

  test("png-preview uses BLENDER_WORKBENCH engine", () => {
    const cmd = buildBlenderArgs(makeReq({ preset: "png-preview" }));
    expect(cmd.args).toContain("--engine");
    expect(cmd.args).toContain("BLENDER_WORKBENCH");
  });

  test("cycles-render uses CYCLES engine", () => {
    const cmd = buildBlenderArgs(makeReq({ preset: "cycles-render" }));
    expect(cmd.args).toContain("--engine");
    expect(cmd.args).toContain("CYCLES");
  });

  test("glb-export includes --python-expr with $OUTPUT substituted", () => {
    const cmd = buildBlenderArgs(makeReq({
      preset: "glb-export",
      outputPath: "/sandbox/out.glb",
    }));
    expect(cmd.args).toContain("--python-expr");
    const exprIdx = cmd.args.indexOf("--python-expr");
    // The first --python-expr is for the export (not quality)
    // Find the one with bpy.ops
    const pythonExprs = cmd.args.filter((_, i) => i > 0 && cmd.args[i - 1] === "--python-expr");
    const exportExpr = pythonExprs.find((e) => e.includes("bpy.ops"));
    expect(exportExpr).toBeDefined();
    expect(exportExpr).toContain("/sandbox/out.glb");
    expect(exportExpr).not.toContain("$OUTPUT");
  });

  test("stl-from-mesh includes --python-expr with $OUTPUT substituted", () => {
    const cmd = buildBlenderArgs(makeReq({
      preset: "stl-from-mesh",
      outputPath: "/sandbox/out.stl",
    }));
    const pythonExprs = cmd.args.filter((_, i) => i > 0 && cmd.args[i - 1] === "--python-expr");
    const exportExpr = pythonExprs.find((e) => e.includes("bpy.ops"));
    expect(exportExpr).toBeDefined();
    expect(exportExpr).toContain("/sandbox/out.stl");
  });

  test("non-python presets include -o output flag", () => {
    const cmd = buildBlenderArgs(makeReq({ preset: "png-preview", outputPath: "/sandbox/out.png" }));
    expect(cmd.args).toContain("-o");
    expect(cmd.args).toContain("/sandbox/out.png");
  });

  test("python-expr presets do NOT include -o flag", () => {
    const cmd = buildBlenderArgs(makeReq({ preset: "glb-export", outputPath: "/sandbox/out.glb" }));
    expect(cmd.args).not.toContain("-o");
  });

  test("frame range added when frameStart != 1 or frameEnd != 1", () => {
    const cmd = buildBlenderArgs(makeReq({
      preset: "video-1080p",
      outputPath: "/sandbox/out.mp4",
      frameStart: 1,
      frameEnd: 120,
    }));
    expect(cmd.args).toContain("-s");
    expect(cmd.args).toContain("1");
    expect(cmd.args).toContain("-e");
    expect(cmd.args).toContain("120");
  });

  test("frame range omitted when both are 1", () => {
    const cmd = buildBlenderArgs(makeReq({ preset: "png-preview" }));
    expect(cmd.args).not.toContain("-s");
    expect(cmd.args).not.toContain("-e");
  });

  test("non-standard quality injects Cycles samples", () => {
    const cmd = buildBlenderArgs(makeReq({
      preset: "cycles-render",
      quality: "high",
    }));
    const pythonExprs = cmd.args.filter((_, i) => i > 0 && cmd.args[i - 1] === "--python-expr");
    const samplesExpr = pythonExprs.find((e) => e.includes("cycles.samples"));
    expect(samplesExpr).toBeDefined();
    expect(samplesExpr).toContain("1024");
  });

  test("standard quality does NOT inject Cycles samples", () => {
    const cmd = buildBlenderArgs(makeReq({
      preset: "cycles-render",
      quality: "standard",
    }));
    const pythonExprs = cmd.args.filter((_, i) => i > 0 && cmd.args[i - 1] === "--python-expr");
    const samplesExpr = pythonExprs.find((e) => e.includes("cycles.samples"));
    expect(samplesExpr).toBeUndefined();
  });

  test("video-1080p includes resolution flags", () => {
    const cmd = buildBlenderArgs(makeReq({
      preset: "video-1080p",
      outputPath: "/sandbox/out.mp4",
    }));
    expect(cmd.args).toContain("-x");
    expect(cmd.args).toContain("1920");
    expect(cmd.args).toContain("-y");
    expect(cmd.args).toContain("1080");
  });
});

// ── Preset specs ────────────────────────────────────────────────

describe("BLENDER_PRESET_SPECS", () => {
  test("has exactly 5 presets", () => {
    expect(Object.keys(BLENDER_PRESET_SPECS)).toHaveLength(5);
  });

  test("cycles-render is premium with fallback to png-preview", () => {
    expect(BLENDER_PRESET_SPECS["cycles-render"].isPremium).toBe(true);
    expect(BLENDER_PRESET_SPECS["cycles-render"].fallbackTo).toBe("png-preview");
  });

  test("all guaranteed presets have fallbackTo: null", () => {
    for (const [name, spec] of Object.entries(BLENDER_PRESET_SPECS)) {
      if (!spec.isPremium) {
        expect(spec.fallbackTo, `${name} should have null fallback`).toBeNull();
      }
    }
  });

  test("premium fallback references existing preset", () => {
    for (const [name, spec] of Object.entries(BLENDER_PRESET_SPECS)) {
      if (spec.isPremium && spec.fallbackTo) {
        expect(
          BLENDER_PRESET_SPECS[spec.fallbackTo as BlenderPreset],
          `${name} fallback '${spec.fallbackTo}' must exist`,
        ).toBeDefined();
      }
    }
  });
});

// ── Base args ───────────────────────────────────────────────────

describe("buildBlenderBaseArgs", () => {
  test("returns -b and -noaudio", () => {
    const args = buildBlenderBaseArgs();
    expect(args).toContain("-b");
    expect(args).toContain("-noaudio");
  });
});

// ── Quality mapping ─────────────────────────────────────────────

describe("qualityToSamples", () => {
  test("draft = 64", () => expect(qualityToSamples("draft")).toBe(64));
  test("standard = 256", () => expect(qualityToSamples("standard")).toBe(256));
  test("high = 1024", () => expect(qualityToSamples("high")).toBe(1024));
});

// ── Schema parsing ──────────────────────────────────────────────

describe("RenderBlendSchema", () => {
  test("parses minimal request with defaults", () => {
    const req = RenderBlendSchema.parse({
      inputPath: "test.blend",
      outputPath: "out.png",
      preset: "png-preview",
    });
    expect(req.scene).toBe("Scene");
    expect(req.frameStart).toBe(1);
    expect(req.frameEnd).toBe(1);
    expect(req.device).toBe("CPU");
    expect(req.quality).toBe("standard");
    expect(req.maxOutputBytes).toBe(0);
    expect(req.timeoutSeconds).toBe(1800);
  });

  test("rejects empty inputPath", () => {
    expect(() =>
      RenderBlendSchema.parse({ inputPath: "", outputPath: "out.png", preset: "png-preview" }),
    ).toThrow();
  });

  test("rejects invalid preset", () => {
    expect(() =>
      RenderBlendSchema.parse({ inputPath: "test.blend", outputPath: "out.png", preset: "nope" }),
    ).toThrow();
  });
});

// ── Output estimation ───────────────────────────────────────────

describe("estimateBlenderOutputBytes", () => {
  test("video-1080p has highest multiplier", () => {
    const video = estimateBlenderOutputBytes(100_000, "video-1080p");
    const png = estimateBlenderOutputBytes(100_000, "png-preview");
    expect(video).toBeGreaterThan(png);
  });

  test("all presets return positive value", () => {
    for (const preset of Object.keys(BLENDER_PRESET_SPECS) as BlenderPreset[]) {
      expect(estimateBlenderOutputBytes(50_000, preset)).toBeGreaterThan(0);
    }
  });
});

// ── Dangerous construct detection ───────────────────────────────

describe("checkBlenderDangerousConstructs", () => {
  test("safe bpy expression returns no warnings", () => {
    const warnings = checkBlenderDangerousConstructs(
      'import bpy; bpy.ops.export_scene.gltf(filepath="/out.glb")',
    );
    expect(warnings).toHaveLength(0);
  });

  test("detects os.system call", () => {
    const warnings = checkBlenderDangerousConstructs("os.system('rm -rf /')");
    expect(warnings.length).toBeGreaterThan(0);
  });

  test("detects subprocess", () => {
    const warnings = checkBlenderDangerousConstructs("subprocess.call(['ls'])");
    expect(warnings.length).toBeGreaterThan(0);
  });

  test("detects eval", () => {
    const warnings = checkBlenderDangerousConstructs("eval('1+1')");
    expect(warnings.length).toBeGreaterThan(0);
  });

  test("detects __import__", () => {
    const warnings = checkBlenderDangerousConstructs("__import__('os')");
    expect(warnings.length).toBeGreaterThan(0);
  });

  test("detects open()", () => {
    const warnings = checkBlenderDangerousConstructs("open('/etc/passwd')");
    expect(warnings.length).toBeGreaterThan(0);
  });

  test("detects socket", () => {
    const warnings = checkBlenderDangerousConstructs("import socket; socket.connect()");
    expect(warnings.length).toBeGreaterThan(0);
  });
});

// ── Preset safety validation ────────────────────────────────────

describe("validateBlenderPresetSafety", () => {
  test("all built-in presets pass safety check", () => {
    const warnings = validateBlenderPresetSafety();
    expect(warnings).toHaveLength(0);
  });
});

// ── Pure output assertion ───────────────────────────────────────

describe("assertBlenderRenderOutput", () => {
  test("valid PNG output passes", () => {
    const spec = BLENDER_PRESET_SPECS["png-preview"];
    const result = assertBlenderRenderOutput(spec, "/out/render.png", 50_000, 0);
    expect(result.ok).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  test("empty output fails", () => {
    const spec = BLENDER_PRESET_SPECS["png-preview"];
    const result = assertBlenderRenderOutput(spec, "/out/render.png", 0, 0);
    expect(result.ok).toBe(false);
  });

  test("wrong extension warns", () => {
    const spec = BLENDER_PRESET_SPECS["png-preview"];
    const result = assertBlenderRenderOutput(spec, "/out/render.jpg", 50_000, 0);
    expect(result.warnings.some((w) => w.includes("extension mismatch"))).toBe(true);
  });

  test("exceeds maxOutputBytes fails", () => {
    const spec = BLENDER_PRESET_SPECS["png-preview"];
    const result = assertBlenderRenderOutput(spec, "/out/render.png", 200_000, 100_000);
    expect(result.ok).toBe(false);
    expect(result.warnings.some((w) => w.includes("exceeds maxOutputBytes"))).toBe(true);
  });

  test("suspicious expansion warns", () => {
    const spec = BLENDER_PRESET_SPECS["png-preview"];
    const result = assertBlenderRenderOutput(spec, "/out/render.png", 2_100_000, 0, 100_000);
    expect(result.warnings.some((w) => w.includes("Suspicious expansion"))).toBe(true);
  });

  test("suspiciously small PNG warns", () => {
    const spec = BLENDER_PRESET_SPECS["png-preview"];
    const result = assertBlenderRenderOutput(spec, "/out/render.png", 50, 0);
    expect(result.warnings.some((w) => w.includes("suspiciously small"))).toBe(true);
  });
});

// ── Progress parser ─────────────────────────────────────────────

describe("isBlenderStepLine", () => {
  test("recognizes Fra: line", () => {
    expect(isBlenderStepLine("Fra:1 Mem:24.02M | Time:00:00.52 | Rendering 1 / 64 samples")).toBe(true);
  });

  test("recognizes Saved: line", () => {
    expect(isBlenderStepLine("Saved: '/tmp/output.png'")).toBe(true);
  });

  test("recognizes Blender quit", () => {
    expect(isBlenderStepLine("Blender quit")).toBe(true);
  });

  test("rejects empty line", () => {
    expect(isBlenderStepLine("")).toBe(false);
  });

  test("rejects random text", () => {
    expect(isBlenderStepLine("Hello world")).toBe(false);
  });
});

describe("extractBlenderPercent", () => {
  test("extracts from 'Rendered 16/32 tiles'", () => {
    expect(extractBlenderPercent("Rendered 16/32 tiles")).toBe(50);
  });

  test("extracts from 'Rendering 3 / 64 samples'", () => {
    expect(extractBlenderPercent("Rendering 3 / 64 samples")).toBe(4);
  });

  test("extracts from '75%'", () => {
    expect(extractBlenderPercent("Progress: 75%")).toBe(75);
  });

  test("clamps to 99", () => {
    expect(extractBlenderPercent("Rendered 64/64 tiles")).toBe(99);
  });

  test("returns null for no match", () => {
    expect(extractBlenderPercent("Read blend: model.blend")).toBeNull();
  });
});

describe("calculateBlenderPercent", () => {
  test("50% at midpoint", () => {
    expect(calculateBlenderPercent(5, 10)).toBe(50);
  });

  test("clamps to 99", () => {
    expect(calculateBlenderPercent(100, 10)).toBe(99);
  });

  test("0 for empty estimatedSteps", () => {
    expect(calculateBlenderPercent(5, 0)).toBe(0);
  });
});
