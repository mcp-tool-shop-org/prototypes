import { z } from "zod";
import { loadRegistry } from "./runtime.js";

// ── Registry as MCP resource — schema-first, async ───────────────

/**
 * Schema for the registry resource response.
 */
export const RegistryResourceSchema = z.object({
  tools: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      version: z.string(),
      description: z.string(),
      pipelineFn: z.string(),
      presetCount: z.number(),
      premiumCount: z.number(),
    }),
  ),
  summary: z.object({
    toolCount: z.number(),
    totalPresets: z.number(),
    premiumPresets: z.number(),
    guaranteedPresets: z.number(),
    uniqueOutputFormats: z.array(z.string()),
    version: z.string(),
  }),
});
export type RegistryResource = z.infer<typeof RegistryResourceSchema>;

/**
 * Get the full registry resource — tool list + summary.
 *
 * MCP-compatible: schema-first, async handler.
 * Returns validated data matching RegistryResourceSchema.
 */
export async function getRegistryResource(): Promise<RegistryResource> {
  const reg = loadRegistry();

  return {
    tools: reg.all().map((tool) => ({
      id: tool.id,
      name: tool.name,
      version: tool.version,
      description: tool.description,
      pipelineFn: tool.pipelineFn,
      presetCount: Object.keys(tool.presets).length,
      premiumCount: Object.values(tool.presets).filter((p) => p.isPremium).length,
    })),
    summary: reg.summary,
  };
}

/**
 * Schema for requesting a specific tool's full preset data as a resource.
 */
export const ToolResourceRequestSchema = z.object({
  toolId: z.string().min(1),
});

/**
 * Get a single tool's full data as a resource.
 * Throws if toolId is not found.
 */
export async function getToolResource(
  reqRaw: unknown,
): Promise<{
  id: string;
  name: string;
  version: string;
  description: string;
  pipelineFn: string;
  presets: Record<string, { description: string; isPremium: boolean; fallbackTo: string | null; outputExt: string; outputFormat: string }>;
  commonPatterns: string[];
}> {
  const req = ToolResourceRequestSchema.parse(reqRaw);
  const reg = loadRegistry();
  const tool = reg.get(req.toolId);

  if (!tool) {
    throw new Error(`Tool "${req.toolId}" not found in registry`);
  }

  return {
    id: tool.id,
    name: tool.name,
    version: tool.version,
    description: tool.description,
    pipelineFn: tool.pipelineFn,
    presets: tool.presets,
    commonPatterns: tool.commonPatterns,
  };
}
