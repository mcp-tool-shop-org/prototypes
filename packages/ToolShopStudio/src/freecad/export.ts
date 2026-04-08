import { randomUUID } from "node:crypto";
import {
  ExportPartSchema,
  type ExportPart,
  type FreeCADPreset,
  type FreeCADPartAsset,
  type FreeCADInputProbe,
  type FreeCADOutputProbe,
} from "./schemas.js";
import {
  FREECAD_PRESET_SPECS,
  type FreeCADPresetSpec,
} from "./preset-spec.js";
import { buildFreeCADArgs } from "./build-args.js";
import {
  ensureFreeCADExtension,
  buildFreeCADOutputMetadata,
  computeFreeCADExpiresAt,
} from "./output-polish.js";
import type { FreeCADNotification } from "./types.js";
import type { FreeCADInputCheck, FreeCADAssertionResult } from "./preflight.js";

// ── Abort helpers (same pattern as Pandoc) ──────────────────────

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
export interface ExportPartContext {
  signal: AbortSignal;
  notify: (notification: FreeCADNotification) => void;
  userId: string;
  createAsset: (asset: FreeCADPartAsset) => Promise<void>;

  /** Injected so tests can mock without real FreeCADCmd binary */
  runFreeCAD: (
    args: string[],
    signal: AbortSignal,
    onProgress: (percent: number) => void,
    estimatedSteps: number,
  ) => Promise<void>;

  /** Injected preflight — async (stat-based) */
  checkInput: (filePath: string) => Promise<FreeCADInputCheck>;

  /** Injected postflight — async (stat-based) */
  assertOutput: (
    spec: FreeCADPresetSpec,
    outputPath: string,
    maxOutputBytes: number,
  ) => Promise<FreeCADAssertionResult>;

  /** Injected stat for measuring output size */
  statFile: (filePath: string) => Promise<{ size: number }>;
}

// ── Main pipeline ───────────────────────────────────────────────

/**
 * Full FreeCAD part export pipeline.
 *
 * 1. Validate (Zod parse + sandbox)
 * 2. Preflight input check
 * 3. Build args + run FreeCADCmd (with fallback loop for premium presets)
 * 4. Postflight assertion
 * 5. Create asset + notify ready
 */
export async function exportPart(
  reqRaw: unknown,
  ctx: ExportPartContext,
): Promise<FreeCADPartAsset> {
  // ── 1. Validate ─────────────────────────────────────────────────
  throwIfAborted(ctx.signal);
  const req = ExportPartSchema.parse(reqRaw);
  const assetId = randomUUID();

  // Sandbox validation (throws on escape — imported via preflight re-export)
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

  // Check format compatibility (parametric → mesh warning)
  const { checkFreeCADFormatCompatibility } = await import("./preflight.js");
  const formatCheck = checkFreeCADFormatCompatibility(
    true, // assume parametric for .FCStd — real probe in Phase 4
    FREECAD_PRESET_SPECS[req.preset].exportFormat,
  );
  if (formatCheck.warning) {
    allWarnings.push(formatCheck.warning);
  }

  // Check estimated output size (hard reject if over limit)
  if (req.maxOutputBytes > 0) {
    const { estimateFreeCADOutputBytes } = await import("./preflight.js");
    const est = estimateFreeCADOutputBytes(inputCheck.sizeBytes, req.preset);
    if (est > req.maxOutputBytes) {
      throw new Error(
        `Estimated output ${est} bytes exceeds maxOutputBytes ${req.maxOutputBytes}.`,
      );
    }
  }

  // ── 3. Export with fallback loop ──────────────────────────────
  let currentPreset: FreeCADPreset = req.preset;
  const initialSpec = FREECAD_PRESET_SPECS[currentPreset];
  const maxAttempts = initialSpec.isPremium && initialSpec.fallbackTo ? 2 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    throwIfAborted(ctx.signal);
    const spec = FREECAD_PRESET_SPECS[currentPreset];
    const args = buildFreeCADArgs({ ...req, preset: currentPreset });

    // ── Run FreeCADCmd (catch errors for fallback) ──────────────
    let freecadFailed = false;
    try {
      await ctx.runFreeCAD(
        args,
        ctx.signal,
        (percent) => {
          ctx.notify({
            type: "freecad:progress",
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
        `FreeCAD failed for ${currentPreset}: ${err instanceof Error ? err.message : String(err)}`,
      );
      freecadFailed = true;
    }

    if (!freecadFailed) {
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
          type: "freecad:progress",
          assetId,
          percent: 100,
          preset: currentPreset,
        });

        // One last abort check before creating the asset
        throwIfAborted(ctx.signal);

        return buildAndNotifyAsset(
          assetId, req, currentPreset, allWarnings, ctx,
        );
      }

      // Assertion failed
      allWarnings.push(...assertResult.warnings);
    }

    // ── Fallback to guaranteed preset ────────────────────────────
    if (spec.fallbackTo && attempt + 1 < maxAttempts) {
      ctx.notify({
        type: "freecad:warning",
        assetId,
        warnings: [
          `${freecadFailed ? "Export" : "Assertion"} failed for ${currentPreset}, ` +
            `falling back to ${spec.fallbackTo}.`,
        ],
        preset: currentPreset,
      });
      currentPreset = spec.fallbackTo;
      continue;
    }

    // No more fallbacks — if FreeCAD succeeded but assertion failed, return with warnings
    throwIfAborted(ctx.signal);
    return buildAndNotifyAsset(
      assetId, req, currentPreset, allWarnings, ctx,
    );
  }

  throw new Error("Export loop exhausted without result.");
}

// ── Helper: build asset + fire notifications ────────────────────

async function buildAndNotifyAsset(
  assetId: string,
  req: ExportPart,
  preset: FreeCADPreset,
  warnings: string[],
  ctx: ExportPartContext,
): Promise<FreeCADPartAsset> {
  const spec = FREECAD_PRESET_SPECS[preset];

  // ── Output polish ─────────────────────────────────────────────
  const finalPath = ensureFreeCADExtension(req.outputPath, spec);
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

  const outputProbe = buildFreeCADOutputMetadata(spec, outputSizeBytes);

  // Placeholder input probe — real FreeCAD file probing in later phase
  const inputProbe: FreeCADInputProbe = {
    version: "0.21",
    bodies: 1,
    parametric: true,
    sizeBytes: 0,
  };

  const asset: FreeCADPartAsset = {
    id: assetId,
    inputPath: req.inputPath,
    outputPath: finalPath,
    preset,
    quality: req.quality,
    inputProbe,
    outputProbe,
    warnings,
    expiresAt: computeFreeCADExpiresAt(),
  };

  await ctx.createAsset(asset);
  ctx.notify({
    type: "freecad:ready",
    assetId,
    outputPath: finalPath,
    preset,
    sizeBytes: outputSizeBytes,
  });

  return asset;
}
