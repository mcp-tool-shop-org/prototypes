import { randomUUID } from "node:crypto";
import {
  ConvertDocumentSchema,
  type ConvertDocument,
  type PandocPreset,
  type PandocDocumentAsset,
  type PandocInputMetadata,
} from "./schemas.js";
import {
  PANDOC_PRESET_SPECS,
  type PandocPresetSpec,
} from "./preset-spec.js";
import { buildPandocArgs } from "./build-args.js";
import {
  ensureCorrectExtension,
  buildOutputMetadata,
  computeExpiresAt,
} from "./output-polish.js";
import type { PandocNotification } from "./types.js";
import type { PandocInputCheck, PandocAssertionResult } from "./preflight.js";

// ── Abort helpers (same pattern as FFmpeg) ───────────────────────

/** Throw if signal is already aborted. */
export function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
}

/** Type guard for AbortError from any source. */
export function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (err instanceof Error && err.name === "AbortError") return true;
  return false;
}

// ── Context DI ───────────────────────────────────────────────────

/**
 * Context provided by the caller (MCP handler, CLI, etc).
 * Keeps the pipeline free of global state and fully testable.
 */
export interface ConvertDocumentContext {
  signal: AbortSignal;
  notify: (notification: PandocNotification) => void;
  userId: string;
  createAsset: (asset: PandocDocumentAsset) => Promise<void>;

  /** Injected so tests can mock without real pandoc binary */
  runPandoc: (
    args: string[],
    signal: AbortSignal,
    onProgress: (percent: number) => void,
    estimatedSteps: number,
  ) => Promise<void>;

  /** Injected preflight — async (stat-based) */
  checkInput: (filePath: string) => Promise<PandocInputCheck>;

  /** Injected postflight — async (stat-based) */
  assertOutput: (
    spec: PandocPresetSpec,
    outputPath: string,
    maxOutputBytes: number,
  ) => Promise<PandocAssertionResult>;

  /** Injected stat for measuring output size */
  statFile: (filePath: string) => Promise<{ size: number }>;
}

// ── Main pipeline ────────────────────────────────────────────────

/**
 * Full Pandoc document conversion pipeline.
 *
 * 1. Validate (Zod parse + sandbox)
 * 2. Preflight input check
 * 3. Build args + run pandoc (with fallback loop for premium presets)
 * 4. Postflight assertion
 * 5. Create asset + notify ready
 */
export async function convertDocument(
  reqRaw: unknown,
  ctx: ConvertDocumentContext,
): Promise<PandocDocumentAsset> {
  // ── 1. Validate ─────────────────────────────────────────────────
  throwIfAborted(ctx.signal);
  const req = ConvertDocumentSchema.parse(reqRaw);
  const assetId = randomUUID();

  // Sandbox validation (throws on escape — imported via preflight re-export)
  const { validateSandboxPath } = await import("./preflight.js");
  validateSandboxPath(ctx.userId, req.inputPath);
  validateSandboxPath(ctx.userId, req.outputPath);

  // ── 2. Preflight input check ────────────────────────────────────
  throwIfAborted(ctx.signal);
  const inputCheck = await ctx.checkInput(req.inputPath);
  const allWarnings: string[] = [...inputCheck.warnings];

  if (!inputCheck.ok) {
    throw new Error(
      `Preflight failed: ${inputCheck.warnings.join("; ")}`,
    );
  }

  // Check format compatibility
  const { checkFormatCompatibility } = await import("./preflight.js");
  const formatCheck = checkFormatCompatibility(
    inputCheck.detectedFormat,
    PANDOC_PRESET_SPECS[req.preset].from,
  );
  if (formatCheck.warning) {
    allWarnings.push(formatCheck.warning);
  }

  // Check estimated output size (hard reject if over limit)
  if (req.maxOutputBytes > 0) {
    const { estimatePandocOutputBytes } = await import("./preflight.js");
    const est = estimatePandocOutputBytes(inputCheck.sizeBytes, req.preset);
    if (est > req.maxOutputBytes) {
      throw new Error(
        `Estimated output ${est} bytes exceeds maxOutputBytes ${req.maxOutputBytes}.`,
      );
    }
  }

  const inputMetadata: PandocInputMetadata = {
    format: inputCheck.detectedFormat,
    sizeBytes: inputCheck.sizeBytes,
  };

  // ── 3. Convert with fallback loop ───────────────────────────────
  let currentPreset: PandocPreset = req.preset;
  const initialSpec = PANDOC_PRESET_SPECS[currentPreset];
  const maxAttempts = initialSpec.isPremium && initialSpec.fallbackTo ? 2 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    throwIfAborted(ctx.signal);
    const spec = PANDOC_PRESET_SPECS[currentPreset];
    const args = buildPandocArgs({ ...req, preset: currentPreset });

    // ── Run pandoc (catch errors for fallback) ──────────────────
    let pandocFailed = false;
    try {
      await ctx.runPandoc(
        args,
        ctx.signal,
        (percent) => {
          ctx.notify({
            type: "pandoc:progress",
            assetId,
            percent,
            preset: currentPreset,
          });
        },
        spec.estimatedSteps,
      );
    } catch (err: unknown) {
      // AbortError always rethrows — no fallback
      if (isAbortError(err)) throw err;

      if (!spec.fallbackTo || attempt + 1 >= maxAttempts) throw err;

      allWarnings.push(
        `pandoc failed for ${currentPreset}: ${err instanceof Error ? err.message : String(err)}`,
      );
      pandocFailed = true;
    }

    if (!pandocFailed) {
      // ── 4. Postflight assertion ─────────────────────────────────
      throwIfAborted(ctx.signal);
      const assertResult = await ctx.assertOutput(
        spec,
        req.outputPath,
        req.maxOutputBytes,
      );

      if (assertResult.ok) {
        allWarnings.push(...assertResult.warnings);

        // Final 100% progress before asset creation
        ctx.notify({
          type: "pandoc:progress",
          assetId,
          percent: 100,
          preset: currentPreset,
        });

        // One last abort check before creating the asset
        throwIfAborted(ctx.signal);

        return buildAndNotifyAsset(
          assetId, req, inputMetadata, currentPreset, allWarnings, ctx,
        );
      }

      // Assertion failed
      allWarnings.push(...assertResult.warnings);
    }

    // ── Fallback to guaranteed preset ─────────────────────────────
    if (spec.fallbackTo && attempt + 1 < maxAttempts) {
      ctx.notify({
        type: "pandoc:warning",
        assetId,
        warnings: [
          `${pandocFailed ? "Conversion" : "Assertion"} failed for ${currentPreset}, ` +
            `falling back to ${spec.fallbackTo}.`,
        ],
        preset: currentPreset,
      });
      currentPreset = spec.fallbackTo;
      continue;
    }

    // No more fallbacks — if pandoc failed, the error was already thrown above
    // Pandoc succeeded but assertion failed — return with warnings
    throwIfAborted(ctx.signal);
    return buildAndNotifyAsset(
      assetId, req, inputMetadata, currentPreset, allWarnings, ctx,
    );
  }

  throw new Error("Convert loop exhausted without result.");
}

// ── Helper: build asset + fire notifications ─────────────────────

async function buildAndNotifyAsset(
  assetId: string,
  req: ConvertDocument,
  inputMetadata: PandocInputMetadata,
  preset: PandocPreset,
  warnings: string[],
  ctx: ConvertDocumentContext,
): Promise<PandocDocumentAsset> {
  const spec = PANDOC_PRESET_SPECS[preset];

  // ── Output polish ─────────────────────────────────────────────
  const finalPath = ensureCorrectExtension(req.outputPath, spec);
  if (finalPath !== req.outputPath) {
    warnings.push(
      `Output path auto-corrected from "${req.outputPath}" to "${finalPath}".`,
    );
  }

  // Measure output
  let outputSizeBytes = 0;
  try {
    const s = await ctx.statFile(finalPath);
    outputSizeBytes = s.size;
  } catch {
    warnings.push("Could not stat output file for metadata.");
  }

  const outputMetadata = buildOutputMetadata(spec, outputSizeBytes);

  const asset: PandocDocumentAsset = {
    id: assetId,
    inputPath: req.inputPath,
    outputPath: finalPath,
    preset,
    inputMetadata,
    outputMetadata,
    warnings,
    expiresAt: computeExpiresAt(),
  };

  await ctx.createAsset(asset);
  ctx.notify({
    type: "pandoc:ready",
    assetId,
    outputPath: finalPath,
    preset,
    sizeBytes: outputSizeBytes,
  });

  return asset;
}
