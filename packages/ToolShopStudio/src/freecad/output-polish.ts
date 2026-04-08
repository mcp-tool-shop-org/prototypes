import { extname } from "node:path";
import type { FreeCADPresetSpec } from "./preset-spec.js";
import type { FreeCADOutputProbe } from "./schemas.js";

// ── Output polish — pure post-processing helpers ─────────────────

/**
 * Ensure the output path has the correct extension for the preset.
 * If the path already ends with the right extension, returns it unchanged.
 * Otherwise appends the correct extension.
 *
 * Pure function — no I/O.
 */
export function ensureFreeCADExtension(
  outputPath: string,
  spec: FreeCADPresetSpec,
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
 * Build FreeCADOutputProbe from known values.
 *
 * Pure function — caller provides sizeBytes from stat.
 * triangleCount and volumeMm3 are optional and left undefined
 * until real mesh analysis is implemented in a later phase.
 */
export function buildFreeCADOutputMetadata(
  spec: FreeCADPresetSpec,
  sizeBytes: number,
): FreeCADOutputProbe {
  return {
    format: spec.exportFormat,
    sizeBytes,
    // triangleCount and volumeMm3 are optional — real mesh
    // analysis would populate these in a later phase.
  };
}

/**
 * Compute the asset expiration timestamp.
 * Default: 24 hours from now.
 */
export function computeFreeCADExpiresAt(
  ttlMs: number = 86_400_000,
): string {
  return new Date(Date.now() + ttlMs).toISOString();
}
