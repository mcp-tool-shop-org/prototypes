import type { TransformGeo } from "./schemas.js";
import { GDAL_PRESET_SPECS, buildGDALBaseArgs } from "./preset-spec.js";
import type { GDALBinary } from "./preset-spec.js";

// ── Pure arg builder — no I/O, fully deterministic ───────────────

export interface GDALCommandArgs {
  /** The GDAL binary to invoke (gdalwarp, ogr2ogr, gdal_translate) */
  command: GDALBinary;
  /** Full resolved argument array (base args + template with placeholders replaced) */
  args: string[];
}

/**
 * Build the full GDAL CLI command + argument array from a validated request.
 *
 * Resolves argsTemplate placeholders:
 * - $INPUT  → req.inputPath
 * - $OUTPUT → req.outputPath
 * - $BBOX   → req.bbox spread as 4 separate args (minX minY maxX maxY)
 *
 * If $BBOX is in template but req.bbox is not provided, $BBOX is removed.
 * Quality tier appends --quality flag for non-standard tiers.
 */
export function buildGDALArgs(req: TransformGeo): GDALCommandArgs {
  const spec = GDAL_PRESET_SPECS[req.preset];

  const resolved: string[] = [];
  for (const token of spec.argsTemplate) {
    if (token === "$INPUT") {
      resolved.push(req.inputPath);
    } else if (token === "$OUTPUT") {
      resolved.push(req.outputPath);
    } else if (token === "$BBOX") {
      // Expand bbox as 4 separate numeric args for GDAL -te
      if (req.bbox) {
        resolved.push(...req.bbox.map(String));
      }
      // If no bbox, skip the placeholder (removes $BBOX from args)
    } else {
      resolved.push(token);
    }
  }

  const args: string[] = [
    ...buildGDALBaseArgs(),
    ...resolved,
  ];

  // Append quality tier override (only when non-standard)
  if (req.quality !== "standard") {
    args.push(`--quality=${req.quality}`);
  }

  return { command: spec.command, args };
}
