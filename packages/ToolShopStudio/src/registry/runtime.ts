import type { ToolDefinition, PresetInfo } from "./types.js";
import { TOOL_REGISTRY, TOOL_IDS } from "./tools.js";
import { validateRegistry } from "./validate.js";
import { getRegistrySummary } from "./consistency.js";
import {
  findTool,
  getAllToolIds,
  getAllTools,
  searchAllByPreset,
  searchByOutputFormat,
  searchByOutputExt,
  getAllPremiumPresets,
  getPremiumPresetMap,
  getToolsByPattern,
} from "./search.js";

// ── Runtime registry — validated facade ──────────────────────────

/**
 * Registry summary shape.
 */
export interface RegistrySummary {
  toolCount: number;
  totalPresets: number;
  premiumPresets: number;
  guaranteedPresets: number;
  uniqueOutputFormats: string[];
  version: string;
}

/**
 * The live registry facade.
 * Provides validated, read-only access to all tools and search functions.
 */
export interface ToolShopRegistry {
  /** Whether the registry has been validated. */
  readonly validated: boolean;

  /** Cached summary (computed once on load). */
  readonly summary: RegistrySummary;

  /** Get a tool by ID, or null if not found. */
  get(id: string): ToolDefinition | null;

  /** Get all registered tool IDs. */
  ids(): string[];

  /** Get all registered tool definitions. */
  all(): ToolDefinition[];

  /** Search all tools for a preset by name (returns every match). */
  searchAllByPreset(preset: string): Array<{ toolId: string; preset: string; info: PresetInfo }>;

  /** Search by output format (e.g. "STL", "MP4"). */
  searchByOutputFormat(format: string): Array<{ toolId: string; preset: string; info: PresetInfo }>;

  /** Search by output extension (e.g. "stl", ".html"). */
  searchByOutputExt(ext: string): Array<{ toolId: string; preset: string; info: PresetInfo }>;

  /** Get all premium presets (flat array with fallback refs). */
  getAllPremiumPresets(): Array<{ toolId: string; preset: string; fallbackTo: string }>;

  /** Get premium presets grouped by tool ID. */
  getPremiumPresetMap(): Record<string, string[]>;

  /** Get tool IDs that use a specific pattern (substring match). */
  getToolsByPattern(pattern: string): string[];
}

// ── Singleton ────────────────────────────────────────────────────

let _instance: ToolShopRegistry | null = null;

/**
 * Load the registry with validation.
 *
 * On first call: validates every tool against ToolDefinitionSchema + structural
 * invariants. Throws immediately if any tool is broken (fail-fast in dev/CI).
 *
 * Subsequent calls return the same cached instance (no re-validation).
 *
 * @throws Error if any tool fails validation
 */
export function loadRegistry(): ToolShopRegistry {
  if (_instance) return _instance;

  // Validate — throws with clear message listing every issue
  validateRegistry();

  const summary = getRegistrySummary();

  _instance = {
    validated: true,
    summary,
    get: findTool,
    ids: getAllToolIds,
    all: getAllTools,
    searchAllByPreset,
    searchByOutputFormat,
    searchByOutputExt,
    getAllPremiumPresets,
    getPremiumPresetMap,
    getToolsByPattern,
  };

  return _instance;
}

/**
 * Reset the singleton (for testing only).
 * @internal
 */
export function _resetRegistry(): void {
  _instance = null;
}
