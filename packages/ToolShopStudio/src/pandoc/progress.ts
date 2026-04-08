import { attachProgressParser } from "../progress-parser.js";

// ── Pandoc progress parser ───────────────────────────────────────
//
// Pandoc's --verbose output emits processing steps on stderr:
//   [makePDF] Running xelatex ...
//   [INFO] Writing output ...
//   [WARNING] ...
//
// We reuse the FFmpeg line-buffered parser and interpret "step-like"
// lines as progress increments against the preset's estimatedSteps.

/** Keywords in pandoc --verbose output that indicate a processing step */
const STEP_KEYWORDS = [
  "writing",
  "processing",
  "running",
  "converting",
  "reading",
  "makepdf",
  "info",
  "done",
] as const;

/**
 * Check if a pandoc verbose line represents a processing step.
 */
export function isPandocStepLine(key: string, value: string): boolean {
  const combined = `${key} ${value}`.toLowerCase();
  return STEP_KEYWORDS.some((kw) => combined.includes(kw));
}

/**
 * Calculate pandoc progress percent from step count.
 * Clamps to 0–99 (100% is reserved for completion confirmation).
 */
export function calculatePandocPercent(
  currentStep: number,
  estimatedSteps: number,
): number {
  if (estimatedSteps <= 0) return 0;
  const pct = Math.floor((currentStep / estimatedSteps) * 100);
  return Math.min(99, Math.max(0, pct));
}

/**
 * Attach a progress parser to a pandoc stderr stream.
 *
 * Reuses the FFmpeg line-buffer infrastructure. On each recognized
 * processing step, increments the step counter and calls onProgress
 * with the updated percent.
 *
 * @param stream - stderr from pandoc child process
 * @param onProgress - callback with percent (0–99)
 * @param estimatedSteps - from PandocPresetSpec.estimatedSteps
 */
export function attachPandocProgress(
  stream: NodeJS.ReadableStream,
  onProgress: (percent: number) => void,
  estimatedSteps: number,
): void {
  let step = 0;

  attachProgressParser(stream, (key, value) => {
    if (isPandocStepLine(key, value)) {
      step++;
      const percent = calculatePandocPercent(step, estimatedSteps);
      onProgress(percent);
    }
  });
}
