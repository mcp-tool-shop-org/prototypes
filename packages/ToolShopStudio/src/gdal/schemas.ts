import { z } from "zod";

// ── Preset enum (5 geospatial presets) ───────────────────────────
export const GDALPresetEnum = z.enum([
  "raster-wgs84-tiff",  // reproject raster to WGS84 + compress
  "vector-geojson",     // any vector → clean GeoJSON
  "raster-to-png",      // quick raster preview as PNG
  "vector-shapefile",   // vector → classic ESRI Shapefile
  "clip-raster",        // bbox clip of raster
]);
export type GDALPreset = z.infer<typeof GDALPresetEnum>;

// ── Quality tier ─────────────────────────────────────────────────
export const GDALQualityEnum = z.enum(["draft", "standard", "high"]);
export type GDALQuality = z.infer<typeof GDALQualityEnum>;

// ── Input probe (detected from geospatial file) ──────────────────
export const GDALInputProbeSchema = z.object({
  format: z.string(),
  crs: z.string().optional(),
  sizeBytes: z.number(),
});
export type GDALInputProbe = z.infer<typeof GDALInputProbeSchema>;

// ── Output probe (measured from result file) ────────────────────
export const GDALOutputProbeSchema = z.object({
  format: z.string(),
  crs: z.string(),
  sizeBytes: z.number(),
});
export type GDALOutputProbe = z.infer<typeof GDALOutputProbeSchema>;

// ── GDALGeoDataAsset ─────────────────────────────────────────────
export const GDALGeoDataAssetSchema = z.object({
  id: z.string().uuid(),
  inputPath: z.string(),
  outputPath: z.string(),
  preset: GDALPresetEnum,
  quality: GDALQualityEnum,
  inputProbe: GDALInputProbeSchema,
  outputProbe: GDALOutputProbeSchema,
  warnings: z.array(z.string()),
  expiresAt: z.string().datetime(),
});
export type GDALGeoDataAsset = z.infer<typeof GDALGeoDataAssetSchema>;

// ── TransformGeo input ───────────────────────────────────────────
export const TransformGeoSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  preset: GDALPresetEnum,
  quality: GDALQualityEnum.default("standard"),
  /** Bounding box [minX, minY, maxX, maxY] for clip presets */
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  maxOutputBytes: z.number().nonnegative().default(0),
  timeoutSeconds: z.number().positive().default(600),
});
export type TransformGeo = z.infer<typeof TransformGeoSchema>;
