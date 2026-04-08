import type { OpenSCADPreset, OpenSCADQuality } from "./schemas.js";

// ── Preset specification ─────────────────────────────────────────

export interface OpenSCADPresetSpec {
  /** Output file extension (without dot) */
  outputExt: string;
  /** Output format name for metadata */
  outputFormat: string;
  /** Extra CLI args appended after base args */
  extraArgs: string[];
  /** Premium presets get fallback on failure */
  isPremium: boolean;
  /** Fallback preset (null = guaranteed, no fallback) */
  fallbackTo: OpenSCADPreset | null;
  /** Estimated processing steps for progress tracking */
  estimatedSteps: number;
}

export const OPENSCAD_PRESET_SPECS: Record<OpenSCADPreset, OpenSCADPresetSpec> = {
  "stl-print-ready": {
    outputExt: "stl",
    outputFormat: "STL",
    extraArgs: ["--render"],
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 7,
  },
  "obj-mesh": {
    outputExt: "obj",
    outputFormat: "OBJ",
    extraArgs: [],
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 5,
  },
  "3mf-color": {
    outputExt: "3mf",
    outputFormat: "3MF",
    extraArgs: ["--render"],
    isPremium: true,
    fallbackTo: "stl-print-ready",
    estimatedSteps: 9,
  },
  "png-preview": {
    outputExt: "png",
    outputFormat: "PNG",
    extraArgs: ["--preview", "--viewall"],
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 4,
  },
  "dxf-2d": {
    outputExt: "dxf",
    outputFormat: "DXF",
    extraArgs: ["--render"],
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 6,
  },
} as const;

// ── Base args (always applied) ───────────────────────────────────

/**
 * Base CLI args shared by all OpenSCAD invocations.
 * -q suppresses console output, --hardwarnings treats warnings as errors.
 */
export function buildOpenSCADBaseArgs(): string[] {
  return ["-q", "--hardwarnings"];
}

// ── Quality → $fn mapping ────────────────────────────────────────

/**
 * Map quality tier to OpenSCAD's $fn (fragment count).
 * Higher $fn = smoother curves = slower render.
 *
 * - draft:    $fn=16  (fast preview)
 * - standard: $fn=32  (balanced)
 * - high:     $fn=64  (smooth, production)
 */
const QUALITY_FN: Record<OpenSCADQuality, number> = {
  draft: 16,
  standard: 32,
  high: 64,
};

export function qualityToFn(quality: OpenSCADQuality): number {
  return QUALITY_FN[quality];
}
