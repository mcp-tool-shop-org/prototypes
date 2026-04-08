import { describe, it, expect } from "vitest";
import { buildGDALArgs } from "./build-args.js";
import {
  GDAL_PRESET_SPECS,
  buildGDALBaseArgs,
} from "./preset-spec.js";
import {
  isGDALStepLine,
  extractGDALPercent,
  calculateGDALPercent,
} from "./progress.js";
import {
  estimateGDALOutputBytes,
  checkGDALFormatCompatibility,
  isRasterExt,
  isVectorExt,
} from "./preflight.js";
import type { TransformGeo, GDALPreset } from "./schemas.js";

// ── buildGDALArgs golden tests ──────────────────────────────────

describe("buildGDALArgs", () => {
  const ALL_PRESETS = Object.keys(GDAL_PRESET_SPECS) as GDALPreset[];

  it.each(ALL_PRESETS)("preset %s produces correct command", (preset) => {
    const req: TransformGeo = {
      inputPath: "in.tif",
      outputPath: `out.${GDAL_PRESET_SPECS[preset].outputExt}`,
      preset,
      quality: "standard",
      bbox: preset === "clip-raster" ? [1, 2, 3, 4] : undefined,
      maxOutputBytes: 0,
      timeoutSeconds: 600,
    };

    const result = buildGDALArgs(req);

    // Command must match spec
    expect(result.command).toBe(GDAL_PRESET_SPECS[preset].command);

    // Args must contain base args (-q)
    for (const baseArg of buildGDALBaseArgs()) {
      expect(result.args).toContain(baseArg);
    }

    // Input and output paths must be resolved
    expect(result.args).toContain("in.tif");
    expect(result.args).toContain(
      `out.${GDAL_PRESET_SPECS[preset].outputExt}`,
    );

    // No unresolved placeholders
    for (const arg of result.args) {
      expect(arg).not.toContain("$INPUT");
      expect(arg).not.toContain("$OUTPUT");
      expect(arg).not.toContain("$BBOX");
    }
  });

  it("clip-raster expands $BBOX as 4 separate numeric args", () => {
    const req: TransformGeo = {
      inputPath: "raster.tif",
      outputPath: "clipped.tif",
      preset: "clip-raster",
      quality: "standard",
      bbox: [-122.5, 37.0, -121.5, 38.0],
      maxOutputBytes: 0,
      timeoutSeconds: 600,
    };

    const result = buildGDALArgs(req);

    // -te must be followed by 4 numeric strings
    const teIdx = result.args.indexOf("-te");
    expect(teIdx).toBeGreaterThanOrEqual(0);
    expect(result.args[teIdx + 1]).toBe("-122.5");
    expect(result.args[teIdx + 2]).toBe("37");
    expect(result.args[teIdx + 3]).toBe("-121.5");
    expect(result.args[teIdx + 4]).toBe("38");
  });

  it("clip-raster without bbox omits $BBOX entirely", () => {
    const req: TransformGeo = {
      inputPath: "raster.tif",
      outputPath: "out.tif",
      preset: "clip-raster",
      quality: "standard",
      maxOutputBytes: 0,
      timeoutSeconds: 600,
    };

    const result = buildGDALArgs(req);

    // -te should be present but no bbox values after it
    const teIdx = result.args.indexOf("-te");
    expect(teIdx).toBeGreaterThanOrEqual(0);
    // Next arg after -te should be -co (not a number)
    expect(result.args[teIdx + 1]).toBe("-co");
  });

  it("ogr2ogr presets have output before input (GDAL convention)", () => {
    const req: TransformGeo = {
      inputPath: "data.shp",
      outputPath: "data.geojson",
      preset: "vector-geojson",
      quality: "standard",
      maxOutputBytes: 0,
      timeoutSeconds: 600,
    };

    const result = buildGDALArgs(req);
    const outIdx = result.args.indexOf("data.geojson");
    const inIdx = result.args.indexOf("data.shp");
    expect(outIdx).toBeLessThan(inIdx);
  });

  it("gdalwarp presets have input before output", () => {
    const req: TransformGeo = {
      inputPath: "data.tif",
      outputPath: "reprojected.tif",
      preset: "raster-wgs84-tiff",
      quality: "standard",
      maxOutputBytes: 0,
      timeoutSeconds: 600,
    };

    const result = buildGDALArgs(req);
    const inIdx = result.args.indexOf("data.tif");
    const outIdx = result.args.indexOf("reprojected.tif");
    expect(inIdx).toBeLessThan(outIdx);
  });

  it("appends --quality override for non-standard tiers", () => {
    const req: TransformGeo = {
      inputPath: "in.tif",
      outputPath: "out.tif",
      preset: "raster-wgs84-tiff",
      quality: "high",
      maxOutputBytes: 0,
      timeoutSeconds: 600,
    };

    const result = buildGDALArgs(req);
    expect(result.args).toContain("--quality=high");
  });

  it("does NOT append --quality for standard tier", () => {
    const req: TransformGeo = {
      inputPath: "in.tif",
      outputPath: "out.tif",
      preset: "raster-wgs84-tiff",
      quality: "standard",
      maxOutputBytes: 0,
      timeoutSeconds: 600,
    };

    const result = buildGDALArgs(req);
    expect(result.args.some((a) => a.startsWith("--quality="))).toBe(false);
  });
});

// ── Preset spec invariants ───────────────────────────────────────

describe("GDAL_PRESET_SPECS", () => {
  it("every preset has a positive estimatedSteps", () => {
    for (const [name, spec] of Object.entries(GDAL_PRESET_SPECS)) {
      expect(spec.estimatedSteps, `${name}.estimatedSteps`).toBeGreaterThan(0);
    }
  });

  it("non-premium presets have no fallback", () => {
    for (const [name, spec] of Object.entries(GDAL_PRESET_SPECS)) {
      if (!spec.isPremium) {
        expect(spec.fallbackTo, `${name}.fallbackTo`).toBeNull();
      }
    }
  });

  it("premium presets have a valid fallback", () => {
    for (const [name, spec] of Object.entries(GDAL_PRESET_SPECS)) {
      if (spec.isPremium) {
        expect(
          spec.fallbackTo,
          `${name}.fallbackTo`,
        ).not.toBeNull();
        expect(
          Object.keys(GDAL_PRESET_SPECS),
          `${name}.fallbackTo points to valid preset`,
        ).toContain(spec.fallbackTo);
      }
    }
  });

  it("clip-raster premium has fallback to raster-wgs84-tiff", () => {
    expect(GDAL_PRESET_SPECS["clip-raster"].fallbackTo).toBe(
      "raster-wgs84-tiff",
    );
    expect(GDAL_PRESET_SPECS["clip-raster"].isPremium).toBe(true);
  });

  it("every preset argsTemplate contains $INPUT and $OUTPUT", () => {
    for (const [name, spec] of Object.entries(GDAL_PRESET_SPECS)) {
      expect(spec.argsTemplate, `${name} $INPUT`).toContain("$INPUT");
      expect(spec.argsTemplate, `${name} $OUTPUT`).toContain("$OUTPUT");
    }
  });

  it("every preset has a non-empty outputExt", () => {
    for (const [name, spec] of Object.entries(GDAL_PRESET_SPECS)) {
      expect(spec.outputExt.length, `${name}.outputExt`).toBeGreaterThan(0);
    }
  });
});

// ── Progress parser ──────────────────────────────────────────────

describe("gdal progress", () => {
  it("isGDALStepLine recognizes processing keywords", () => {
    expect(isGDALStepLine("status", "Processing layer roads")).toBe(true);
    expect(isGDALStepLine("info", "translating raster")).toBe(true);
    expect(isGDALStepLine("info", "warping input")).toBe(true);
    expect(isGDALStepLine("info", "creating output file")).toBe(true);
    expect(isGDALStepLine("info", "writing tiles")).toBe(true);
    expect(isGDALStepLine("status", "done.")).toBe(true);
  });

  it("isGDALStepLine rejects non-step lines", () => {
    expect(isGDALStepLine("debug", "trace output")).toBe(false);
    expect(isGDALStepLine("memory", "allocated 4096")).toBe(false);
    expect(isGDALStepLine("version", "GDAL 3.8.0")).toBe(false);
  });

  it("extractGDALPercent extracts from 0...10...20... pattern", () => {
    expect(extractGDALPercent("progress", "0...10...20...30")).toBe(0);
    expect(extractGDALPercent("progress", "50...60...70")).toBe(50);
    expect(extractGDALPercent("progress", "100 - done.")).toBe(100);
  });

  it("extractGDALPercent returns null for non-percent lines", () => {
    expect(extractGDALPercent("info", "Processing layer")).toBeNull();
    expect(extractGDALPercent("debug", "no numbers here")).toBeNull();
  });

  it("calculateGDALPercent clamps to 0-99", () => {
    expect(calculateGDALPercent(0, 10)).toBe(0);
    expect(calculateGDALPercent(5, 10)).toBe(50);
    expect(calculateGDALPercent(10, 10)).toBe(99); // capped at 99
    expect(calculateGDALPercent(15, 10)).toBe(99); // over-step
    expect(calculateGDALPercent(0, 0)).toBe(0);    // zero steps
  });
});

// ── Preflight helpers ────────────────────────────────────────────

describe("preflight helpers", () => {
  it("estimateGDALOutputBytes applies correct expansion factors", () => {
    const inputSize = 10_000;

    expect(estimateGDALOutputBytes(inputSize, "raster-wgs84-tiff")).toBe(
      Math.ceil(inputSize * 1.4),
    );
    expect(estimateGDALOutputBytes(inputSize, "vector-geojson")).toBe(
      Math.ceil(inputSize * 1.2),
    );
    expect(estimateGDALOutputBytes(inputSize, "raster-to-png")).toBe(
      Math.ceil(inputSize * 0.8),
    );
    expect(estimateGDALOutputBytes(inputSize, "vector-shapefile")).toBe(
      Math.ceil(inputSize * 1.1),
    );
    expect(estimateGDALOutputBytes(inputSize, "clip-raster")).toBe(
      Math.ceil(inputSize * 0.6),
    );
  });

  it("checkGDALFormatCompatibility rejects raster preset with vector input", () => {
    const result = checkGDALFormatCompatibility(".geojson", "raster-wgs84-tiff");
    expect(result.ok).toBe(false);
    expect(result.warning).toContain("raster");
    expect(result.warning).toContain("vector");
  });

  it("checkGDALFormatCompatibility rejects vector preset with raster input", () => {
    const result = checkGDALFormatCompatibility(".tif", "vector-geojson");
    expect(result.ok).toBe(false);
    expect(result.warning).toContain("vector");
    expect(result.warning).toContain("raster");
  });

  it("checkGDALFormatCompatibility accepts raster preset with raster input", () => {
    const result = checkGDALFormatCompatibility(".tif", "raster-wgs84-tiff");
    expect(result.ok).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  it("checkGDALFormatCompatibility accepts vector preset with vector input", () => {
    const result = checkGDALFormatCompatibility(".shp", "vector-geojson");
    expect(result.ok).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  it("isRasterExt recognizes raster formats", () => {
    expect(isRasterExt(".tif")).toBe(true);
    expect(isRasterExt(".tiff")).toBe(true);
    expect(isRasterExt(".png")).toBe(true);
    expect(isRasterExt(".geojson")).toBe(false);
  });

  it("isVectorExt recognizes vector formats", () => {
    expect(isVectorExt(".geojson")).toBe(true);
    expect(isVectorExt(".shp")).toBe(true);
    expect(isVectorExt(".gpkg")).toBe(true);
    expect(isVectorExt(".tif")).toBe(false);
  });
});
