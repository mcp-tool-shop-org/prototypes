import { attachProgressParser } from "../progress-parser.js";

// ── GDAL progress parser ──────────────────────────────────────
//
// GDAL tools emit processing hints on stderr:
//   gdalwarp:        0...10...20...30...40...50...60...70...80...90...100 - done.
//   ogr2ogr:         Processing layer <name>... done.
//   gdal_translate:  Input file size is 1024, 1024... 0...10...20...done.
//
// We reuse the FFmpeg line-buffered parser and interpret step-like
// lines as progress increments against the preset's estimatedSteps.

/** Keywords in GDAL stderr output that indicate a processing step */
const STEP_KEYWORDS = [
  "processing",
  "translating",
  "warping",
  "creating",
  "writing",
  "done",
] as const;

/** Regex for GDAL's numeric progress pattern: 0...10...20...100 - done. */
const PERCENT_PATTERN = /(\d+)(?:\.\.\.| - done)/;

/**
 * Check if a GDAL stderr line represents a processing step.
 */
export function isGDALStepLine(key: string, value: string): boolean {
  const combined = `${key} ${value}`.toLowerCase();
  return STEP_KEYWORDS.some((kw) => combined.includes(kw));
}

/**
 * Try to extract a direct percentage from GDAL's "0...10...20..." pattern.
 * Returns null if no match.
 */
export function extractGDALPercent(key: string, value: string): number | null {
  const combined = `${key} ${value}`;
  const match = combined.match(PERCENT_PATTERN);
  if (match) {
    const pct = parseInt(match[1], 10);
    if (Number.isFinite(pct) && pct >= 0 && pct <= 100) {
      return pct;
    }
  }
  return null;
}

/**
 * Calculate GDAL progress percent from step count.
 * Clamps to 0–99 (100% is reserved for completion confirmation).
 */
export function calculateGDALPercent(
  currentStep: number,
  estimatedSteps: number,
): number {
  if (estimatedSteps <= 0) return 0;
  const pct = Math.floor((currentStep / estimatedSteps) * 100);
  return Math.min(99, Math.max(0, pct));
}

/**
 * Attach a progress parser to a GDAL stderr stream.
 *
 * Reuses the FFmpeg line-buffer infrastructure. Supports two modes:
 * 1. Direct percent extraction from "0...10...20..." patterns
 * 2. Step-counting for keyword-based progress
 *
 * @param stream - stderr from GDAL child process
 * @param onProgress - callback with percent (0–99)
 * @param estimatedSteps - from GDALPresetSpec.estimatedSteps
 */
export function attachGDALProgress(
  stream: NodeJS.ReadableStream,
  onProgress: (percent: number) => void,
  estimatedSteps: number,
): void {
  let step = 0;

  attachProgressParser(stream, (key, value) => {
    // Try direct percent first (gdalwarp/gdal_translate pattern)
    const direct = extractGDALPercent(key, value);
    if (direct !== null) {
      // Cap at 99 — 100% reserved for pipeline completion
      onProgress(Math.min(99, direct));
      return;
    }

    // Fall back to step-counting
    if (isGDALStepLine(key, value)) {
      step++;
      const percent = calculateGDALPercent(step, estimatedSteps);
      onProgress(percent);
    }
  });
}
