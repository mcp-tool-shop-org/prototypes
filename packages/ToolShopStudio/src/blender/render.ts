import { randomUUID } from "node:crypto";
import {
  RenderBlendSchema,
  type RenderBlend,
  type BlenderPreset,
  type BlenderRenderAsset,
  type BlenderInputProbe,
} from "./schemas.js";
import {
  BLENDER_PRESET_SPECS,
  type BlenderPresetSpec,
} from "./preset-spec.js";
import { buildBlenderArgs, type BlenderCommandArgs } from "./build-args.js";
import {
  ensureBlenderExtension,
  buildBlenderOutputMetadata,
  computeBlenderExpiresAt,
} from "./output-polish.js";
import type { BlenderNotification } from "./types.js";
import type { BlenderInputCheck, BlenderAssertionResult } from "./preflight.js";

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
export interface RenderBlendContext {
  signal: AbortSignal;
  notify: (notification: BlenderNotification) => void;
  userId: string;
  createAsset: (asset: BlenderRenderAsset) => Promise<void>;

  /** Injected so tests can mock without real Blender binary */
  runBlender: (
    cmd: BlenderCommandArgs,
    signal: AbortSignal,
    onProgress: (percent: number) => void,
    estimatedSteps: number,
  ) => Promise<void>;

  /** Injected preflight — async (stat-based) */
  checkInput: (filePath: string) => Promise<BlenderInputCheck>;

  /** Injected postflight — async (stat-based) */
  assertOutput: (
    spec: BlenderPresetSpec,
    outputPath: string,
    maxOutputBytes: number,
    inputSizeBytes?: number,
  ) => Promise<BlenderAssertionResult>;

  /** Injected stat for measuring output size */
  statFile: (filePath: string) => Promise<{ size: number }>;
}

// ── Main pipeline ───────────────────────────────────────────────

/**
 * Full Blender render pipeline.
 *
 * 1. Validate (Zod parse + sandbox)
 * 2. Preflight input check
 * 3. Estimated output size check
 * 4. Build args + run Blender (with fallback loop for premium presets)
 * 5. Postflight assertion
 * 6. Create asset + notify ready
 *
 * 7 throwIfAborted checkpoints ensure cancellation is responsive.
 */
export async function renderBlend(
  reqRaw: unknown,
  ctx: RenderBlendContext,
): Promise<BlenderRenderAsset> {
  // ── 1. Validate ─────────────────────────────────────────────────
  throwIfAborted(ctx.signal);                                    // checkpoint 1
  const req = RenderBlendSchema.parse(reqRaw);
  const assetId = randomUUID();

  // Sandbox validation (throws on escape)
  const { validateSandboxPath } = await import("./preflight.js");
  validateSandboxPath(ctx.userId, req.inputPath);
  validateSandboxPath(ctx.userId, req.outputPath);

  // ── 2. Preflight input check ──────────────────────────────────
  throwIfAborted(ctx.signal);                                    // checkpoint 2
  const inputCheck = await ctx.checkInput(req.inputPath);
  const allWarnings: string[] = [...inputCheck.warnings];

  if (!inputCheck.ok) {
    throw new Error(
      `Preflight failed: ${inputCheck.warnings.join("; ")}`,
    );
  }

  // ── 3. Estimated output size check ────────────────────────────
  throwIfAborted(ctx.signal);                                    // checkpoint 3
  if (req.maxOutputBytes > 0) {
    const { estimateBlenderOutputBytes } = await import("./preflight.js");
    const est = estimateBlenderOutputBytes(inputCheck.sizeBytes, req.preset);
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
  //   Premium presets (cycles-render) get 2 attempts:
  //     attempt 0: premium preset
  //     attempt 1: spec.fallbackTo (png-preview)
  //
  //   Guaranteed presets get exactly 1 attempt — no fallback.
  //
  //   AbortError ALWAYS rethrows — never falls back on cancellation.
  //   Non-abort errors fall back if attempts remain.
  //   Assertion failures also trigger fallback.
  //
  let currentPreset: BlenderPreset = req.preset;
  const initialSpec = BLENDER_PRESET_SPECS[currentPreset];
  const maxAttempts = initialSpec.isPremium && initialSpec.fallbackTo ? 2 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    throwIfAborted(ctx.signal);                                  // checkpoint 4
    const spec = BLENDER_PRESET_SPECS[currentPreset];
    const cmd = buildBlenderArgs({ ...req, preset: currentPreset });

    // ── Run Blender (catch errors for fallback) ─────────────────
    let renderFailed = false;
    try {
      await ctx.runBlender(
        cmd,
        ctx.signal,
        (percent) => {
          ctx.notify({
            type: "blender:progress",
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
        `Blender failed for ${currentPreset}: ${err instanceof Error ? err.message : String(err)}`,
      );
      renderFailed = true;
    }

    if (!renderFailed) {
      // ── 5. Postflight assertion ─────────────────────────────────
      throwIfAborted(ctx.signal);                                // checkpoint 5
      const assertResult = await ctx.assertOutput(
        spec,
        req.outputPath,
        req.maxOutputBytes,
        inputCheck.sizeBytes,
      );

      if (assertResult.ok) {
        allWarnings.push(...assertResult.warnings);

        // Final 100% progress before asset creation
        throwIfAborted(ctx.signal);                              // checkpoint 6
        ctx.notify({
          type: "blender:progress",
          assetId,
          percent: 100,
          preset: currentPreset,
        });

        // One last abort check before creating the asset
        throwIfAborted(ctx.signal);                              // checkpoint 7

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
        type: "blender:warning",
        assetId,
        warnings: [
          `${renderFailed ? "Render" : "Assertion"} failed for ${currentPreset}, ` +
            `falling back to ${spec.fallbackTo}.`,
        ],
        preset: currentPreset,
      });
      currentPreset = spec.fallbackTo as BlenderPreset;
      continue;
    }

    // No more fallbacks — return with warnings
    throwIfAborted(ctx.signal);

    // Final 100% progress
    ctx.notify({
      type: "blender:progress",
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
  req: RenderBlend,
  preset: BlenderPreset,
  inputCheck: BlenderInputCheck,
  warnings: string[],
  ctx: RenderBlendContext,
): Promise<BlenderRenderAsset> {
  const spec = BLENDER_PRESET_SPECS[preset];

  // ── Output polish ─────────────────────────────────────────────
  const finalPath = ensureBlenderExtension(req.outputPath, spec);
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

  const outputProbe = buildBlenderOutputMetadata(
    spec,
    outputSizeBytes,
    req.frameStart !== req.frameEnd ? req.frameEnd - req.frameStart + 1 : undefined,
  );

  // Build input probe
  const inputProbe: BlenderInputProbe = {
    scenes: 1, // default — real probing happens at runtime
    objects: 0,
    version: "unknown",
    sizeBytes: inputCheck.sizeBytes,
  };

  const asset: BlenderRenderAsset = {
    id: assetId,
    inputPath: req.inputPath,
    outputPath: finalPath,
    preset,
    quality: req.quality,
    device: req.device,
    scene: req.scene,
    frameStart: req.frameStart,
    frameEnd: req.frameEnd,
    inputProbe,
    outputProbe,
    warnings,
    expiresAt: computeBlenderExpiresAt(),
  };

  await ctx.createAsset(asset);
  ctx.notify({
    type: "blender:ready",
    assetId,
    outputPath: finalPath,
    preset,
    sizeBytes: outputSizeBytes,
  });

  return asset;
}
