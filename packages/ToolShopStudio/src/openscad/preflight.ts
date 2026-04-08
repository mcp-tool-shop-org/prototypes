import { stat } from "node:fs/promises";
import { extname } from "node:path";
import type { OpenSCADPreset } from "./schemas.js";
import type { OpenSCADPresetSpec } from "./preset-spec.js";

// Re-export validateSandboxPath from root for convenience
export { validateSandboxPath } from "../preflight.js";

// ── Input validation ─────────────────────────────────────────────

/** Max input file size: 50 MB (.scad files are text — this is generous) */
const MAX_INPUT_BYTES = 50 * 1024 * 1024;

export interface OpenSCADInputCheck {
  ok: boolean;
  warnings: string[];
  sizeBytes: number;
  lines: number;
}

/**
 * Validate an OpenSCAD input file: exists, not too large, correct extension.
 */
export async function checkOpenSCADInput(
  filePath: string,
): Promise<OpenSCADInputCheck> {
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
      lines: 0,
    };
  }

  // Extension check
  const ext = extname(filePath).toLowerCase();
  if (ext !== ".scad") {
    return {
      ok: false,
      warnings: [`Input must be .scad, got "${ext}".`],
      sizeBytes,
      lines: 0,
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
      lines: 0,
    };
  }

  if (sizeBytes === 0) {
    warnings.push("Input file is empty.");
  }

  // Line count (estimate from size — actual counting happens in runtime probe)
  const estimatedLines = Math.max(1, Math.ceil(sizeBytes / 40));

  return { ok: true, warnings, sizeBytes, lines: estimatedLines };
}

// ── Output size estimation ───────────────────────────────────────

/**
 * Estimate output bytes from input size and preset.
 * STL/3MF/OBJ expand significantly from text .scad source.
 * PNG/DXF are smaller.
 */
export function estimateOpenSCADOutputBytes(
  inputSizeBytes: number,
  preset: OpenSCADPreset,
): number {
  const multipliers: Record<OpenSCADPreset, number> = {
    "stl-print-ready": 8.0,   // text → binary mesh (large expansion)
    "obj-mesh": 6.0,           // text → mesh
    "3mf-color": 10.0,         // text → compressed 3MF with color
    "png-preview": 2.0,        // rendered image
    "dxf-2d": 3.0,             // 2D projection
  };
  return Math.ceil(inputSizeBytes * multipliers[preset]);
}

// ── Output assertion ─────────────────────────────────────────────

export interface OpenSCADAssertionResult {
  ok: boolean;
  warnings: string[];
}

/**
 * Post-flight assertion: output file exists, non-zero, within size limits,
 * correct extension. Detects suspicious expansion (>50× input for mesh outputs).
 */
export async function assertOpenSCADOutput(
  spec: OpenSCADPresetSpec,
  outputPath: string,
  maxOutputBytes: number,
  inputSizeBytes?: number,
): Promise<OpenSCADAssertionResult> {
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
  // .scad → mesh can legitimately expand a lot, but >50× is suspicious
  if (inputSizeBytes && inputSizeBytes > 0) {
    const ratio = outputSize / inputSizeBytes;
    if (ratio > 50) {
      warnings.push(
        `Suspicious expansion: output is ${ratio.toFixed(1)}× input size.`,
      );
    }
  }

  return { ok: true, warnings };
}

// ── Dangerous construct detection ────────────────────────────────

/** Patterns that should never appear in user-submitted .scad files */
const DANGEROUS_PATTERNS = [
  /\bimport\s*\(/i,     // file import (path traversal risk)
  /\bsurface\s*\(/i,    // surface() reads external files
  /\binclude\s*</i,     // include <file> directive
  /\buse\s*</i,         // use <file> directive
] as const;

/**
 * Check a .scad source string for potentially dangerous constructs.
 * Returns warnings for each detected pattern.
 * This is a defence-in-depth check — sandbox validation is the primary guard.
 */
export function checkOpenSCADDangerousConstructs(
  source: string,
): string[] {
  const warnings: string[] = [];
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(source)) {
      warnings.push(
        `Potentially dangerous construct detected: ${pattern.source}`,
      );
    }
  }
  return warnings;
}
