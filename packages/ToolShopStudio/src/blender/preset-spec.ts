import type { BlenderPreset, BlenderQuality } from "./schemas.js";

// ── Preset specification ─────────────────────────────────────────

export interface BlenderPresetSpec {
  /** Output file extension (without dot) */
  outputExt: string;
  /** Output format name for metadata */
  outputFormat: string;
  /** Extra CLI args appended after base args (render flags, format, etc.) */
  extraArgs: string[];
  /** Safe Python one-liner for export presets (glb/stl). Undefined = native render. */
  pythonExpr?: string;
  /** Engine selection flags (e.g. ["--engine", "CYCLES"]). Empty = default engine. */
  engineArgs: string[];
  /** Premium presets get fallback on failure */
  isPremium: boolean;
  /** Fallback preset (null = guaranteed, no fallback) */
  fallbackTo: BlenderPreset | null;
  /** Estimated processing steps for progress tracking */
  estimatedSteps: number;
}

export const BLENDER_PRESET_SPECS: Record<BlenderPreset, BlenderPresetSpec> = {
  "png-preview": {
    outputExt: "png",
    outputFormat: "PNG",
    extraArgs: ["--render-frame", "1"],
    engineArgs: ["--engine", "BLENDER_WORKBENCH"],
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 4,
  },
  "glb-export": {
    outputExt: "glb",
    outputFormat: "GLB",
    extraArgs: [],
    pythonExpr: 'import bpy; bpy.ops.export_scene.gltf(filepath="$OUTPUT", export_format="GLB")',
    engineArgs: [],
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 6,
  },
  "video-1080p": {
    outputExt: "mp4",
    outputFormat: "MP4",
    extraArgs: [
      "--render-output", "$OUTPUT",
      "--render-format", "FFMPEG",
      "--render-anim",
      "-x", "1920", "-y", "1080",
    ],
    engineArgs: [],
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 12,
  },
  "stl-from-mesh": {
    outputExt: "stl",
    outputFormat: "STL",
    extraArgs: [],
    pythonExpr: 'import bpy; bpy.ops.export_mesh.stl(filepath="$OUTPUT")',
    engineArgs: [],
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 5,
  },
  "cycles-render": {
    outputExt: "png",
    outputFormat: "PNG",
    extraArgs: ["--render-frame", "1"],
    engineArgs: ["--engine", "CYCLES"],
    isPremium: true,
    fallbackTo: "png-preview",
    estimatedSteps: 25,
  },
} as const;

// ── Base args (always applied) ───────────────────────────────────

/**
 * Base CLI args shared by all Blender invocations.
 * -b runs in background (headless), -noaudio disables audio device init.
 */
export function buildBlenderBaseArgs(): string[] {
  return ["-b", "-noaudio"];
}

// ── Quality → Cycles samples mapping ────────────────────────────

/**
 * Map quality tier to Cycles render sample count.
 * Higher samples = better quality = slower render.
 *
 * - draft:    64 samples  (fast preview)
 * - standard: 256 samples (balanced)
 * - high:     1024 samples (production)
 */
const QUALITY_SAMPLES: Record<BlenderQuality, number> = {
  draft: 64,
  standard: 256,
  high: 1024,
};

export function qualityToSamples(quality: BlenderQuality): number {
  return QUALITY_SAMPLES[quality];
}
