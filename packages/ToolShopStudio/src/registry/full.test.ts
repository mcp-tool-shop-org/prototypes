import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { _resetRegistry } from "./runtime.js";
import { getRegistryResource, getToolResource } from "./resource.js";
import { allRegistryMcpTools, registryMcpToolNames } from "./mcp-server.js";
import { processCommand } from "./cli.js";
import { generateAllToolDocs } from "./auto-docs.js";

// ── Registry Phase 4 integration tests ───────────────────────────

const TEST_DIR = join(tmpdir(), `toolshop-test-${Date.now()}`);

describe("getRegistryResource", () => {
  beforeEach(() => _resetRegistry());

  // ── Test 1: returns all 6 tools ────────────────────────────────
  it("returns all 6 tools with correct shape", async () => {
    const res = await getRegistryResource();
    expect(res.tools).toHaveLength(6);
    expect(res.tools[0]).toHaveProperty("id");
    expect(res.tools[0]).toHaveProperty("presetCount");
    expect(res.tools[0]).toHaveProperty("pipelineFn");
    expect(res.summary.toolCount).toBe(6);
    expect(res.summary.totalPresets).toBe(32);
  });

  // ── Test 2: summary matches consistency check ──────────────────
  it("summary has correct premium/guaranteed split", async () => {
    const res = await getRegistryResource();
    expect(res.summary.premiumPresets).toBe(9);
    expect(res.summary.guaranteedPresets).toBe(23);
    expect(res.summary.uniqueOutputFormats).toContain("STL");
    expect(res.summary.uniqueOutputFormats).toContain("MP4");
  });
});

describe("getToolResource", () => {
  beforeEach(() => _resetRegistry());

  // ── Test 3: returns full tool data ─────────────────────────────
  it("returns openscad with presets and patterns", async () => {
    const res = await getToolResource({ toolId: "openscad" });
    expect(res.id).toBe("openscad");
    expect(res.pipelineFn).toBe("renderModel");
    expect(Object.keys(res.presets)).toContain("stl-print-ready");
    expect(res.commonPatterns.length).toBeGreaterThan(10);
  });

  // ── Test 4: throws for unknown tool ────────────────────────────
  it("throws for unknown tool", async () => {
    await expect(getToolResource({ toolId: "nope" })).rejects.toThrow("not found");
  });
});

describe("allRegistryMcpTools", () => {
  // ── Test 5: has all 5 MCP introspection tool names ─────────────
  it("registers all 5 MCP tools", () => {
    expect(registryMcpToolNames).toHaveLength(5);
    expect(registryMcpToolNames).toContain("registry.listTools");
    expect(registryMcpToolNames).toContain("registry.getToolInfo");
    expect(registryMcpToolNames).toContain("registry.searchPresets");
    expect(registryMcpToolNames).toContain("registry.getResource");
    expect(registryMcpToolNames).toContain("registry.getToolResource");
  });

  // ── Test 6: every entry has schema + handler + description ─────
  it("every tool entry has schema, handler, and description", () => {
    for (const [name, entry] of Object.entries(allRegistryMcpTools)) {
      expect(entry.schema, `${name} missing schema`).toBeDefined();
      expect(typeof entry.handler, `${name} handler not function`).toBe("function");
      expect(entry.description, `${name} missing description`).toBeTruthy();
    }
  });
});

describe("CLI json command", () => {
  beforeEach(() => _resetRegistry());

  // ── Test 7: json output is valid JSON ──────────────────────────
  it("json command returns valid JSON with correct shape", () => {
    const output = processCommand(["json"]);
    const parsed = JSON.parse(output);
    expect(parsed.toolCount).toBe(6);
    expect(parsed.totalPresets).toBe(32);
    expect(parsed.premiumPresets).toBe(9);
  });
});

describe("generateAllToolDocs", () => {
  beforeEach(() => _resetRegistry());
  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  // ── Test 8: creates correct files ──────────────────────────────
  it("generates 8 doc files to temp dir", () => {
    const files = generateAllToolDocs(TEST_DIR);
    expect(files).toHaveLength(8);

    // Per-tool docs
    for (const id of ["ffmpeg", "pandoc", "freecad", "gdal", "openscad", "blender"]) {
      expect(existsSync(join(TEST_DIR, "tools", `${id}.md`))).toBe(true);
    }

    // Registry + presets
    expect(existsSync(join(TEST_DIR, "registry.md"))).toBe(true);
    expect(existsSync(join(TEST_DIR, "presets.md"))).toBe(true);
  });

  // ── Test 9: CLI docs command returns status ────────────────────
  it("CLI docs command generates docs and returns status", () => {
    const output = processCommand(["docs", TEST_DIR]);
    expect(output).toContain("Generated 8 docs");
    expect(existsSync(join(TEST_DIR, "registry.md"))).toBe(true);
  });
});
