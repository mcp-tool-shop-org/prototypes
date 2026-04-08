import { describe, it, expect, beforeEach } from "vitest";
import { loadRegistry, _resetRegistry } from "./runtime.js";
import { listTools, getToolInfo, searchPresets } from "./mcp-tools.js";
import { processCommand } from "./cli.js";
import {
  generateToolMarkdown,
  generateRegistryMarkdown,
  generatePresetCrossRef,
} from "./auto-docs.js";

// ── Runtime integration tests ────────────────────────────────────

describe("loadRegistry", () => {
  beforeEach(() => _resetRegistry());

  // ── Test 1: loads without throwing ─────────────────────────────
  it("loads and validates without throwing", () => {
    expect(() => loadRegistry()).not.toThrow();
  });

  // ── Test 2: returns validated singleton ─────────────────────────
  it("returns same instance on repeated calls", () => {
    const a = loadRegistry();
    const b = loadRegistry();
    expect(a).toBe(b);
    expect(a.validated).toBe(true);
  });

  // ── Test 3: summary has correct tool count ─────────────────────
  it("summary contains all six tools", () => {
    const reg = loadRegistry();
    expect(reg.summary.toolCount).toBe(6);
    expect(reg.summary.totalPresets).toBe(32);
  });

  // ── Test 4: get returns tool or null ───────────────────────────
  it("get returns tool by ID or null", () => {
    const reg = loadRegistry();
    expect(reg.get("openscad")?.id).toBe("openscad");
    expect(reg.get("nonexistent")).toBeNull();
  });
});

describe("MCP introspection tools", () => {
  beforeEach(() => _resetRegistry());

  // ── Test 5: listTools returns all 6 tools ──────────────────────
  it("listTools returns all six tools with correct shape", async () => {
    const result = await listTools({});
    expect(result).toHaveLength(6);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("presetCount");
    expect(result[0]).toHaveProperty("premiumCount");
  });

  // ── Test 6: getToolInfo returns full definition ────────────────
  it("getToolInfo returns full ToolDefinition", async () => {
    const tool = await getToolInfo({ toolId: "pandoc" });
    expect(tool.id).toBe("pandoc");
    expect(tool.pipelineFn).toBe("convertDocument");
    expect(Object.keys(tool.presets)).toContain("academic-pdf");
  });

  // ── Test 7: getToolInfo throws for unknown ID ──────────────────
  it("getToolInfo throws for unknown tool", async () => {
    await expect(getToolInfo({ toolId: "nope" })).rejects.toThrow("not found");
  });

  // ── Test 8: searchPresets finds cross-tool matches ─────────────
  it("searchPresets finds stl-print-ready in FreeCAD + OpenSCAD", async () => {
    const results = await searchPresets({ preset: "stl-print-ready" });
    expect(results.length).toBe(2);
    const ids = results.map((r) => r.toolId);
    expect(ids).toContain("freecad");
    expect(ids).toContain("openscad");
  });
});

describe("CLI processCommand", () => {
  beforeEach(() => _resetRegistry());

  // ── Test 9: list command returns table ──────────────────────────
  it("list command includes all six tool IDs", () => {
    const output = processCommand(["list"]);
    expect(output).toContain("ffmpeg");
    expect(output).toContain("pandoc");
    expect(output).toContain("freecad");
    expect(output).toContain("gdal");
    expect(output).toContain("openscad");
    expect(output).toContain("blender");
  });

  // ── Test 10: show command returns tool details ─────────────────
  it("show openscad returns preset table", () => {
    const output = processCommand(["show", "openscad"]);
    expect(output).toContain("OpenSCAD MCP");
    expect(output).toContain("stl-print-ready");
    expect(output).toContain("3mf-color");
    expect(output).toContain("Premium");
  });

  // ── Test 11: summary command returns counts ────────────────────
  it("summary shows correct tool and preset counts", () => {
    const output = processCommand(["summary"]);
    expect(output).toContain("Tools:       6");
    expect(output).toContain("23 guaranteed, 9 premium");
  });

  // ── Test 12: unknown command returns usage ─────────────────────
  it("unknown command returns usage help", () => {
    const output = processCommand(["bogus"]);
    expect(output).toContain("Usage:");
    expect(output).toContain("list");
    expect(output).toContain("show");
    expect(output).toContain("summary");
  });
});

describe("auto-docs", () => {
  beforeEach(() => _resetRegistry());

  // ── Test 13: generateToolMarkdown produces valid markdown ──────
  it("generateToolMarkdown produces markdown with preset table", () => {
    const md = generateToolMarkdown("ffmpeg");
    expect(md).toContain("# FFmpeg YouTube MCP");
    expect(md).toContain("| Preset |");
    expect(md).toContain("`yt-1080p-h264`");
    expect(md).toContain("## Architectural Patterns");
    expect(md).toContain("## Example");
  });

  // ── Test 14: generateToolMarkdown returns empty for unknown ────
  it("generateToolMarkdown returns empty string for unknown tool", () => {
    expect(generateToolMarkdown("nope")).toBe("");
  });

  // ── Test 15: generateRegistryMarkdown includes all tools ───────
  it("generateRegistryMarkdown includes all six tools", () => {
    const md = generateRegistryMarkdown();
    expect(md).toContain("# ToolShopStudio Registry");
    expect(md).toContain("# FFmpeg YouTube MCP");
    expect(md).toContain("# Pandoc MCP");
    expect(md).toContain("# FreeCAD MCP");
    expect(md).toContain("# GDAL MCP");
    expect(md).toContain("# OpenSCAD MCP");
    expect(md).toContain("# Blender MCP");
  });

  // ── Test 16: generatePresetCrossRef shows shared presets ───────
  it("generatePresetCrossRef shows stl-print-ready shared across tools", () => {
    const md = generatePresetCrossRef();
    expect(md).toContain("# Preset Cross-Reference");
    // stl-print-ready is in both freecad and openscad
    expect(md).toMatch(/stl-print-ready.*freecad.*openscad|stl-print-ready.*openscad.*freecad/);
  });
});
