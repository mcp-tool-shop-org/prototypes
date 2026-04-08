import type { RenderModel } from "./schemas.js";
import {
  OPENSCAD_PRESET_SPECS,
  buildOpenSCADBaseArgs,
  qualityToFn,
} from "./preset-spec.js";

// ── Command args ─────────────────────────────────────────────────

/**
 * Structured return for OpenSCAD CLI invocation.
 * Single binary (openscad), unlike GDAL's multi-binary dispatch.
 */
export interface OpenSCADCommandArgs {
  command: "openscad";
  args: string[];
}

/**
 * Build safe OpenSCAD CLI args from a validated RenderModel request.
 *
 * Pure function — no side effects, fully deterministic.
 *
 * Arg order: base → preset extraArgs → -o output → -D variables → input
 * OpenSCAD requires input path as the last positional arg.
 */
export function buildOpenSCADArgs(req: RenderModel): OpenSCADCommandArgs {
  const spec = OPENSCAD_PRESET_SPECS[req.preset];

  const args: string[] = [
    ...buildOpenSCADBaseArgs(),
    ...spec.extraArgs,
    "-o", req.outputPath,
  ];

  // Quality → $fn injection (always, even for "standard" — explicit is safer)
  const fn = qualityToFn(req.quality);
  args.push("-D", `$fn=${fn}`);

  // User-supplied variable overrides (-D key=value as separate args)
  if (req.variables) {
    for (const [key, value] of Object.entries(req.variables)) {
      args.push("-D", `${key}=${value}`);
    }
  }

  // Input path must be last positional argument
  args.push(req.inputPath);

  return { command: "openscad", args };
}
