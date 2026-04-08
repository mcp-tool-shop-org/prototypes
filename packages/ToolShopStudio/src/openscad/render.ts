import { randomUUID } from "node:crypto";
import {
  RenderModelSchema,
  type RenderModel,
  type OpenSCADPreset,
  type OpenSCADModelAsset,
  type OpenSCADInputProbe,
} from "./schemas.js";
import {
  OPENSCAD_PRESET_SPECS,
  type OpenSCADPresetSpec,
} from "./preset-spec.js";
import { buildOpenSCADArgs, type OpenSCADCommandArgs } from "./build-args.js";
import {
  ensureOpenSCADExtension,
  buildOpenSCADOutputMetadata,
  computeOpenSCADExpiresAt,
} from "./output-polish.js";
import type { OpenSCADNotification } from "./types.js";
import type { OpenSCADInputCheck, OpenSCADAssertionResult } from "./preflight.js";

// ── Abort helpers ────────────────────────────────────────────────
// 7 checkpoints: validate → preflight → size-check → each fallback
//   iteration → postflight → pre-100% → pre-asset

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
export interface RenderModelContext {
  signal: AbortSignal;
  notify: (notification: OpenSCADNotification) => void;
  userId: string;
  createAsset: (asset: OpenSCADModelAsset) => Promise<void>;

  /** Injected so tests can mock without real OpenSCAD binary */
  runOpenSCAD: (
    cmd: OpenSCADCommandArgs,
    signal: AbortSignal,
    onProgress: (percent: number) => void,
    estimatedSteps: number,
  ) => Promise<void>;

  /** Injected preflight — async (stat-based) */
  checkInput: (filePath: string) => Promise<OpenSCADInputCheck>;

  /** Injected postflight — async (stat-based) */
  assertOutput: (
    spec: OpenSCADPresetSpec,
    outputPath: string,
    maxOutputBytes: number,
    inputSizeBytes?: number,
  ) => Promise<OpenSCADAssertionResult>;

  /** Injected stat for measuring output size */
  statFile: (filePath: string) => Promise<{ size: number }>;
}

// ── Main pipeline ───────────────────────────────────────────────

/**
 * Full OpenSCAD render pipeline.
 *
 * 1. Validate (Zod parse + sandbox)
 * 2. Preflight input check
 * 3. Estimated output size check
 * 4. Build args + run OpenSCAD (with fallback loop for premium presets)
 * 5. Postflight assertion
 * 6. Create asset + notify ready
 */
export async function renderModel(
  reqRaw: unknown,
  ctx: RenderModelContext,
): Promise<OpenSCADModelAsset> {
  // ── 1. Validate ─────────────────────────────────────────────────
  throwIfAborted(ctx.signal);
  const req = RenderModelSchema.parse(reqRaw);
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

  // ── 3. Estimated output size check ────────────────────────────
  throwIfAborted(ctx.signal);
  if (req.maxOutputBytes > 0) {
    const { estimateOpenSCADOutputBytes } = await import("./preflight.js");
    const est = estimateOpenSCADOutputBytes(inputCheck.sizeBytes, req.preset);
    if (est > req.maxOutputBytes) {
      throw new Error(
        `Estimated output ${est} bytes exceeds maxOutputBytes ${req.maxOutputBytes}.`,
      );
    }
  }

  // ── 4. Render with fallback loop ──────────────────────────────
  //
  // Fallback strategy (spec-driven, no allowFallback flag):
  //
  //   Premium presets (3mf-color) get 2 attempts:
  //     attempt 0: premium preset
  //     attempt 1: spec.fallbackTo (stl-print-ready)
  //
  //   Guaranteed presets get exactly 1 attempt — no fallback.
  //
  //   AbortError ALWAYS rethrows — never falls back on cancellation.
  //   Non-abort errors fall back if attempts remain.
  //   Assertion failures also trigger fallback.
  //
  let currentPreset: OpenSCADPreset = req.preset;
  const initialSpec = OPENSCAD_PRESET_SPECS[currentPreset];
  const maxAttempts = initialSpec.isPremium && initialSpec.fallbackTo ? 2 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    throwIfAborted(ctx.signal);
    const spec = OPENSCAD_PRESET_SPECS[currentPreset];
    const cmd = buildOpenSCADArgs({ ...req, preset: currentPreset });

    // ── Run OpenSCAD (catch errors for fallback) ─────────────────
    let renderFailed = false;
    try {
      await ctx.runOpenSCAD(
        cmd,
        ctx.signal,
        (percent) => {
          ctx.notify({
            type: "openscad:progress",
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
        `OpenSCAD failed for ${currentPreset}: ${err instanceof Error ? err.message : String(err)}`,
      );
      renderFailed = true;
    }

    if (!renderFailed) {
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
          type: "openscad:progress",
          assetId,
          percent: 100,
          preset: currentPreset,
        });

        // One last abort check before creating the asset
        throwIfAborted(ctx.signal);

        return buildAndNotifyAsset(
          assetId, req, currentPreset, inputCheck, allWarnings, ctx,
        );
      }

      // Assertion failed
      allWarnings.push(...assertResult.warnings);
    }

    // ── Fallback to guaranteed preset ────────────────────────────
    if (spec.fallbackTo && attempt + 1 < maxAttempts) {
      ctx.notify({
        type: "openscad:warning",
        assetId,
        warnings: [
          `${renderFailed ? "Render" : "Assertion"} failed for ${currentPreset}, ` +
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
      type: "openscad:progress",
      assetId,
      percent: 100,
      preset: currentPreset,
    });

    return buildAndNotifyAsset(
      assetId, req, currentPreset, inputCheck, allWarnings, ctx,
    );
  }

  throw new Error("Render loop exhausted without result.");
}

// ── Helper: build asset + fire notifications ────────────────────

async function buildAndNotifyAsset(
  assetId: string,
  req: RenderModel,
  preset: OpenSCADPreset,
  inputCheck: OpenSCADInputCheck,
  warnings: string[],
  ctx: RenderModelContext,
): Promise<OpenSCADModelAsset> {
  const spec = OPENSCAD_PRESET_SPECS[preset];

  // ── Output polish ─────────────────────────────────────────────
  const finalPath = ensureOpenSCADExtension(req.outputPath, spec);
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

  const outputProbe = buildOpenSCADOutputMetadata(spec, outputSizeBytes);

  // Build input probe
  const inputProbe: OpenSCADInputProbe = {
    lines: inputCheck.lines,
    variables: req.variables ? Object.keys(req.variables).length : undefined,
    sizeBytes: inputCheck.sizeBytes,
  };

  const asset: OpenSCADModelAsset = {
    id: assetId,
    inputPath: req.inputPath,
    outputPath: finalPath,
    preset,
    quality: req.quality,
    variables: req.variables,
    inputProbe,
    outputProbe,
    warnings,
    expiresAt: computeOpenSCADExpiresAt(),
  };

  await ctx.createAsset(asset);
  ctx.notify({
    type: "openscad:ready",
    assetId,
    outputPath: finalPath,
    preset,
    sizeBytes: outputSizeBytes,
  });

  return asset;
}
