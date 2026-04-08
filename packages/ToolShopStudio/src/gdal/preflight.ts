import { stat } from "node:fs/promises";
import { extname } from "node:path";
import type { GDALPreset } from "./schemas.js";
import type { GDALPresetSpec } from "./preset-spec.js";

// Re-export validateSandboxPath from root for convenience
export { validateSandboxPath } from "../preflight.js";

// ── Input validation ─────────────────────────────────────────────

/** Max input file size: 2 GB (geospatial files can be very large) */
const MAX_INPUT_BYTES = 2 * 1024 * 1024 * 1024;

/** Allowed input extensions for GDAL */
const ALLOWED_EXTENSIONS = [
  ".tif", ".tiff",    // GeoTIFF
  ".geojson", ".json", // GeoJSON
  ".shp",              // Shapefile
  ".gpkg",             // GeoPackage
  ".kml", ".kmz",      // KML/KMZ
  ".gml",              // GML
  ".csv",              // CSV with geometry
  ".vrt",              // GDAL Virtual
  ".nc",               // NetCDF
  ".hdf",              // HDF
  ".png", ".jpg",      // raster images (with worldfile)
];

export interface GDALInputCheck {
  ok: boolean;
  warnings: string[];
  sizeBytes: number;
}

/**
 * Validate a GDAL input file: exists, not too large, known extension.
 */
export async function checkGDALInput(
  filePath: string,
): Promise<GDALInputCheck> {
  const warnings: string[] = [];

  // Check file exists and get size
  let sizeBytes: number;
  try {
    const s = await stat(filePath);
    sizeBytes = s.size;
  } catch {
    return {
      ok: false,
      warnings: [`Input file not found: "${filePath}".`],
      sizeBytes: 0,
    };
  }

  if (sizeBytes > MAX_INPUT_BYTES) {
    return {
      ok: false,
      warnings: [
        `Input file is ${(sizeBytes / 1024 / 1024).toFixed(1)} MB, ` +
          `exceeds maximum ${MAX_INPUT_BYTES / 1024 / 1024} MB.`,
      ],
      sizeBytes,
    };
  }

  if (sizeBytes === 0) {
    warnings.push("Input file is empty.");
  }

  // Validate extension
  const ext = extname(filePath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      ok: false,
      warnings: [
        `Unknown geospatial format "${ext}". ` +
          `Supported: ${ALLOWED_EXTENSIONS.join(", ")}.`,
      ],
      sizeBytes,
    };
  }

  return { ok: true, warnings, sizeBytes };
}

// ── Output size estimation ───────────────────────────────────────

/** Rough expansion multipliers per preset */
const EXPANSION_FACTORS: Record<GDALPreset, number> = {
  "raster-wgs84-tiff": 1.4,  // reprojection + LZW compress
  "vector-geojson": 1.2,     // text-based GeoJSON is verbose
  "raster-to-png": 0.8,      // PNG compresses raster data
  "vector-shapefile": 1.1,   // SHP is compact
  "clip-raster": 0.6,        // clipping reduces extent
};

/**
 * Estimate output file size in bytes based on input size and preset.
 */
export function estimateGDALOutputBytes(
  inputSizeBytes: number,
  preset: GDALPreset,
): number {
  const factor = EXPANSION_FACTORS[preset] ?? 1.3;
  return Math.ceil(inputSizeBytes * factor);
}

// ── Output assertions ───────────────────────────────────────────

export interface GDALAssertionResult {
  ok: boolean;
  warnings: string[];
}

/** Suspicion threshold: output > 3× input is likely a bug */
const SUSPICIOUS_EXPANSION_RATIO = 3.0;

/**
 * Assert that the GDAL output file matches the preset spec.
 *
 * Checks:
 * 1. Output file exists
 * 2. Output file is non-empty
 * 3. Output extension matches spec
 * 4. Output size is within maxOutputBytes (if set)
 * 5. Output is not suspiciously large relative to input (>3× for warp/translate)
 */
export async function assertGDALOutput(
  spec: GDALPresetSpec,
  outputPath: string,
  maxOutputBytes: number,
  inputSizeBytes?: number,
): Promise<GDALAssertionResult> {
  const warnings: string[] = [];

  // Check file exists and get size
  let sizeBytes: number;
  try {
    const s = await stat(outputPath);
    sizeBytes = s.size;
  } catch {
    return {
      ok: false,
      warnings: [`Output file not found: "${outputPath}".`],
    };
  }

  // Check non-empty
  if (sizeBytes === 0) {
    return {
      ok: false,
      warnings: ["Output file is empty — GDAL produced no content."],
    };
  }

  // Check extension matches spec
  const actualExt = extname(outputPath).slice(1).toLowerCase();
  if (actualExt && actualExt !== spec.outputExt) {
    warnings.push(
      `Output extension ".${actualExt}" does not match expected ".${spec.outputExt}".`,
    );
  }

  // Check maxOutputBytes (0 = unlimited)
  if (maxOutputBytes > 0 && sizeBytes > maxOutputBytes) {
    return {
      ok: false,
      warnings: [
        `Output is ${(sizeBytes / 1024 / 1024).toFixed(1)} MB, ` +
          `exceeds maximum ${(maxOutputBytes / 1024 / 1024).toFixed(1)} MB.`,
      ],
    };
  }

  // Suspiciously large output detection (raster warps/translates)
  if (
    inputSizeBytes &&
    inputSizeBytes > 0 &&
    sizeBytes > inputSizeBytes * SUSPICIOUS_EXPANSION_RATIO
  ) {
    warnings.push(
      `Output is ${(sizeBytes / inputSizeBytes).toFixed(1)}× the input size — ` +
        `suspiciously large for ${spec.command}.`,
    );
  }

  return { ok: warnings.length === 0, warnings };
}

// ── Format compatibility check (pure) ───────────────────────────

const RASTER_EXTS = [".tif", ".tiff", ".png", ".jpg", ".vrt", ".nc", ".hdf"];
const VECTOR_EXTS = [".geojson", ".json", ".shp", ".gpkg", ".kml", ".kmz", ".gml", ".csv"];

const RASTER_PRESETS: GDALPreset[] = ["raster-wgs84-tiff", "raster-to-png", "clip-raster"];
const VECTOR_PRESETS: GDALPreset[] = ["vector-geojson", "vector-shapefile"];

/**
 * Validate that the requested preset is compatible with the input format.
 * Raster presets need raster input; vector presets need vector input.
 */
export function checkGDALFormatCompatibility(
  inputExt: string,
  preset: GDALPreset,
): { ok: boolean; warning?: string } {
  const ext = inputExt.toLowerCase();

  if (RASTER_PRESETS.includes(preset) && VECTOR_EXTS.includes(ext)) {
    return {
      ok: false,
      warning: `Preset "${preset}" expects raster input but got vector format "${ext}".`,
    };
  }

  if (VECTOR_PRESETS.includes(preset) && RASTER_EXTS.includes(ext)) {
    return {
      ok: false,
      warning: `Preset "${preset}" expects vector input but got raster format "${ext}".`,
    };
  }

  return { ok: true };
}

/**
 * Check if a file extension represents a raster format.
 */
export function isRasterExt(ext: string): boolean {
  return RASTER_EXTS.includes(ext.toLowerCase());
}

/**
 * Check if a file extension represents a vector format.
 */
export function isVectorExt(ext: string): boolean {
  return VECTOR_EXTS.includes(ext.toLowerCase());
}
