import { extname } from "node:path";
import type { PandocPresetSpec } from "./preset-spec.js";
import type { PandocOutputMetadata } from "./schemas.js";

// ── Output polish — pure post-processing helpers ─────────────────

/**
 * Ensure the output path has the correct extension for the preset.
 * If the path already ends with the right extension, returns it unchanged.
 * Otherwise appends the correct extension.
 *
 * Pure function — no I/O.
 */
export function ensureCorrectExtension(
  outputPath: string,
  spec: PandocPresetSpec,
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
 * Build PandocOutputMetadata from known values.
 *
 * Pure function — caller provides sizeBytes from stat.
 */
export function buildOutputMetadata(
  spec: PandocPresetSpec,
  sizeBytes: number,
): PandocOutputMetadata {
  return {
    format: spec.to,
    sizeBytes,
    // pages is only meaningful for PDF — we'd need pdfinfo or
    // a real PDF parser for that. Left undefined until Phase 5+.
    ...(spec.to === "pdf" ? { pages: undefined } : {}),
  };
}

/**
 * Compute the asset expiration timestamp.
 * Default: 24 hours from now.
 */
export function computeExpiresAt(
  ttlMs: number = 86_400_000,
): string {
  return new Date(Date.now() + ttlMs).toISOString();
}
