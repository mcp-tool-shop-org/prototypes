import { describe, it, expect } from "vitest";
import {
  findTool,
  getAllToolIds,
  searchByPreset,
  getAllPremiumPresets,
  searchByOutputFormat,
  getCommonPattern,
} from "./search.js";
import { TOOL_REGISTRY, TOOL_IDS } from "./tools.js";

// ── Registry golden tests ────────────────────────────────────────

describe("ToolRegistry", () => {
  // ── Test 1: all six tools registered ───────────────────────────
  it("registers exactly 6 tools", () => {
    expect(TOOL_IDS).toHaveLength(6);
    expect(getAllToolIds()).toEqual(
      expect.arrayContaining(["ffmpeg", "pandoc", "freecad", "gdal", "openscad", "blender"]),
    );
  });

  // ── Test 2: findTool returns correct tool ──────────────────────
  it("findTool returns tool by ID", () => {
    const tool = findTool("ffmpeg");
    expect(tool).not.toBeNull();
    expect(tool!.id).toBe("ffmpeg");
    expect(tool!.name).toBe("FFmpeg YouTube MCP");
    expect(tool!.pipelineFn).toBe("transcodeForYouTube");
  });

  // ── Test 3: findTool returns null for unknown ──────────────────
  it("findTool returns null for unknown ID", () => {
    expect(findTool("nonexistent")).toBeNull();
  });

  // ── Test 4: searchByPreset finds cross-tool presets ────────────
  it("searchByPreset finds yt-1080p-h264 in ffmpeg", () => {
    const result = searchByPreset("yt-1080p-h264");
    expect(result).not.toBeNull();
    expect(result!.toolId).toBe("ffmpeg");
    expect(result!.info.isPremium).toBe(false);
  });

  // ── Test 5: searchByPreset finds pandoc preset ─────────────────
  it("searchByPreset finds academic-pdf in pandoc", () => {
    const result = searchByPreset("academic-pdf");
    expect(result).not.toBeNull();
    expect(result!.toolId).toBe("pandoc");
    expect(result!.info.outputFormat).toBe("pdf");
  });

  // ── Test 6: getAllPremiumPresets finds all fallback chains ──────
  it("getAllPremiumPresets returns all premium presets with fallbacks", () => {
    const premiums = getAllPremiumPresets();
    // FFmpeg: h265×3 + shorts-h265 = 4, Pandoc: newsletter = 1,
    // FreeCAD: 3mf = 1, GDAL: clip = 1, OpenSCAD: 3mf-color = 1, Blender: cycles-render = 1 → 9 total
    expect(premiums.length).toBe(9);
    expect(premiums.every((p) => p.fallbackTo.length > 0)).toBe(true);
  });

  // ── Test 7: searchByOutputFormat finds STL across tools ────────
  it("searchByOutputFormat finds STL presets across FreeCAD, OpenSCAD, and Blender", () => {
    const stlPresets = searchByOutputFormat("STL");
    expect(stlPresets.length).toBeGreaterThanOrEqual(3);
    const toolIds = [...new Set(stlPresets.map((p) => p.toolId))];
    expect(toolIds).toEqual(expect.arrayContaining(["freecad", "openscad", "blender"]));
  });

  // ── Test 8: getCommonPattern finds shared DI pattern ───────────
  it("getCommonPattern finds tools using context DI pattern", () => {
    const diTools = getCommonPattern("context DI");
    expect(diTools.length).toBe(6); // all six tools share this pattern
  });
});
