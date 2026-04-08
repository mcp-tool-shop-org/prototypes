import { z } from "zod";

// ── Preset enum ──────────────────────────────────────────────────

export const OpenSCADPresetEnum = z.enum([
  "stl-print-ready",
  "obj-mesh",
  "3mf-color",
  "png-preview",
  "dxf-2d",
]);
export type OpenSCADPreset = z.infer<typeof OpenSCADPresetEnum>;

// ── Quality tier ─────────────────────────────────────────────────

export const OpenSCADQualityEnum = z.enum(["draft", "standard", "high"]);
export type OpenSCADQuality = z.infer<typeof OpenSCADQualityEnum>;

// ── Probes ───────────────────────────────────────────────────────

export const OpenSCADInputProbeSchema = z.object({
  lines: z.number(),
  variables: z.number().optional(),
  sizeBytes: z.number(),
});
export type OpenSCADInputProbe = z.infer<typeof OpenSCADInputProbeSchema>;

export const OpenSCADOutputProbeSchema = z.object({
  format: z.string(),
  triangleCount: z.number().optional(),
  sizeBytes: z.number(),
});
export type OpenSCADOutputProbe = z.infer<typeof OpenSCADOutputProbeSchema>;

// ── Asset ────────────────────────────────────────────────────────

export const OpenSCADModelAssetSchema = z.object({
  id: z.string().uuid(),
  inputPath: z.string(),
  outputPath: z.string(),
  preset: OpenSCADPresetEnum,
  quality: OpenSCADQualityEnum,
  variables: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
  inputProbe: OpenSCADInputProbeSchema,
  outputProbe: OpenSCADOutputProbeSchema,
  warnings: z.array(z.string()),
  expiresAt: z.string().datetime(),
});
export type OpenSCADModelAsset = z.infer<typeof OpenSCADModelAssetSchema>;

// ── Request ──────────────────────────────────────────────────────

export const RenderModelSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  preset: OpenSCADPresetEnum,
  quality: OpenSCADQualityEnum.default("standard"),
  variables: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
  maxOutputBytes: z.number().nonnegative().default(0),
  timeoutSeconds: z.number().positive().default(900),
});
export type RenderModel = z.infer<typeof RenderModelSchema>;
