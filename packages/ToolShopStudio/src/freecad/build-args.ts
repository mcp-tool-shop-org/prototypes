import type { ExportPart } from "./schemas.js";
import { FREECAD_PRESET_SPECS, buildFreeCADBaseArgs } from "./preset-spec.js";

// ── Pure arg builder — no I/O, fully deterministic ───────────────

/**
 * Build the full FreeCADCmd CLI argument array from a validated request.
 *
 * Order: base args (--headless --no-gui -c) → python expression
 *        → quality flag → quality tier override
 *
 * The pythonExpr is a safe, hardcoded one-liner with $INPUT/$OUTPUT
 * placeholders replaced by the request paths. No exec/eval/user code.
 */
export function buildFreeCADArgs(req: ExportPart): string[] {
  const spec = FREECAD_PRESET_SPECS[req.preset];

  // Replace placeholders in the safe Python expression
  const python = spec.pythonExpr
    .replace("$INPUT", req.inputPath)
    .replace("$OUTPUT", req.outputPath);

  const args: string[] = [
    ...buildFreeCADBaseArgs(),
    python,
  ];

  // Append preset-specific quality flag if non-empty
  if (spec.qualityFlag) {
    args.push(spec.qualityFlag);
  }

  // Append quality tier override (only when non-standard)
  if (req.quality !== "standard") {
    args.push(`--quality=${req.quality}`);
  }

  return args;
}
