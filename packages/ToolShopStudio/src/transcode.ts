import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  TranscodeForYouTubeSchema,
  type TranscodeForYouTube,
  type Preset,
  type ProbeResult,
  type YouTubeMediaAsset,
} from "./schemas.js";
import { PRESET_SPECS } from "./preset-spec.js";
import { validateSandboxPath, isLikelyProgressive, estimateOutputBytes } from "./preflight.js";
import { buildFlags } from "./build-flags.js";
import type { YouTubeNotification } from "./types.js";
import type { ThumbnailResult } from "./generate-thumbnail.js";

/** Throw if signal is already aborted. */
function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
}

/** Type guard for AbortError from any source. */
function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (err instanceof Error && err.name === "AbortError") return true;
  return false;
}

/**
 * Context provided by the caller (MCP handler, CLI, etc).
 * Keeps the pipeline free of global state.
 */
export interface TranscodeContext {
  signal: AbortSignal;
  notify: (notification: YouTubeNotification) => void;
  userId: string;
  createAsset: (asset: YouTubeMediaAsset) => Promise<void>;
  /** Injected so tests can mock without real ffmpeg/ffprobe */
  runFfmpeg: (
    flags: string[],
    signal: AbortSignal,
    onProgress: (percent: number) => void,
    durationSec: number,
  ) => Promise<void>;
  runProbe: (filePath: string) => Promise<ProbeResult>;
  /** Optional: generate thumbnails after successful transcode */
  generateThumbnail?: (
    reqRaw: unknown,
    ctx: { signal: AbortSignal; userId: string },
  ) => Promise<ThumbnailResult>;
}

/**
 * Full YouTube-safe transcode pipeline.
 *
 * 1. Validate (Zod parse + sandbox)
 * 2. Preflight probe + interlace check + size estimate
 * 3. Build flags + run ffmpeg (with fallback loop)
 * 4. Postflight assertion
 * 5. Create asset + notify ready
 */
export async function transcodeForYouTube(
  reqRaw: unknown,
  ctx: TranscodeContext,
): Promise<YouTubeMediaAsset> {
  // ── 1. Validate ─────────────────────────────────────────────────
  throwIfAborted(ctx.signal);
  const req = TranscodeForYouTubeSchema.parse(reqRaw);
  const assetId = randomUUID();

  validateSandboxPath(ctx.userId, req.inputPath);
  validateSandboxPath(ctx.userId, req.outputPath);

  // ── 2. Preflight probe ──────────────────────────────────────────
  throwIfAborted(ctx.signal);
  const inputProbe = await ctx.runProbe(req.inputPath);
  const allWarnings: string[] = [];

  const videoStream = inputProbe.streams.find((s) => s.codec_type === "video");
  if (!videoStream) {
    throw new Error("No video stream found in input.");
  }

  const scanResult = isLikelyProgressive(videoStream);
  allWarnings.push(...scanResult.warnings);
  if (!scanResult.isProgressive) {
    allWarnings.push("Input is interlaced; output may have combing artifacts.");
  }

  const durationSec = Number(inputProbe.format.duration ?? 0);

  // maxOutputBytes preflight
  if (req.maxOutputBytes) {
    const spec = PRESET_SPECS[req.preset];
    const maxrateMbps = parseFloat(spec.maxrate.replace(/[^\d.]/g, "")); // "12M" → 12, explicit numeric extraction
    const est = estimateOutputBytes(durationSec, maxrateMbps);
    if (est > req.maxOutputBytes) {
      if (!req.allowFallback) {
        throw new Error(
          `Estimated output ${est} bytes exceeds maxOutputBytes ${req.maxOutputBytes}.`,
        );
      }
      allWarnings.push(
        `Estimated output ${est} bytes exceeds limit ${req.maxOutputBytes}; will attempt fallback.`,
      );
    }
  }

  // ── 3. Transcode with fallback loop ─────────────────────────────
  let currentPreset: Preset = req.preset;
  const maxAttempts =
    req.allowFallback && PRESET_SPECS[currentPreset].isPremium ? 2 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    throwIfAborted(ctx.signal);
    const spec = PRESET_SPECS[currentPreset];
    const flags = buildFlags({ ...req, preset: currentPreset }, inputProbe);

    // ── Run ffmpeg (catch errors for fallback) ──────────────────
    let ffmpegFailed = false;
    try {
      await ctx.runFfmpeg(
        flags,
        ctx.signal,
        (percent) => {
          ctx.notify({
            type: "youtube:progress",
            assetId,
            percent,
            eta: null,
            preset: currentPreset,
            warnings: allWarnings,
          });
        },
        durationSec,
      );
    } catch (err: unknown) {
      // AbortError always rethrows immediately — no fallback
      if (isAbortError(err)) throw err;

      if (!req.allowFallback || !spec.fallbackTo) throw err;

      allWarnings.push(
        `ffmpeg failed for ${currentPreset}: ${err instanceof Error ? err.message : String(err)}`,
      );
      ffmpegFailed = true;
    }

    if (!ffmpegFailed) {
      // ── 4. Postflight assertion ───────────────────────────────
      throwIfAborted(ctx.signal);
      const outputProbe = await ctx.runProbe(req.outputPath);
      const { assertOutputMatchesSpec } = await import("./preflight.js");
      const assertResult = assertOutputMatchesSpec(spec, outputProbe);

      if (assertResult.ok) {
        allWarnings.push(...assertResult.warnings);
        // Ensure final 100% progress fires
        ctx.notify({
          type: "youtube:progress",
          assetId,
          percent: 100,
          eta: null,
          preset: currentPreset,
          warnings: allWarnings,
        });
        return buildAndNotifyAsset(
          assetId, req, inputProbe, outputProbe, allWarnings, currentPreset, durationSec, ctx,
        );
      }

      // Assertion failed
      allWarnings.push(...assertResult.warnings);
    }

    // ── Fallback to guaranteed preset ───────────────────────────
    if (spec.fallbackTo && req.allowFallback && attempt + 1 < maxAttempts) {
      ctx.notify({
        type: "youtube:warning",
        assetId,
        warnings: [
          `${ffmpegFailed ? "Encode" : "Assertion"} failed for ${currentPreset}, ` +
            `falling back to ${spec.fallbackTo}.`,
        ],
        preset: currentPreset,
      });
      currentPreset = spec.fallbackTo;
      continue;
    }

    // No more fallbacks — if ffmpeg failed, rethrow
    if (ffmpegFailed) {
      throw new Error(`Transcode failed for ${currentPreset} with no fallback available.`);
    }

    // ffmpeg succeeded but assertion failed — return with warnings
    const finalProbe = await ctx.runProbe(req.outputPath);
    return buildAndNotifyAsset(
      assetId, req, inputProbe, finalProbe, allWarnings, currentPreset, durationSec, ctx,
    );
  }

  throw new Error("Transcode loop exhausted without result.");
}

// ── Helper: build asset + fire notifications ──────────────────────

async function buildAndNotifyAsset(
  assetId: string,
  req: TranscodeForYouTube,
  inputProbe: ProbeResult,
  outputProbe: ProbeResult,
  warnings: string[],
  preset: Preset,
  durationSec: number,
  ctx: TranscodeContext,
): Promise<YouTubeMediaAsset> {
  const fileSizeBytes = Number(outputProbe.format.size ?? 0);

  // ── Thumbnail generation (optional, best-effort) ──────────────
  let thumbnailPaths: YouTubeMediaAsset["thumbnailPaths"] = {};

  if (ctx.generateThumbnail) {
    try {
      const outputDir = path.dirname(req.outputPath);
      const baseName = path.basename(req.outputPath, path.extname(req.outputPath));

      const thumbResult = await ctx.generateThumbnail(
        {
          videoPath: req.outputPath,
          output: {
            landscape: path.join(outputDir, `${baseName}_thumb_16x9.jpg`),
            portrait: path.join(outputDir, `${baseName}_thumb_4x5.jpg`),
          },
        },
        { signal: ctx.signal, userId: ctx.userId },
      );

      thumbnailPaths = {
        landscape: thumbResult.landscape,
        portrait: thumbResult.portrait,
      };
    } catch (err) {
      // Thumbnail failure is non-fatal — add warning
      warnings.push(
        `Thumbnail generation failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const asset: YouTubeMediaAsset = {
    id: assetId,
    paths: { input: req.inputPath, output: req.outputPath },
    probes: { input: inputProbe, output: outputProbe },
    warnings,
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    thumbnailPaths,
  };

  await ctx.createAsset(asset);
  ctx.notify({
    type: "youtube:ready",
    assetId,
    outputPath: req.outputPath,
    preset,
    durationSec,
    fileSizeBytes,
  });

  return asset;
}
