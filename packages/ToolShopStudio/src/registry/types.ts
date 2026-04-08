import { z } from "zod";

// ── Registry types — pure data, no runtime logic ─────────────────

/**
 * Describes a single preset within a tool.
 * Mirrors the common PresetSpec pattern across all five tools.
 */
export const PresetInfoSchema = z.object({
  description: z.string(),
  isPremium: z.boolean(),
  fallbackTo: z.string().nullable(),
  outputExt: z.string(),
  outputFormat: z.string(),
});
export type PresetInfo = z.infer<typeof PresetInfoSchema>;

/**
 * A quick-start example for a tool.
 */
export const ToolExampleSchema = z.object({
  description: z.string(),
  code: z.string(),
});
export type ToolExample = z.infer<typeof ToolExampleSchema>;

/**
 * Full definition for a registered tool.
 * This is the single source of truth for introspection.
 */
/**
 * Raw shape before refinements — used for z.infer.
 */
const ToolDefinitionBaseSchema = z.object({
  /** Unique tool identifier: 'ffmpeg', 'pandoc', 'freecad', 'gdal', 'openscad' */
  id: z.string().min(1),
  /** Human-readable display name */
  name: z.string().min(1),
  /** Semver of the tool within ToolShopStudio */
  version: z.string().min(1),
  /** One-line description */
  description: z.string().min(1),
  /** Main pipeline function name (e.g. 'transcodeForYouTube', 'renderModel') */
  pipelineFn: z.string().min(1),
  /** Schema names for reference */
  schemas: z.object({
    request: z.string().min(1),
    asset: z.string().min(1),
    presetEnum: z.string().min(1),
  }),
  /** All presets with their metadata */
  presets: z.record(z.string(), PresetInfoSchema),
  /** Architectural patterns this tool uses */
  commonPatterns: z.array(z.string()).min(1),
  /** Quick-start code examples */
  examples: z.array(ToolExampleSchema).min(1),
});

/**
 * Full definition for a registered tool with structural refinements.
 * This is the single source of truth for introspection.
 */
export const ToolDefinitionSchema = ToolDefinitionBaseSchema
  .refine(
    (data) => Object.keys(data.presets).length > 0,
    { message: "must have at least one preset" },
  )
  .refine(
    (data) => {
      // Every premium preset's fallbackTo must reference an existing preset
      for (const [, info] of Object.entries(data.presets)) {
        if (info.isPremium && info.fallbackTo && !(info.fallbackTo in data.presets)) {
          return false;
        }
      }
      return true;
    },
    { message: "premium preset fallbackTo must reference an existing preset" },
  )
  .refine(
    (data) => {
      // Non-premium presets must have fallbackTo === null
      for (const [, info] of Object.entries(data.presets)) {
        if (!info.isPremium && info.fallbackTo !== null) return false;
      }
      return true;
    },
    { message: "guaranteed presets must have fallbackTo: null" },
  );

export type ToolDefinition = z.infer<typeof ToolDefinitionBaseSchema>;
