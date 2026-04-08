import { randomUUID } from "node:crypto";
import {
  TransformGeoSchema,
  type TransformGeo,
  type GDALPreset,
  type GDALGeoDataAsset,
  type GDALInputProbe,
} from "./schemas.js";
import {
  GDAL_PRESET_SPECS,
  type GDALPresetSpec,
} from "./preset-spec.js";
import { buildGDALArgs, type GDALCommandArgs } from "./build-args.js";
import {
  ensureGDALExtension,
  buildGDALOutputMetadata,
  computeGDALExpiresAt,
} from "./output-polish.js";
import type { GDALNotification } from "./types.js";
import type { GDALInputCheck, GDALAssertionResult } from "./preflight.js";

// ── Abort helpers ────────────────────────────────────────────────
// Called at every pipeline checkpoint:
// validate → preflight → each fallback iteration → postflight → pre-asset

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

// ── Context DI ──────────────────────────────────────────────────

/**
 * Context provided by the caller (MCP handler, CLI, etc).
 * Keeps the pipeline free of global state and fully testable.
 */
export interface TransformGeoContext {
  signal: AbortSignal;
  notify: (notification: GDALNotification) => void;
  userId: string;
  createAsset: (asset: GDALGeoDataAsset) => Promise<void>;

  /** Injected so tests can mock without real GDAL binaries */
  runGDAL: (
    cmd: GDALCommandArgs,
    signal: AbortSignal,
    onProgress: (percent: number) => void,
    estimatedSteps: number,
  ) => Promise<void>;

  /** Injected preflight — async (stat-based) */
  checkInput: (filePath: string) => Promise<GDALInputCheck>;

  /** Injected postflight — async (stat-based) */
  assertOutput: (
    spec: GDALPresetSpec,
    outputPath: string,
    maxOutputBytes: number,
    inputSizeBytes?: number,
  ) => Promise<GDALAssertionResult>;

  /** Injected stat for measuring output size */
  statFile: (filePath: string) => Promise<{ size: number }>;
}

// ── Main pipeline ───────────────────────────────────────────────

/**
 * Full GDAL geospatial transform pipeline.
 *
 * 1. Validate (Zod parse + sandbox)
 * 2. Preflight input check + format compatibility
 * 3. Estimated output size check
 * 4. Build args + run GDAL (with fallback loop for premium presets)
 * 5. Postflight assertion
 * 6. Create asset + notify ready
 */
export async function transformGeo(
  reqRaw: unknown,
  ctx: TransformGeoContext,
): Promise<GDALGeoDataAsset> {
  // ── 1. Validate ─────────────────────────────────────────────────
  throwIfAborted(ctx.signal);
  const req = TransformGeoSchema.parse(reqRaw);
  const assetId = randomUUID();

  // Sandbox validation (throws on escape)
  const { validateSandboxPath } = await import("./preflight.js");
  validateSandboxPath(ctx.userId, req.inputPath);
  validateSandboxPath(ctx.userId, req.outputPath);

  // ── 2. Preflight input check ──────────────────────────────────
  throwIfAborted(ctx.signal);
  const inputCheck = await ctx.checkInput(req.inputPath);
  const allWarnings: string[] = [...inputCheck.warnings];

  if (!inputCheck.ok) {
    throw new Error(
      `Preflight failed: ${inputCheck.warnings.join("; ")}`,
    );
  }

  // Check format compatibility (raster vs vector mismatch)
  const { extname } = await import("node:path");
  const { checkGDALFormatCompatibility } = await import("./preflight.js");
  const inputExt = extname(req.inputPath).toLowerCase();
  const formatCheck = checkGDALFormatCompatibility(inputExt, req.preset);
  if (!formatCheck.ok) {
    throw new Error(formatCheck.warning ?? "Format incompatible.");
  }
  if (formatCheck.warning) {
    allWarnings.push(formatCheck.warning);
  }

  // ── 3. Estimated output size check ────────────────────────────
  if (req.maxOutputBytes > 0) {
    const { estimateGDALOutputBytes } = await import("./preflight.js");
    const est = estimateGDALOutputBytes(inputCheck.sizeBytes, req.preset);
    if (est > req.maxOutputBytes) {
      throw new Error(
        `Estimated output ${est} bytes exceeds maxOutputBytes ${req.maxOutputBytes}.`,
      );
    }
  }

  // ── 4. Transform with fallback loop ────────────────────────────
  // Premium presets (clip-raster) get 2 attempts: premium first, then fallback.
  // Guaranteed presets get exactly 1 attempt — no fallback.
  // AbortError always rethrows — never falls back on cancellation.
  let currentPreset: GDALPreset = req.preset;
  const initialSpec = GDAL_PRESET_SPECS[currentPreset];
  const maxAttempts = initialSpec.isPremium && initialSpec.fallbackTo ? 2 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    throwIfAborted(ctx.signal);
    const spec = GDAL_PRESET_SPECS[currentPreset];
    const cmd = buildGDALArgs({ ...req, preset: currentPreset });

    // ── Run GDAL (catch errors for fallback) ─────────────────────
    let gdalFailed = false;
    try {
      await ctx.runGDAL(
        cmd,
        ctx.signal,
        (percent) => {
          ctx.notify({
            type: "gdal:progress",
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
        `GDAL failed for ${currentPreset}: ${err instanceof Error ? err.message : String(err)}`,
      );
      gdalFailed = true;
    }

    if (!gdalFailed) {
      // ── 5. Postflight assertion ─────────────────────────────────
      throwIfAborted(ctx.signal);
      const assertResult = await ctx.assertOutput(
        spec,
        req.outputPath,
        req.maxOutputBytes,
        inputCheck.sizeBytes,
      );

      if (assertResult.ok) {
        allWarnings.push(...assertResult.warnings);

        // Final 100% progress before asset creation
        ctx.notify({
          type: "gdal:progress",
          assetId,
          percent: 100,
          preset: currentPreset,
        });

        // One last abort check before creating the asset
        throwIfAborted(ctx.signal);

        return buildAndNotifyAsset(
          assetId, req, currentPreset, inputCheck.sizeBytes, allWarnings, ctx,
        );
      }

      // Assertion failed
      allWarnings.push(...assertResult.warnings);
    }

    // ── Fallback to guaranteed preset ────────────────────────────
    if (spec.fallbackTo && attempt + 1 < maxAttempts) {
      ctx.notify({
        type: "gdal:warning",
        assetId,
        warnings: [
          `${gdalFailed ? "Transform" : "Assertion"} failed for ${currentPreset}, ` +
            `falling back to ${spec.fallbackTo}.`,
        ],
        preset: currentPreset,
      });
      currentPreset = spec.fallbackTo;
      continue;
    }

    // No more fallbacks — return with warnings
    throwIfAborted(ctx.signal);

    // Final 100% progress
    ctx.notify({
      type: "gdal:progress",
      assetId,
      percent: 100,
      preset: currentPreset,
    });

    return buildAndNotifyAsset(
      assetId, req, currentPreset, inputCheck.sizeBytes, allWarnings, ctx,
    );
  }

  throw new Error("Transform loop exhausted without result.");
}

// ── Helper: build asset + fire notifications ────────────────────

async function buildAndNotifyAsset(
  assetId: string,
  req: TransformGeo,
  preset: GDALPreset,
  inputSizeBytes: number,
  warnings: string[],
  ctx: TransformGeoContext,
): Promise<GDALGeoDataAsset> {
  const spec = GDAL_PRESET_SPECS[preset];

  // ── Output polish ─────────────────────────────────────────────
  const finalPath = ensureGDALExtension(req.outputPath, spec);
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

  const outputProbe = buildGDALOutputMetadata(spec, outputSizeBytes);

  // Placeholder input probe — real gdalinfo probing in later phase
  const inputProbe: GDALInputProbe = {
    format: "unknown",
    crs: "unknown",
    sizeBytes: inputSizeBytes,
  };

  const asset: GDALGeoDataAsset = {
    id: assetId,
    inputPath: req.inputPath,
    outputPath: finalPath,
    preset,
    quality: req.quality,
    inputProbe,
    outputProbe,
    warnings,
    expiresAt: computeGDALExpiresAt(),
  };

  await ctx.createAsset(asset);
  ctx.notify({
    type: "gdal:ready",
    assetId,
    outputPath: finalPath,
    preset,
    sizeBytes: outputSizeBytes,
  });

  return asset;
}
