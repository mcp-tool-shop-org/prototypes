import { stat } from "node:fs/promises";
import { extname } from "node:path";
import type { PandocPreset } from "./schemas.js";
import type { PandocPresetSpec } from "./preset-spec.js";

// Re-export validateSandboxPath from root for convenience
export { validateSandboxPath } from "../preflight.js";

// ── Input validation ──────────────────────────────────────────────

/** Max input file size: 50 MB (documents shouldn't be bigger) */
const MAX_INPUT_BYTES = 50 * 1024 * 1024;

/** Allowed input extensions per format */
const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  markdown: [".md", ".markdown", ".mkd", ".txt"],
  docx: [".docx"],
  latex: [".tex", ".latex"],
  html: [".html", ".htm"],
  rst: [".rst"],
  org: [".org"],
};

export interface PandocInputCheck {
  ok: boolean;
  warnings: string[];
  sizeBytes: number;
  detectedFormat: string;
}

/**
 * Validate a Pandoc input file: exists, not too large, recognized extension.
 */
export async function checkPandocInput(
  filePath: string,
): Promise<PandocInputCheck> {
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
      detectedFormat: "unknown",
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
      detectedFormat: "unknown",
    };
  }

  if (sizeBytes === 0) {
    warnings.push("Input file is empty.");
  }

  // Detect format from extension
  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  let detectedFormat = "markdown"; // default

  for (const [format, exts] of Object.entries(ALLOWED_EXTENSIONS)) {
    if (exts.includes(ext)) {
      detectedFormat = format;
      break;
    }
  }

  if (!Object.values(ALLOWED_EXTENSIONS).flat().includes(ext)) {
    warnings.push(
      `Unrecognized extension "${ext}"; assuming markdown. ` +
        `Supported: ${Object.values(ALLOWED_EXTENSIONS).flat().join(", ")}.`,
    );
  }

  return { ok: true, warnings, sizeBytes, detectedFormat };
}

// ── Output size estimation ────────────────────────────────────────

/** Rough expansion multipliers per output format */
const EXPANSION_FACTORS: Record<string, number> = {
  html5: 1.8,    // HTML + embedded resources
  pdf: 0.8,      // PDFs are often smaller than source
  epub: 1.2,     // EPUB with compression
  revealjs: 2.5, // Slides embed reveal.js
  html: 1.5,     // Plain HTML
};

/**
 * Estimate output file size in bytes based on input size and preset.
 */
export function estimatePandocOutputBytes(
  inputSizeBytes: number,
  preset: PandocPreset,
): number {
  // Map preset to output format for factor lookup
  const formatMap: Record<PandocPreset, string> = {
    "blog-post": "html5",
    "academic-pdf": "pdf",
    "ebook": "epub",
    "slides": "revealjs",
    "newsletter": "html",
  };

  const factor = EXPANSION_FACTORS[formatMap[preset]] ?? 1.5;
  return Math.ceil(inputSizeBytes * factor);
}

// ── Output assertions ────────────────────────────────────────────

export interface PandocAssertionResult {
  ok: boolean;
  warnings: string[];
}

/**
 * Assert that the pandoc output file matches the preset spec.
 *
 * Checks:
 * 1. Output file exists
 * 2. Output file is non-empty
 * 3. Output extension matches spec
 * 4. Output size is within maxOutputBytes (if set)
 */
export async function assertPandocOutput(
  spec: PandocPresetSpec,
  outputPath: string,
  maxOutputBytes: number,
): Promise<PandocAssertionResult> {
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
      warnings: ["Output file is empty — pandoc produced no content."],
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

  return { ok: true, warnings };
}

// ── Input format validation (pure) ───────────────────────────────

/**
 * Validate that detected input format is compatible with the preset's
 * expected --from format. Returns a warning if there's a mismatch.
 */
export function checkFormatCompatibility(
  detectedFormat: string,
  presetFrom: string,
): { ok: boolean; warning?: string } {
  // Pandoc is flexible — markdown presets accept most text formats
  if (presetFrom === "markdown") return { ok: true };

  if (detectedFormat !== presetFrom) {
    return {
      ok: true,
      warning:
        `Detected format "${detectedFormat}" differs from preset's ` +
        `expected "${presetFrom}"; pandoc will attempt conversion anyway.`,
    };
  }

  return { ok: true };
}
