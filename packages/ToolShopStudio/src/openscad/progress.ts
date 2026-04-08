// ── OpenSCAD progress parser ─────────────────────────────────────
//
// OpenSCAD emits plain-text status lines on stderr (not key=value):
//   Compiling design (AST generation)...
//   Compiling design (CSG generation)...
//   Geometries in cache: 42
//   Rendering...
//   Top level object is a 3D object:
//   Simple:          yes
//   Facets:         1280
//   ...rendering complete.
//
// We use a line-buffered parser (same chunking strategy as root)
// and step-counting against estimatedSteps for percent tracking.

/** Keywords in OpenSCAD stderr that indicate a processing step */
const STEP_KEYWORDS = [
  "compiling",
  "rendering",
  "geometries",
  "facets",
  "exporting",
  "writing",
  "done",
  "complete",
] as const;

/**
 * Check if a line from OpenSCAD stderr is a processing step.
 */
export function isOpenSCADStepLine(line: string): boolean {
  const lower = line.toLowerCase();
  return STEP_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Try to extract a direct percentage from OpenSCAD output.
 * OpenSCAD doesn't natively emit percent, but some wrappers do.
 * Returns null if no match.
 */
export function extractOpenSCADPercent(line: string): number | null {
  const match = line.match(/(\d+)%/);
  if (match) {
    const pct = parseInt(match[1], 10);
    if (Number.isFinite(pct) && pct >= 0 && pct <= 100) {
      return pct;
    }
  }
  return null;
}

/**
 * Calculate OpenSCAD progress percent from step count.
 * Clamps to 0–99 (100% is reserved for completion confirmation).
 */
export function calculateOpenSCADPercent(
  currentStep: number,
  estimatedSteps: number,
): number {
  if (estimatedSteps <= 0) return 0;
  const pct = Math.floor((currentStep / estimatedSteps) * 100);
  return Math.min(99, Math.max(0, pct));
}

/**
 * Attach a progress parser to an OpenSCAD stderr stream.
 *
 * Uses line-buffering (same chunking logic as root attachProgressParser)
 * but parses raw lines instead of key=value pairs, since OpenSCAD
 * emits plain text, not structured output.
 *
 * Supports two modes:
 * 1. Direct percent extraction from "N%" patterns (rare, from wrappers)
 * 2. Step-counting for keyword-based progress (primary)
 *
 * @param stream - stderr from OpenSCAD child process
 * @param onProgress - callback with percent (0–99)
 * @param estimatedSteps - from OpenSCADPresetSpec.estimatedSteps
 */
export function attachOpenSCADProgress(
  stream: NodeJS.ReadableStream,
  onProgress: (percent: number) => void,
  estimatedSteps: number,
): void {
  let step = 0;
  let buffer = "";

  stream.on("data", (chunk: Buffer | string) => {
    buffer += typeof chunk === "string" ? chunk : chunk.toString("utf8");

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Try direct percent first
      const direct = extractOpenSCADPercent(trimmed);
      if (direct !== null) {
        onProgress(Math.min(99, direct));
        continue;
      }

      // Fall back to step-counting
      if (isOpenSCADStepLine(trimmed)) {
        step++;
        const percent = calculateOpenSCADPercent(step, estimatedSteps);
        onProgress(percent);
      }
    }
  });

  // Flush remaining buffer on stream end
  stream.on("end", () => {
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      const direct = extractOpenSCADPercent(trimmed);
      if (direct !== null) {
        onProgress(Math.min(99, direct));
      } else if (isOpenSCADStepLine(trimmed)) {
        step++;
        const percent = calculateOpenSCADPercent(step, estimatedSteps);
        onProgress(percent);
      }
    }
    buffer = "";
  });
}
