import { z } from "zod";
import type { ToolDefinition, PresetInfo } from "./types.js";
import { loadRegistry } from "./runtime.js";

// ── MCP introspection tools — schema-first, async, DI-ready ─────

// ── Schemas ──────────────────────────────────────────────────────

export const ListToolsRequestSchema = z.object({});
export type ListToolsRequest = z.infer<typeof ListToolsRequestSchema>;

export const GetToolInfoRequestSchema = z.object({
  toolId: z.string().min(1),
});
export type GetToolInfoRequest = z.infer<typeof GetToolInfoRequestSchema>;

export const SearchPresetsRequestSchema = z.object({
  preset: z.string().min(1),
});
export type SearchPresetsRequest = z.infer<typeof SearchPresetsRequestSchema>;

// ── Response types ───────────────────────────────────────────────

export interface ToolSummaryItem {
  id: string;
  name: string;
  version: string;
  description: string;
  presetCount: number;
  premiumCount: number;
}

export interface PresetSearchResult {
  toolId: string;
  preset: string;
  info: PresetInfo;
}

// ── Handlers ─────────────────────────────────────────────────────

/**
 * List all registered tools with summary info.
 * MCP-compatible: schema-parsed input, typed output.
 */
export async function listTools(
  _reqRaw: unknown,
): Promise<ToolSummaryItem[]> {
  ListToolsRequestSchema.parse(_reqRaw);
  const reg = loadRegistry();

  return reg.all().map((tool) => ({
    id: tool.id,
    name: tool.name,
    version: tool.version,
    description: tool.description,
    presetCount: Object.keys(tool.presets).length,
    premiumCount: Object.values(tool.presets).filter((p) => p.isPremium).length,
  }));
}

/**
 * Get full definition for a single tool.
 * Throws if toolId is not found.
 */
export async function getToolInfo(
  reqRaw: unknown,
): Promise<ToolDefinition> {
  const req = GetToolInfoRequestSchema.parse(reqRaw);
  const reg = loadRegistry();
  const tool = reg.get(req.toolId);

  if (!tool) {
    throw new Error(`Tool "${req.toolId}" not found in registry`);
  }

  return tool;
}

/**
 * Search for a preset across all tools.
 * Returns every tool that has the named preset.
 */
export async function searchPresets(
  reqRaw: unknown,
): Promise<PresetSearchResult[]> {
  const req = SearchPresetsRequestSchema.parse(reqRaw);
  const reg = loadRegistry();
  return reg.searchAllByPreset(req.preset);
}

// ── Tool registration table (for MCP server wiring) ─────────────

/**
 * Registry introspection tools ready for MCP server registration.
 *
 * Usage in your MCP server:
 *   for (const [name, { schema, handler }] of Object.entries(registryMcpTools)) {
 *     server.addTool(name, schema, handler);
 *   }
 */
export const registryMcpTools = {
  "registry.listTools": {
    schema: ListToolsRequestSchema,
    handler: listTools,
    description: "List all registered ToolShopStudio tools with preset counts",
  },
  "registry.getToolInfo": {
    schema: GetToolInfoRequestSchema,
    handler: getToolInfo,
    description: "Get full definition for a specific tool by ID",
  },
  "registry.searchPresets": {
    schema: SearchPresetsRequestSchema,
    handler: searchPresets,
    description: "Search for a preset name across all registered tools",
  },
} as const;
