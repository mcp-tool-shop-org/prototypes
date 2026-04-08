import type { GDALPreset } from "./schemas.js";

// ── GDALPresetSpec: pure data, no runtime logic ─────────────────

/** Supported GDAL command binaries */
export type GDALBinary = "gdalwarp" | "ogr2ogr" | "gdal_translate";

export interface GDALPresetSpec {
  /** GDAL command binary */
  command: GDALBinary;
  /** Output file extension (without dot) */
  outputExt: string;
  /**
   * CLI argument template with placeholders:
   * - $INPUT  → inputPath
   * - $OUTPUT → outputPath
   * - $BBOX   → bbox as 4 separate args (minX minY maxX maxY)
   *
   * Placeholders are resolved by buildGDALArgs. No raw user input.
   */
  argsTemplate: string[];
  /** Whether this preset requires premium processing */
  isPremium: boolean;
  /** Fallback preset if this one fails */
  fallbackTo: GDALPreset | null;
  /** Estimated processing steps for progress calculation */
  estimatedSteps: number;
}

export const GDAL_PRESET_SPECS: Record<GDALPreset, GDALPresetSpec> = {
  "raster-wgs84-tiff": {
    command: "gdalwarp",
    outputExt: "tif",
    argsTemplate: ["-t_srs", "EPSG:4326", "-co", "COMPRESS=LZW", "$INPUT", "$OUTPUT"],
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 6,
  },
  "vector-geojson": {
    command: "ogr2ogr",
    outputExt: "geojson",
    argsTemplate: ["-f", "GeoJSON", "$OUTPUT", "$INPUT"],
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 4,
  },
  "raster-to-png": {
    command: "gdal_translate",
    outputExt: "png",
    argsTemplate: ["-of", "PNG", "-scale", "$INPUT", "$OUTPUT"],
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 3,
  },
  "vector-shapefile": {
    command: "ogr2ogr",
    outputExt: "shp",
    argsTemplate: ["-f", "ESRI Shapefile", "$OUTPUT", "$INPUT"],
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 5,
  },
  "clip-raster": {
    command: "gdalwarp",
    outputExt: "tif",
    argsTemplate: ["-te", "$BBOX", "-co", "COMPRESS=LZW", "$INPUT", "$OUTPUT"],
    isPremium: true,
    fallbackTo: "raster-wgs84-tiff",
    estimatedSteps: 8,
  },
} as const;

// ── Common invariant args for all presets ─────────────────────────

/**
 * Base GDAL CLI args applied to every transform.
 * -q runs in quiet mode (no banner).
 */
export function buildGDALBaseArgs(): string[] {
  return ["-q"];
}
