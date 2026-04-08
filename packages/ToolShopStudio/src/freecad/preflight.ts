import { stat } from "node:fs/promises";
import { extname } from "node:path";
import type { FreeCADPreset } from "./schemas.js";
import type { FreeCADPresetSpec } from "./preset-spec.js";

// Re-export validateSandboxPath from root for convenience
export { validateSandboxPath } from "../preflight.js";

// ── Input validation ─────────────────────────────────────────────

/** Max input file size: 500 MB (CAD files can be large) */
const MAX_INPUT_BYTES = 500 * 1024 * 1024;

/** Allowed input extensions for FreeCAD */
const ALLOWED_EXTENSIONS = [".fcstd"];

export interface FreeCADInputCheck {
  ok: boolean;
  warnings: string[];
  sizeBytes: number;
}

/**
 * Validate a FreeCAD input file: exists, not too large, correct extension.
 */
export async function checkFreeCADInput(
  filePath: string,
): Promise<FreeCADInputCheck> {
  const warnings: string[] = [];

  // Check file exists and get size
  let sizeBytes: number;
  try {
    const s = await stat(filePath);
    sizeBytes = s.size;
  } catch {
    return {
      ok: false,
      warnings: [`Input file not found: "${filePath}".`],
      sizeBytes: 0,
    };
  }

  if (sizeBytes > MAX_INPUT_BYTES) {
    return {
      ok: false,
      warnings: [
        `Input file is ${(sizeBytes / 1024 / 1024).toFixed(1)} MB, ` +
          `exceeds maximum ${MAX_INPUT_BYTES / 1024 / 1024} MB.`,
      ],
      sizeBytes,
    };
  }

  if (sizeBytes === 0) {
    warnings.push("Input file is empty.");
  }

  // Validate extension
  const ext = extname(filePath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      ok: false,
      warnings: [
        `Input must be a .FCStd file, got "${ext}". ` +
          `Supported: ${ALLOWED_EXTENSIONS.join(", ")}.`,
      ],
      sizeBytes,
    };
  }

  return { ok: true, warnings, sizeBytes };
}

// ── Output size estimation ───────────────────────────────────────

/** Rough expansion multipliers per export format */
const EXPANSION_FACTORS: Record<string, number> = {
  STL: 1.5,  // mesh tessellation expands
  STEP: 0.9, // STEP is often compact
  GLB: 0.8,  // compressed binary glTF
  "3MF": 1.8, // color + material data
  OBJ: 1.3,  // text-based mesh
};

/**
 * Estimate output file size in bytes based on input size and preset.
 */
export function estimateFreeCADOutputBytes(
  inputSizeBytes: number,
  preset: FreeCADPreset,
): number {
  // Map preset to export format for factor lookup
  const formatMap: Record<FreeCADPreset, string> = {
    "stl-print-ready": "STL",
    "step-precision": "STEP",
    "glb-web-ready": "GLB",
    "3mf-slicer-ready": "3MF",
    "obj-mesh": "OBJ",
  };

  const factor = EXPANSION_FACTORS[formatMap[preset]] ?? 1.3;
  return Math.ceil(inputSizeBytes * factor);
}

// ── Output assertions ───────────────────────────────────────────

export interface FreeCADAssertionResult {
  ok: boolean;
  warnings: string[];
}

/** Minimum viable file sizes for mesh formats (bytes) */
const MIN_MESH_BYTES: Record<string, number> = {
  STL: 100,  // valid binary STL header alone is 80 bytes
  OBJ: 50,   // at minimum: v/f lines
  "3MF": 100,
};

/**
 * Assert that the FreeCAD output file matches the preset spec.
 *
 * Checks:
 * 1. Output file exists
 * 2. Output file is non-empty
 * 3. Output extension matches spec
 * 4. Output size is within maxOutputBytes (if set)
 * 5. Mesh-specific sanity (STL/OBJ/3MF minimum viable size)
 */
export async function assertFreeCADOutput(
  spec: FreeCADPresetSpec,
  outputPath: string,
  maxOutputBytes: number,
): Promise<FreeCADAssertionResult> {
  const warnings: string[] = [];

  // Check file exists and get size
  let sizeBytes: number;
  try {
    const s = await stat(outputPath);
    sizeBytes = s.size;
  } catch {
    return {
      ok: false,
      warnings: [`Output file not found: "${outputPath}".`],
    };
  }

  // Check non-empty
  if (sizeBytes === 0) {
    return {
      ok: false,
      warnings: ["Output file is empty — FreeCAD produced no content."],
    };
  }

  // Check extension matches spec
  const actualExt = extname(outputPath).slice(1).toLowerCase();
  if (actualExt && actualExt !== spec.outputExt) {
    warnings.push(
      `Output extension ".${actualExt}" does not match expected ".${spec.outputExt}".`,
    );
  }

  // Check maxOutputBytes (0 = unlimited)
  if (maxOutputBytes > 0 && sizeBytes > maxOutputBytes) {
    return {
      ok: false,
      warnings: [
        `Output is ${(sizeBytes / 1024 / 1024).toFixed(1)} MB, ` +
          `exceeds maximum ${(maxOutputBytes / 1024 / 1024).toFixed(1)} MB.`,
      ],
    };
  }

  // Mesh-specific sanity: degenerate output detection
  const minBytes = MIN_MESH_BYTES[spec.exportFormat];
  if (minBytes && sizeBytes < minBytes) {
    warnings.push(
      `Output is only ${sizeBytes} bytes — likely a degenerate ${spec.exportFormat} mesh.`,
    );
  }

  return { ok: warnings.length === 0, warnings };
}

// ── Format compatibility check (pure) ───────────────────────────

/**
 * Validate that the requested output format is compatible with the input.
 * STEP → any format is fine; mesh formats may lose parametric data.
 */
export function checkFreeCADFormatCompatibility(
  inputParametric: boolean,
  exportFormat: string,
): { ok: boolean; warning?: string } {
  // Converting parametric to mesh formats loses parametric info
  if (inputParametric && ["STL", "OBJ", "GLB"].includes(exportFormat)) {
    return {
      ok: true,
      warning:
        `Input is parametric but exporting to ${exportFormat} (mesh); ` +
        `parametric data will be lost. Consider STEP for lossless export.`,
    };
  }

  return { ok: true };
}
