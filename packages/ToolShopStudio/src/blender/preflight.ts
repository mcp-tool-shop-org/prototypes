import { stat } from "node:fs/promises";
import { extname } from "node:path";
import type { BlenderPreset } from "./schemas.js";
import type { BlenderPresetSpec } from "./preset-spec.js";
import { BLENDER_PRESET_SPECS } from "./preset-spec.js";

// Re-export validateSandboxPath from root for convenience
export { validateSandboxPath } from "../preflight.js";

// ── Input validation ─────────────────────────────────────────────

/** Max input file size: 500 MB (.blend files are binary and can be large) */
const MAX_INPUT_BYTES = 500 * 1024 * 1024;

export interface BlenderInputCheck {
  ok: boolean;
  warnings: string[];
  sizeBytes: number;
}

/**
 * Validate a Blender input file: exists, not too large, correct extension.
 */
export async function checkBlenderInput(
  filePath: string,
): Promise<BlenderInputCheck> {
  const warnings: string[] = [];

  // Check file exists and get size
  let sizeBytes: number;
  try {
    const s = await stat(filePath);
    sizeBytes = s.size;
  } catch {
    return {
      ok: false,
      warnings: [`Input file not found: ${filePath}`],
      sizeBytes: 0,
    };
  }

  // Extension check
  const ext = extname(filePath).toLowerCase();
  if (ext !== ".blend") {
    return {
      ok: false,
      warnings: [`Input must be .blend, got "${ext}".`],
      sizeBytes,
    };
  }

  // Size check
  if (sizeBytes > MAX_INPUT_BYTES) {
    return {
      ok: false,
      warnings: [
        `Input file ${sizeBytes} bytes exceeds max ${MAX_INPUT_BYTES} bytes.`,
      ],
      sizeBytes,
    };
  }

  if (sizeBytes === 0) {
    warnings.push("Input file is empty.");
  }

  return { ok: true, warnings, sizeBytes };
}

// ── Output size estimation ───────────────────────────────────────

/**
 * Estimate output bytes from input size and preset.
 * Blender .blend files contain everything — output varies widely by preset.
 */
export function estimateBlenderOutputBytes(
  inputSizeBytes: number,
  preset: BlenderPreset,
): number {
  const multipliers: Record<BlenderPreset, number> = {
    "png-preview": 0.5,       // single frame render (compressed PNG)
    "glb-export": 1.5,        // mesh + textures (compressed)
    "video-1080p": 8.0,       // animation frames → video
    "stl-from-mesh": 2.0,     // mesh extraction → binary STL
    "cycles-render": 1.0,     // high-quality single frame (compressed PNG)
  };
  return Math.ceil(inputSizeBytes * multipliers[preset]);
}

// ── Output assertion ─────────────────────────────────────────────

export interface BlenderAssertionResult {
  ok: boolean;
  warnings: string[];
}

/**
 * Post-flight assertion: output file exists, non-zero, within size limits,
 * correct extension. Detects suspicious expansion (>20× input).
 */
export async function assertBlenderOutput(
  spec: BlenderPresetSpec,
  outputPath: string,
  maxOutputBytes: number,
  inputSizeBytes?: number,
): Promise<BlenderAssertionResult> {
  const warnings: string[] = [];

  // Extension check
  const ext = extname(outputPath).toLowerCase().replace(".", "");
  if (ext !== spec.outputExt) {
    warnings.push(
      `Output extension mismatch: expected .${spec.outputExt}, got .${ext || "(none)"}.`,
    );
  }

  let outputSize: number;
  try {
    const s = await stat(outputPath);
    outputSize = s.size;
  } catch {
    return { ok: false, warnings: [...warnings, "Output file not found."] };
  }

  if (outputSize === 0) {
    return { ok: false, warnings: [...warnings, "Output file is empty (0 bytes)."] };
  }

  // Max output check
  if (maxOutputBytes > 0 && outputSize > maxOutputBytes) {
    return {
      ok: false,
      warnings: [
        ...warnings,
        `Output ${outputSize} bytes exceeds maxOutputBytes ${maxOutputBytes}.`,
      ],
    };
  }

  // Suspicious expansion detection
  // Blender renders can legitimately produce large outputs, but >20× is suspicious
  if (inputSizeBytes && inputSizeBytes > 0) {
    const ratio = outputSize / inputSizeBytes;
    if (ratio > 20) {
      warnings.push(
        `Suspicious expansion: output is ${ratio.toFixed(1)}× input size.`,
      );
    }
  }

  return { ok: true, warnings };
}

// ── Dangerous Python expression detection ────────────────────────

/** Patterns that should never appear in Python expressions sent to Blender */
const DANGEROUS_PATTERNS = [
  /\bos\./i,              // os module (file system access)
  /\bsubprocess\./i,      // subprocess (command execution)
  /\bshutil\./i,          // shutil (file operations)
  /\b__import__\b/i,      // dynamic import
  /\beval\s*\(/i,         // eval (code execution)
  /\bexec\s*\(/i,         // exec (code execution)
  /\bopen\s*\(/i,         // file open (except via bpy)
  /\bsocket\b/i,          // network access
] as const;

/**
 * Check a Python expression for potentially dangerous constructs.
 * Returns warnings for each detected pattern.
 * This is a defence-in-depth check — sandbox validation is the primary guard.
 * Only applies to presets with pythonExpr defined.
 */
export function checkBlenderDangerousConstructs(
  pythonExpr: string,
): string[] {
  const warnings: string[] = [];
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(pythonExpr)) {
      warnings.push(
        `Potentially dangerous construct in Python expression: ${pattern.source}`,
      );
    }
  }
  return warnings;
}

// ── Preset safety validation ─────────────────────────────────────

/**
 * Validate all BLENDER_PRESET_SPECS Python expressions for dangerous constructs.
 * Pure function — scans every preset that has a pythonExpr.
 * Returns empty array if all presets are safe.
 */
export function validateBlenderPresetSafety(): string[] {
  const warnings: string[] = [];
  for (const [name, spec] of Object.entries(BLENDER_PRESET_SPECS)) {
    if (spec.pythonExpr) {
      const issues = checkBlenderDangerousConstructs(spec.pythonExpr);
      for (const issue of issues) {
        warnings.push(`${name}: ${issue}`);
      }
    }
  }
  return warnings;
}

// ── Pure output assertion (no I/O) ──────────────────────────────

/**
 * Pure output assertion: checks size, extension, and expansion ratio.
 * Unlike assertBlenderOutput (async + I/O), this takes pre-fetched values
 * for testability and use inside pipeline orchestration.
 */
export function assertBlenderRenderOutput(
  spec: BlenderPresetSpec,
  outputPath: string,
  outputSizeBytes: number,
  maxOutputBytes: number,
  inputSizeBytes?: number,
): BlenderAssertionResult {
  const warnings: string[] = [];

  // Extension check
  const ext = extname(outputPath).toLowerCase().replace(".", "");
  if (ext !== spec.outputExt) {
    warnings.push(
      `Output extension mismatch: expected .${spec.outputExt}, got .${ext || "(none)"}.`,
    );
  }

  if (outputSizeBytes === 0) {
    return { ok: false, warnings: [...warnings, "Output file is empty (0 bytes)."] };
  }

  // Max output check
  if (maxOutputBytes > 0 && outputSizeBytes > maxOutputBytes) {
    return {
      ok: false,
      warnings: [
        ...warnings,
        `Output ${outputSizeBytes} bytes exceeds maxOutputBytes ${maxOutputBytes}.`,
      ],
    };
  }

  // Suspicious expansion detection
  if (inputSizeBytes && inputSizeBytes > 0) {
    const ratio = outputSizeBytes / inputSizeBytes;
    if (ratio > 20) {
      warnings.push(
        `Suspicious expansion: output is ${ratio.toFixed(1)}× input size.`,
      );
    }
  }

  // Render-specific minimum size check (renders should produce meaningful output)
  // PNG should be at least 100 bytes, GLB/STL at least 50 bytes
  const MIN_SIZES: Record<string, number> = { png: 100, glb: 50, stl: 50, mp4: 1000 };
  const minSize = MIN_SIZES[spec.outputExt] ?? 0;
  if (outputSizeBytes > 0 && outputSizeBytes < minSize) {
    warnings.push(
      `Output ${outputSizeBytes} bytes is suspiciously small for .${spec.outputExt} (expected >=${minSize}).`,
    );
  }

  return { ok: true, warnings };
}
