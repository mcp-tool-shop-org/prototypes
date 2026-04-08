// ── Blender progress parser ──────────────────────────────────────
//
// Blender emits status lines on stdout (not key=value):
//   Fra:1 Mem:24.02M (Peak 25.64M) | Time:00:00.52 | Rendering 1 / 64 samples
//   Fra:1 Mem:24.02M (Peak 25.64M) | Time:00:01.23 | Scene, RenderLayer | Rendered 32/64 tiles
//   Saved: '/tmp/output.png'
//   Blender quit
//
// For export presets (glb/stl), output is minimal:
//   Read blend: /sandbox/model.blend
//   Info: Exporting to GLB
//   Blender quit
//
// We use a line-buffered parser (same chunking strategy as OpenSCAD)
// and step-counting against estimatedSteps for percent tracking.

/** Keywords in Blender stdout that indicate a processing step */
const STEP_KEYWORDS = [
  "fra:",
  "rendering",
  "compositing",
  "saved:",
  "exporting",
  "exported",
  "read blend",
  "info:",
  "blender quit",
] as const;

/**
 * Check if a line from Blender stdout is a processing step.
 */
export function isBlenderStepLine(line: string): boolean {
  const lower = line.toLowerCase();
  return STEP_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Try to extract a direct percentage from Blender output.
 * Blender's tile-based renderer emits "Rendered X/Y tiles" and
 * sample progress "Rendering N / M samples".
 * Returns null if no match.
 */
export function extractBlenderPercent(line: string): number | null {
  // Match "Rendered X/Y tiles" or "Rendering N / M samples"
  const tileMatch = line.match(/(?:Render(?:ed|ing))\s+(\d+)\s*\/\s*(\d+)/i);
  if (tileMatch) {
    const current = parseInt(tileMatch[1], 10);
    const total = parseInt(tileMatch[2], 10);
    if (total > 0 && Number.isFinite(current) && Number.isFinite(total)) {
      const pct = Math.floor((current / total) * 100);
      return Math.min(99, Math.max(0, pct));
    }
  }

  // Match plain "N%" pattern
  const pctMatch = line.match(/(\d+)%/);
  if (pctMatch) {
    const pct = parseInt(pctMatch[1], 10);
    if (Number.isFinite(pct) && pct >= 0 && pct <= 100) {
      return Math.min(99, pct);
    }
  }

  return null;
}

/**
 * Calculate Blender progress percent from step count.
 * Clamps to 0–99 (100% is reserved for completion confirmation).
 */
export function calculateBlenderPercent(
  currentStep: number,
  estimatedSteps: number,
): number {
  if (estimatedSteps <= 0) return 0;
  const pct = Math.floor((currentStep / estimatedSteps) * 100);
  return Math.min(99, Math.max(0, pct));
}

/**
 * Attach a progress parser to a Blender stdout stream.
 *
 * Uses line-buffering (same chunking logic as OpenSCAD/root parsers)
 * but parses raw lines instead of key=value pairs, since Blender
 * emits plain text, not structured output.
 *
 * Supports two modes:
 * 1. Direct percent extraction from "Rendered X/Y tiles" / "N%" patterns
 * 2. Step-counting for keyword-based progress (fallback)
 *
 * @param stream - stdout from Blender child process
 * @param onProgress - callback with percent (0–99)
 * @param estimatedSteps - from BlenderPresetSpec.estimatedSteps
 */
export function attachBlenderProgress(
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

      // Try direct percent first (tile/sample counting)
      const direct = extractBlenderPercent(trimmed);
      if (direct !== null) {
        onProgress(direct);
        continue;
      }

      // Fall back to step-counting
      if (isBlenderStepLine(trimmed)) {
        step++;
        const percent = calculateBlenderPercent(step, estimatedSteps);
        onProgress(percent);
      }
    }
  });

  // Flush remaining buffer on stream end
  stream.on("end", () => {
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      const direct = extractBlenderPercent(trimmed);
      if (direct !== null) {
        onProgress(direct);
      } else if (isBlenderStepLine(trimmed)) {
        step++;
        const percent = calculateBlenderPercent(step, estimatedSteps);
        onProgress(percent);
      }
    }
    buffer = "";
  });
}
