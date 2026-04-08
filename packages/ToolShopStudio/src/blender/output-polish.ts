import { extname } from "node:path";
import type { BlenderPresetSpec } from "./preset-spec.js";
import type { BlenderOutputProbe } from "./schemas.js";

// ── Output polish — pure post-processing helpers ─────────────────

/**
 * Ensure the output path has the correct extension for the preset.
 * If the path already ends with the right extension, returns it unchanged.
 * Otherwise appends the correct extension.
 *
 * Pure function — no I/O.
 */
export function ensureBlenderExtension(
  outputPath: string,
  spec: BlenderPresetSpec,
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
 * Build BlenderOutputProbe from known values.
 *
 * Pure function — caller provides sizeBytes from stat.
 * frames is left undefined for single-frame presets.
 */
export function buildBlenderOutputMetadata(
  spec: BlenderPresetSpec,
  sizeBytes: number,
  frames?: number,
): BlenderOutputProbe {
  return {
    format: spec.outputFormat,
    frames,
    sizeBytes,
  };
}

/**
 * Compute the asset expiration timestamp.
 * Default: 24 hours from now.
 */
export function computeBlenderExpiresAt(
  ttlMs: number = 86_400_000,
): string {
  return new Date(Date.now() + ttlMs).toISOString();
}
