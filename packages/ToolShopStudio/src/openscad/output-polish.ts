import { extname } from "node:path";
import type { OpenSCADPresetSpec } from "./preset-spec.js";
import type { OpenSCADOutputProbe } from "./schemas.js";

// ── Output polish — pure post-processing helpers ─────────────────

/**
 * Ensure the output path has the correct extension for the preset.
 * If the path already ends with the right extension, returns it unchanged.
 * Otherwise appends the correct extension.
 *
 * Pure function — no I/O.
 */
export function ensureOpenSCADExtension(
  outputPath: string,
  spec: OpenSCADPresetSpec,
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
 * Build OpenSCADOutputProbe from known values.
 *
 * Pure function — caller provides sizeBytes from stat.
 * triangleCount is left undefined until real mesh inspection.
 */
export function buildOpenSCADOutputMetadata(
  spec: OpenSCADPresetSpec,
  sizeBytes: number,
): OpenSCADOutputProbe {
  return {
    format: spec.outputFormat,
    sizeBytes,
  };
}

/**
 * Compute the asset expiration timestamp.
 * Default: 24 hours from now.
 */
export function computeOpenSCADExpiresAt(
  ttlMs: number = 86_400_000,
): string {
  return new Date(Date.now() + ttlMs).toISOString();
}
