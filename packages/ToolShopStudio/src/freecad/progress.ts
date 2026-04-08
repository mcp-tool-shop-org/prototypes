import { attachProgressParser } from "../progress-parser.js";

// ── FreeCAD progress parser ─────────────────────────────────────
//
// FreeCADCmd stderr output during export emits processing hints:
//   Exporting STL mesh ...
//   Mesh: processing body 1/3 ...
//   Done exporting to /sandbox/out.stl
//
// We reuse the FFmpeg line-buffered parser and interpret "step-like"
// lines as progress increments against the preset's estimatedSteps.

/** Keywords in FreeCAD stderr output that indicate a processing step */
const STEP_KEYWORDS = [
  "exporting",
  "mesh",
  "processing",
  "converting",
  "tessellating",
  "writing",
  "done",
] as const;

/**
 * Check if a FreeCAD stderr line represents a processing step.
 */
export function isFreeCADStepLine(key: string, value: string): boolean {
  const combined = `${key} ${value}`.toLowerCase();
  return STEP_KEYWORDS.some((kw) => combined.includes(kw));
}

/**
 * Calculate FreeCAD progress percent from step count.
 * Clamps to 0–99 (100% is reserved for completion confirmation).
 */
export function calculateFreeCADPercent(
  currentStep: number,
  estimatedSteps: number,
): number {
  if (estimatedSteps <= 0) return 0;
  const pct = Math.floor((currentStep / estimatedSteps) * 100);
  return Math.min(99, Math.max(0, pct));
}

/**
 * Attach a progress parser to a FreeCADCmd stderr stream.
 *
 * Reuses the FFmpeg line-buffer infrastructure. On each recognized
 * processing step, increments the step counter and calls onProgress
 * with the updated percent.
 *
 * @param stream - stderr from FreeCADCmd child process
 * @param onProgress - callback with percent (0–99)
 * @param estimatedSteps - from FreeCADPresetSpec.estimatedSteps
 */
export function attachFreeCADProgress(
  stream: NodeJS.ReadableStream,
  onProgress: (percent: number) => void,
  estimatedSteps: number,
): void {
  let step = 0;

  attachProgressParser(stream, (key, value) => {
    if (isFreeCADStepLine(key, value)) {
      step++;
      const percent = calculateFreeCADPercent(step, estimatedSteps);
      onProgress(percent);
    }
  });
}
