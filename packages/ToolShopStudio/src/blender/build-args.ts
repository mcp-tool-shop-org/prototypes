import type { RenderBlend } from "./schemas.js";
import {
  BLENDER_PRESET_SPECS,
  buildBlenderBaseArgs,
  qualityToSamples,
} from "./preset-spec.js";

// ── Command args ─────────────────────────────────────────────────

/**
 * Structured return for Blender CLI invocation.
 * Single binary (blender), like OpenSCAD.
 */
export interface BlenderCommandArgs {
  command: "blender";
  args: string[];
}

/**
 * Build safe Blender CLI args from a validated RenderBlend request.
 *
 * Pure function — no side effects, fully deterministic.
 *
 * Arg order:
 *   base (-b -noaudio)
 *   → input path (Blender requires .blend as first positional)
 *   → engine flags (--engine CYCLES etc.)
 *   → scene selection (--scene)
 *   → frame range (-s/-e for multi-frame, or via extraArgs)
 *   → quality/samples (--python-expr for Cycles sample override)
 *   → preset extraArgs (render flags, format, resolution)
 *   → output path (-o for native render)
 *   → python expr (--python-expr for export presets, $OUTPUT substituted)
 *
 * Python expressions are pre-baked safe one-liners from BLENDER_PRESET_SPECS.
 * No user-supplied Python is ever executed.
 */
export function buildBlenderArgs(req: RenderBlend): BlenderCommandArgs {
  const spec = BLENDER_PRESET_SPECS[req.preset];

  const args: string[] = [
    // Base args (headless, no audio)
    ...buildBlenderBaseArgs(),

    // Input path — Blender requires the .blend file early in args
    req.inputPath,
  ];

  // Engine selection (if specified for this preset)
  if (spec.engineArgs.length > 0) {
    args.push(...spec.engineArgs);
  }

  // Scene selection
  args.push("--scene", req.scene);

  // Frame range (only for multi-frame presets like video-1080p)
  if (req.frameStart !== 1 || req.frameEnd !== 1) {
    args.push("-s", String(req.frameStart), "-e", String(req.frameEnd));
  }

  // Quality → Cycles samples (only for non-standard quality on Cycles engine)
  if (req.quality !== "standard") {
    const samples = qualityToSamples(req.quality);
    args.push(
      "--python-expr",
      `import bpy; bpy.context.scene.cycles.samples = ${samples}`,
    );
  }

  // Preset-specific extra args (render flags, format, resolution)
  // Substitute $OUTPUT placeholder in extraArgs
  for (const arg of spec.extraArgs) {
    args.push(arg === "$OUTPUT" ? req.outputPath : arg);
  }

  // For native render presets (no pythonExpr), set output path via -o
  if (!spec.pythonExpr) {
    args.push("-o", req.outputPath);
  }

  // Python expression for export presets (glb-export, stl-from-mesh)
  // $OUTPUT is substituted with the actual output path
  if (spec.pythonExpr) {
    const expr = spec.pythonExpr.replace("$OUTPUT", req.outputPath);
    args.push("--python-expr", expr);
  }

  return { command: "blender", args };
}
