import type { ConvertDocument } from "./schemas.js";
import { PANDOC_PRESET_SPECS, buildPandocBaseArgs } from "./preset-spec.js";

// ── Pure arg builder — no I/O, fully deterministic ───────────────

/**
 * Build the full pandoc CLI argument array from a validated request.
 *
 * Order: base args → --from/--to → preset extras → optional overrides → -o output → input
 * This is the Pandoc equivalent of the FFmpeg buildFlags function.
 */
export function buildPandocArgs(req: ConvertDocument): string[] {
  const spec = PANDOC_PRESET_SPECS[req.preset];

  const args: string[] = [
    ...buildPandocBaseArgs(),
    "--from", spec.from,
    "--to", spec.to,
    ...spec.extraArgs,
  ];

  // ── Optional overrides from request ──────────────────────────
  if (req.templatePath) {
    args.push("--template", req.templatePath);
  }

  if (req.bibliographyPath) {
    args.push("--bibliography", req.bibliographyPath);
  }

  if (req.cssPath) {
    args.push("--css", req.cssPath);
  }

  // ── Output + input (must be last) ────────────────────────────
  args.push("-o", req.outputPath);
  args.push(req.inputPath);

  return args;
}
