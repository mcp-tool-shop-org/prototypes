import { extname } from "node:path";
import type { GDALPresetSpec } from "./preset-spec.js";
import type { GDALOutputProbe } from "./schemas.js";

// ── Output polish — pure post-processing helpers ─────────────────

/**
 * Ensure the output path has the correct extension for the preset.
 * If the path already ends with the right extension, returns it unchanged.
 * Otherwise appends the correct extension.
 *
 * Pure function — no I/O.
 */
export function ensureGDALExtension(
  outputPath: string,
  spec: GDALPresetSpec,
): string {
  const expectedExt = `.${spec.outputExt}`;
  const currentExt = extname(outputPath).toLowerCase();

  if (currentExt === expectedExt) {
    return outputPath;
  }

  // If there's no extension, append it
  if (!currentExt) {
    return `${outputPath}${expectedExt}`;
  }

  // Different extension — append (don't replace, user may have reasons)
  return `${outputPath}${expectedExt}`;
}

/**
 * Build GDALOutputProbe from known values.
 *
 * Pure function — caller provides sizeBytes from stat.
 * CRS is placeholder (EPSG:4326) until real gdalinfo probing.
 */
export function buildGDALOutputMetadata(
  spec: GDALPresetSpec,
  sizeBytes: number,
): GDALOutputProbe {
  return {
    format: spec.outputExt.toUpperCase(),
    crs: "EPSG:4326",
    sizeBytes,
  };
}

/**
 * Compute the asset expiration timestamp.
 * Default: 24 hours from now.
 */
export function computeGDALExpiresAt(
  ttlMs: number = 86_400_000,
): string {
  return new Date(Date.now() + ttlMs).toISOString();
}
