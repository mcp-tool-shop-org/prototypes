import { z } from "zod";

// ── Preset enum (5 document presets) ──────────────────────────────
export const PandocPresetEnum = z.enum([
  "blog-post",
  "academic-pdf",
  "ebook",
  "slides",
  "newsletter",
]);
export type PandocPreset = z.infer<typeof PandocPresetEnum>;

// ── Input metadata (detected from source file) ───────────────────
export const PandocInputMetadataSchema = z.object({
  format: z.string(),
  title: z.string().optional(),
  wordCount: z.number().optional(),
  sizeBytes: z.number(),
});
export type PandocInputMetadata = z.infer<typeof PandocInputMetadataSchema>;

// ── Output metadata (measured from result) ────────────────────────
export const PandocOutputMetadataSchema = z.object({
  format: z.string(),
  pages: z.number().optional(),
  sizeBytes: z.number(),
});
export type PandocOutputMetadata = z.infer<typeof PandocOutputMetadataSchema>;

// ── PandocDocumentAsset ───────────────────────────────────────────
export const PandocDocumentAssetSchema = z.object({
  id: z.string().uuid(),
  inputPath: z.string(),
  outputPath: z.string(),
  preset: PandocPresetEnum,
  inputMetadata: PandocInputMetadataSchema,
  outputMetadata: PandocOutputMetadataSchema,
  warnings: z.array(z.string()),
  expiresAt: z.string().datetime(),
});
export type PandocDocumentAsset = z.infer<typeof PandocDocumentAssetSchema>;

// ── ConvertDocument input ─────────────────────────────────────────
export const ConvertDocumentSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  preset: PandocPresetEnum,
  templatePath: z.string().optional(),
  bibliographyPath: z.string().optional(),
  cssPath: z.string().optional(),
  timeoutSeconds: z.number().positive().default(60),
  maxOutputBytes: z.number().nonnegative().default(0),
});
export type ConvertDocument = z.infer<typeof ConvertDocumentSchema>;
