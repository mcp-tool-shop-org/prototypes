import { z } from "zod";

// ── Preset enum ──────────────────────────────────────────────────

export const BlenderPresetEnum = z.enum([
  "png-preview",
  "glb-export",
  "video-1080p",
  "stl-from-mesh",
  "cycles-render",
]);
export type BlenderPreset = z.infer<typeof BlenderPresetEnum>;

// ── Quality tier ─────────────────────────────────────────────────

export const BlenderQualityEnum = z.enum(["draft", "standard", "high"]);
export type BlenderQuality = z.infer<typeof BlenderQualityEnum>;

// ── Device enum ──────────────────────────────────────────────────

export const BlenderDeviceEnum = z.enum(["CPU", "GPU"]);
export type BlenderDevice = z.infer<typeof BlenderDeviceEnum>;

// ── Probes ───────────────────────────────────────────────────────

export const BlenderInputProbeSchema = z.object({
  scenes: z.number(),
  objects: z.number(),
  version: z.string(),
  sizeBytes: z.number(),
});
export type BlenderInputProbe = z.infer<typeof BlenderInputProbeSchema>;

export const BlenderOutputProbeSchema = z.object({
  format: z.string(),
  frames: z.number().optional(),
  sizeBytes: z.number(),
});
export type BlenderOutputProbe = z.infer<typeof BlenderOutputProbeSchema>;

// ── Asset ────────────────────────────────────────────────────────

export const BlenderRenderAssetSchema = z.object({
  id: z.string().uuid(),
  inputPath: z.string(),
  outputPath: z.string(),
  preset: BlenderPresetEnum,
  quality: BlenderQualityEnum,
  device: BlenderDeviceEnum,
  scene: z.string(),
  frameStart: z.number(),
  frameEnd: z.number(),
  inputProbe: BlenderInputProbeSchema,
  outputProbe: BlenderOutputProbeSchema,
  warnings: z.array(z.string()),
  expiresAt: z.string().datetime(),
});
export type BlenderRenderAsset = z.infer<typeof BlenderRenderAssetSchema>;

// ── Request ──────────────────────────────────────────────────────

export const RenderBlendSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  preset: BlenderPresetEnum,
  scene: z.string().min(1).default("Scene"),
  frameStart: z.number().int().positive().default(1),
  frameEnd: z.number().int().positive().default(1),
  device: BlenderDeviceEnum.default("CPU"),
  quality: BlenderQualityEnum.default("standard"),
  maxOutputBytes: z.number().nonnegative().default(0),
  timeoutSeconds: z.number().positive().default(1800),
});
export type RenderBlend = z.infer<typeof RenderBlendSchema>;
