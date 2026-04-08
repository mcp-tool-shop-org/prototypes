import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import {
  GenerateYouTubeThumbnailSchema,
  type GenerateYouTubeThumbnail,
} from "./schemas.js";
import { validateSandboxPath } from "./preflight.js";
import { extractFrame, generateStyledThumbnail } from "./thumbnail.js";

export interface ThumbnailResult {
  landscape: string;
  portrait: string;
}

export interface ThumbnailContext {
  signal: AbortSignal;
  userId: string;
  /** Temp directory for intermediate files. Defaults to os.tmpdir(). */
  tmpDir?: string;
  /** Injected for testability */
  extractFrame?: typeof extractFrame;
  generateStyledThumbnail?: typeof generateStyledThumbnail;
}

/**
 * Generate dual YouTube thumbnails (16:9 landscape + 4:5 portrait).
 *
 * Pipeline: validate → extract frame → style + scale to both sizes →
 * clamp each under 2 MB → cleanup temp still.
 */
export async function generateYouTubeThumbnail(
  reqRaw: unknown,
  ctx: ThumbnailContext,
): Promise<ThumbnailResult> {
  const req = GenerateYouTubeThumbnailSchema.parse(reqRaw);

  validateSandboxPath(ctx.userId, req.videoPath);
  validateSandboxPath(ctx.userId, req.output.landscape);
  validateSandboxPath(ctx.userId, req.output.portrait);

  const doExtract = ctx.extractFrame ?? extractFrame;
  const doGenerate = ctx.generateStyledThumbnail ?? generateStyledThumbnail;

  // Extract a single frame as temp PNG
  const tmpDir = ctx.tmpDir ?? "/tmp";
  const tempStill = `${tmpDir}/${randomUUID()}.png`;

  try {
    await doExtract(req.videoPath, req.timestamp, tempStill, ctx.signal);

    // 16:9 landscape (1280×720) — always generated
    await doGenerate(
      tempStill,
      req.output.landscape,
      1280,
      720,
      req.style,
      req.overlayText,
    );

    // 4:5 portrait (1080×1350) — always generated
    await doGenerate(
      tempStill,
      req.output.portrait,
      1080,
      1350,
      req.style,
      req.overlayText,
    );

    return {
      landscape: req.output.landscape,
      portrait: req.output.portrait,
    };
  } finally {
    // Cleanup temp still (best-effort)
    try {
      await unlink(tempStill);
    } catch {
      // ignore — temp file cleanup is best-effort
    }
  }
}
