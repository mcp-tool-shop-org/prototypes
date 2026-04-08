import { z } from "zod";

// ── Preset enum (5 CAD export presets) ───────────────────────────
export const FreeCADPresetEnum = z.enum([
  "stl-print-ready",   // watertight STL for slicers
  "step-precision",    // manufacturing STEP
  "glb-web-ready",     // web/glTF binary
  "3mf-slicer-ready",  // full color + material for slicers
  "obj-mesh",          // simple polygon mesh
]);
export type FreeCADPreset = z.infer<typeof FreeCADPresetEnum>;

// ── Quality tier ─────────────────────────────────────────────────
export const FreeCADQualityEnum = z.enum(["draft", "standard", "high"]);
export type FreeCADQuality = z.infer<typeof FreeCADQualityEnum>;

// ── Input probe (detected from .FCStd file) ──────────────────────
export const FreeCADInputProbeSchema = z.object({
  version: z.string(),
  bodies: z.number().nonnegative(),
  parametric: z.boolean(),
  sizeBytes: z.number(),
});
export type FreeCADInputProbe = z.infer<typeof FreeCADInputProbeSchema>;

// ── Output probe (measured from exported file) ───────────────────
export const FreeCADOutputProbeSchema = z.object({
  format: z.string(),
  sizeBytes: z.number(),
  triangleCount: z.number().optional(),
  volumeMm3: z.number().optional(),
});
export type FreeCADOutputProbe = z.infer<typeof FreeCADOutputProbeSchema>;

// ── FreeCADPartAsset ─────────────────────────────────────────────
export const FreeCADPartAssetSchema = z.object({
  id: z.string().uuid(),
  inputPath: z.string(),
  outputPath: z.string(),
  preset: FreeCADPresetEnum,
  quality: FreeCADQualityEnum,
  inputProbe: FreeCADInputProbeSchema,
  outputProbe: FreeCADOutputProbeSchema,
  warnings: z.array(z.string()),
  expiresAt: z.string().datetime(),
});
export type FreeCADPartAsset = z.infer<typeof FreeCADPartAssetSchema>;

// ── ExportPart input ─────────────────────────────────────────────
export const ExportPartSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  preset: FreeCADPresetEnum,
  quality: FreeCADQualityEnum.default("standard"),
  maxOutputBytes: z.number().nonnegative().default(0),
  timeoutSeconds: z.number().positive().default(1800),
});
export type ExportPart = z.infer<typeof ExportPartSchema>;
