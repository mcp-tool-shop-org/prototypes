import { describe, it, expect } from "vitest";
import { validateRegistry, validateTool } from "./validate.js";
import {
  searchAllByPreset,
  searchByOutputExt,
  getPremiumPresetMap,
  getToolsByPattern,
} from "./search.js";
import {
  checkAllToolsHavePattern,
  getToolsMissingPattern,
  checkVersionConsistency,
  checkSharedPatternCoverage,
  getRegistrySummary,
  getToolVersion,
} from "./consistency.js";

// ── Registry engine golden tests ─────────────────────────────────

describe("validateRegistry", () => {
  // ── Test 1: full registry passes validation ────────────────────
  it("validates all five tools successfully", () => {
    expect(validateRegistry()).toBe(true);
  });

  // ── Test 2: single tool validation returns no errors ───────────
  it("validateTool returns empty errors for each registered tool", () => {
    for (const id of ["ffmpeg", "pandoc", "freecad", "gdal", "openscad"]) {
      expect(validateTool(id)).toEqual([]);
    }
  });

  // ── Test 3: unknown tool returns error ─────────────────────────
  it("validateTool returns error for unknown tool", () => {
    const errors = validateTool("nonexistent");
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain("not found");
  });
});

describe("searchAllByPreset", () => {
  // ── Test 4: shared preset name finds multiple tools ────────────
  it("finds stl-print-ready in both FreeCAD and OpenSCAD", () => {
    const results = searchAllByPreset("stl-print-ready");
    expect(results.length).toBe(2);
    const toolIds = results.map((r) => r.toolId);
    expect(toolIds).toContain("freecad");
    expect(toolIds).toContain("openscad");
  });

  // ── Test 5: unique preset name finds single tool ───────────────
  it("finds academic-pdf only in pandoc", () => {
    const results = searchAllByPreset("academic-pdf");
    expect(results).toHaveLength(1);
    expect(results[0]!.toolId).toBe("pandoc");
  });
});

describe("searchByOutputExt", () => {
  // ── Test 6: html extension matches pandoc presets ──────────────
  it("finds html presets across pandoc (blog-post, slides, newsletter)", () => {
    const results = searchByOutputExt("html");
    expect(results.length).toBeGreaterThanOrEqual(3);
    const pandocHits = results.filter((r) => r.toolId === "pandoc");
    expect(pandocHits.length).toBeGreaterThanOrEqual(3);
  });

  // ── Test 7: strips leading dot ─────────────────────────────────
  it("strips leading dot from extension", () => {
    const withDot = searchByOutputExt(".stl");
    const withoutDot = searchByOutputExt("stl");
    expect(withDot).toEqual(withoutDot);
  });
});

describe("getPremiumPresetMap", () => {
  // ── Test 8: returns grouped premium presets ────────────────────
  it("returns premium presets grouped by tool", () => {
    const map = getPremiumPresetMap();
    expect(map.openscad).toContain("3mf-color");
    expect(map.ffmpeg).toContain("yt-1080p-h265");
    expect(map.pandoc).toContain("newsletter");
    expect(map.freecad).toContain("3mf-slicer-ready");
    expect(map.gdal).toContain("clip-raster");
  });
});

describe("getToolsByPattern", () => {
  // ── Test 9: returns IDs for shared pattern ─────────────────────
  it("returns all 6 tool IDs for context DI pattern", () => {
    const ids = getToolsByPattern("context DI");
    expect(ids).toHaveLength(6);
  });
});

describe("consistency checks", () => {
  // ── Test 10: all tools share buildAndNotifyAsset ───────────────
  it("all tools have buildAndNotifyAsset pattern", () => {
    expect(checkAllToolsHavePattern("buildAndNotifyAsset")).toBe(true);
  });

  // ── Test 11: no tools missing shared patterns ──────────────────
  it("shared pattern coverage has no gaps", () => {
    expect(checkSharedPatternCoverage()).toEqual([]);
  });

  // ── Test 12: all tools share same version ──────────────────────
  it("all tools have consistent version", () => {
    const version = checkVersionConsistency();
    expect(version).toBe("1.7.0-toolshop");
  });

  // ── Test 13: getToolVersion returns correct version ────────────
  it("getToolVersion returns version for known tool", () => {
    expect(getToolVersion("ffmpeg")).toBe("1.7.0-toolshop");
    expect(getToolVersion("nonexistent")).toBeNull();
  });

  // ── Test 14: getToolsMissingPattern returns empty for shared ───
  it("no tools missing schema-first pattern", () => {
    expect(getToolsMissingPattern("schema-first")).toEqual([]);
  });

  // ── Test 15: registry summary has correct counts ───────────────
  it("getRegistrySummary returns accurate counts", () => {
    const summary = getRegistrySummary();
    expect(summary.toolCount).toBe(6);
    // FFmpeg: 7, Pandoc: 5, FreeCAD: 5, GDAL: 5, OpenSCAD: 5, Blender: 5 = 32
    expect(summary.totalPresets).toBe(32);
    // FFmpeg: 4, Pandoc: 1, FreeCAD: 1, GDAL: 1, OpenSCAD: 1, Blender: 1 = 9
    expect(summary.premiumPresets).toBe(9);
    expect(summary.guaranteedPresets).toBe(23);
    expect(summary.uniqueOutputFormats).toContain("STL");
    expect(summary.uniqueOutputFormats).toContain("MP4");
    expect(summary.version).toBe("1.7.0-toolshop");
  });
});
