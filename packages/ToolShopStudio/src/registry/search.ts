import type { ToolDefinition, PresetInfo } from "./types.js";
import { TOOL_REGISTRY, TOOL_IDS } from "./tools.js";

// ── Search & introspection — zero-cost queries ───────────────────

/**
 * Find a tool by its ID.
 * Returns null if not found.
 */
export function findTool(id: string): ToolDefinition | null {
  return TOOL_REGISTRY[id] ?? null;
}

/**
 * Get all registered tool IDs.
 */
export function getAllToolIds(): string[] {
  return [...TOOL_IDS];
}

/**
 * Get all registered tool definitions.
 */
export function getAllTools(): ToolDefinition[] {
  return Object.values(TOOL_REGISTRY);
}

// ── Preset search ────────────────────────────────────────────────

/**
 * Search across all tools for a preset by name.
 * Returns the first match (tool ID + preset info), or null if not found.
 */
export function searchByPreset(
  preset: string,
): { toolId: string; preset: string; info: PresetInfo } | null {
  for (const [toolId, tool] of Object.entries(TOOL_REGISTRY)) {
    const info = tool.presets[preset];
    if (info) {
      return { toolId, preset, info };
    }
  }
  return null;
}

/**
 * Search across ALL tools for a preset by name.
 * Returns every tool that has the preset (e.g. "stl-print-ready" → FreeCAD + OpenSCAD).
 */
export function searchAllByPreset(
  preset: string,
): Array<{ toolId: string; preset: string; info: PresetInfo }> {
  const results: Array<{ toolId: string; preset: string; info: PresetInfo }> = [];

  for (const [toolId, tool] of Object.entries(TOOL_REGISTRY)) {
    const info = tool.presets[preset];
    if (info) {
      results.push({ toolId, preset, info });
    }
  }

  return results;
}

// ── Format search ────────────────────────────────────────────────

/**
 * Get all presets for a specific output format (e.g., "STL", "PDF").
 * Case-insensitive match on outputFormat.
 */
export function searchByOutputFormat(
  format: string,
): Array<{ toolId: string; preset: string; info: PresetInfo }> {
  const upper = format.toUpperCase();
  const results: Array<{ toolId: string; preset: string; info: PresetInfo }> = [];

  for (const [toolId, tool] of Object.entries(TOOL_REGISTRY)) {
    for (const [presetName, info] of Object.entries(tool.presets)) {
      if (info.outputFormat.toUpperCase() === upper) {
        results.push({ toolId, preset: presetName, info });
      }
    }
  }

  return results;
}

/**
 * Get all presets for a specific output file extension (e.g., "stl", "html").
 * Case-insensitive match on outputExt.
 */
export function searchByOutputExt(
  ext: string,
): Array<{ toolId: string; preset: string; info: PresetInfo }> {
  const lower = ext.toLowerCase().replace(/^\./, ""); // strip leading dot
  const results: Array<{ toolId: string; preset: string; info: PresetInfo }> = [];

  for (const [toolId, tool] of Object.entries(TOOL_REGISTRY)) {
    for (const [presetName, info] of Object.entries(tool.presets)) {
      if (info.outputExt.toLowerCase() === lower) {
        results.push({ toolId, preset: presetName, info });
      }
    }
  }

  return results;
}

// ── Pattern search ───────────────────────────────────────────────

/**
 * Find all tools that use a specific architectural pattern.
 * Pattern matching is case-insensitive substring search.
 * Returns full ToolDefinitions.
 */
export function getCommonPattern(pattern: string): ToolDefinition[] {
  const lower = pattern.toLowerCase();
  return Object.values(TOOL_REGISTRY).filter((tool) =>
    tool.commonPatterns.some((p) => p.toLowerCase().includes(lower)),
  );
}

/**
 * Find all tool IDs that use a specific architectural pattern.
 * Pattern matching is case-insensitive substring search.
 * Returns just IDs — lighter than getCommonPattern.
 */
export function getToolsByPattern(pattern: string): string[] {
  const lower = pattern.toLowerCase();
  return Object.entries(TOOL_REGISTRY)
    .filter(([, tool]) =>
      tool.commonPatterns.some((p) => p.toLowerCase().includes(lower)),
    )
    .map(([id]) => id);
}

// ── Premium / fallback introspection ─────────────────────────────

/**
 * Get all premium presets across all tools.
 * Returns flat array with fallback references.
 * Useful for understanding fallback topology.
 */
export function getAllPremiumPresets(): Array<{
  toolId: string;
  preset: string;
  fallbackTo: string;
}> {
  const results: Array<{ toolId: string; preset: string; fallbackTo: string }> = [];

  for (const [toolId, tool] of Object.entries(TOOL_REGISTRY)) {
    for (const [presetName, info] of Object.entries(tool.presets)) {
      if (info.isPremium && info.fallbackTo) {
        results.push({ toolId, preset: presetName, fallbackTo: info.fallbackTo });
      }
    }
  }

  return results;
}

/**
 * Get premium presets grouped by tool ID.
 * Returns { ffmpeg: ["yt-1080p-h265", ...], openscad: ["3mf-color"], ... }
 */
export function getPremiumPresetMap(): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const [toolId, tool] of Object.entries(TOOL_REGISTRY)) {
    const premiums = Object.entries(tool.presets)
      .filter(([, info]) => info.isPremium)
      .map(([name]) => name);
    if (premiums.length > 0) {
      result[toolId] = premiums;
    }
  }

  return result;
}
