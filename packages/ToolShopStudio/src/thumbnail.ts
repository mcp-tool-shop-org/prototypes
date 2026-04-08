import { spawn } from "node:child_process";
import { execFile as execFileCb } from "node:child_process";
import { stat as statCb } from "node:fs";
import { promisify } from "node:util";

const execFile = promisify(execFileCb);
const stat = promisify(statCb);

/**
 * Extract a single frame from a video at the given timestamp.
 *
 * @param videoPath - input video file
 * @param timestamp - HH:MM:SS or seconds string (passed to ffmpeg -ss)
 * @param outputStill - output image path (png/jpg)
 * @param signal - AbortSignal for cancellation
 */
export async function extractFrame(
  videoPath: string,
  timestamp: string,
  outputStill: string,
  signal: AbortSignal,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const proc = spawn(
      "ffmpeg",
      ["-ss", timestamp, "-i", videoPath, "-frames:v", "1", "-y", outputStill],
      { stdio: "ignore" },
    );

    const onAbort = () => proc.kill("SIGKILL");
    signal.addEventListener("abort", onAbort, { once: true });

    proc.on("close", (code) => {
      signal.removeEventListener("abort", onAbort);
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
      } else if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Frame extraction failed with code ${code}`));
      }
    });

    proc.on("error", (err) => {
      signal.removeEventListener("abort", onAbort);
      reject(err);
    });
  });
}

/**
 * Build ffmpeg filter string for thumbnail styling.
 * Maps our schema's brightness/contrast/saturation to ffmpeg eq filter.
 */
export function buildThumbnailFilter(
  width: number,
  height: number,
  style: { brightness: number; contrast: number; saturation: number },
): string {
  const parts: string[] = [];

  // Scale to target dimensions
  parts.push(
    `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
    `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
  );

  // Apply eq filter if any style adjustments
  const { brightness, contrast, saturation } = style;
  if (brightness !== 0 || contrast !== 0 || saturation !== 1) {
    parts.push(
      `eq=brightness=${brightness}:contrast=${1 + contrast}:saturation=${saturation}`,
    );
  }

  return parts.join(",");
}

/**
 * Generate a styled thumbnail at the given dimensions.
 * Uses ffmpeg for filtering/scaling (no ImageMagick dependency).
 * Clamps output to <= 2 MB by reducing JPEG quality iteratively.
 *
 * @param stillPath - input still image (from extractFrame)
 * @param outputPath - output thumbnail path
 * @param width - target width
 * @param height - target height
 * @param style - brightness/contrast/saturation adjustments
 * @param overlayText - optional text overlay (drawn via drawtext filter)
 */
export async function generateStyledThumbnail(
  stillPath: string,
  outputPath: string,
  width: number,
  height: number,
  style: { brightness: number; contrast: number; saturation: number },
  overlayText?: string,
): Promise<void> {
  const MAX_BYTES = 2_000_000;
  const MIN_QUALITY = 2;

  let quality = 5; // ffmpeg qscale:v (1=best, 31=worst for MJPEG)

  while (quality <= 31) {
    let vf = buildThumbnailFilter(width, height, style);

    if (overlayText) {
      // Safe escaping for drawtext
      const escaped = overlayText.replace(/'/g, "'\\''").replace(/:/g, "\\:");
      vf += `,drawtext=text='${escaped}':fontsize=48:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-text_h-40`;
    }

    await execFile("ffmpeg", [
      "-i", stillPath,
      "-vf", vf,
      "-qscale:v", String(quality),
      "-y", outputPath,
    ]);

    const { size } = await stat(outputPath);
    if (size <= MAX_BYTES) return;

    quality += 3;
  }

  throw new Error(
    `Cannot clamp thumbnail under 2 MB (tried qscale:v up to 31).`,
  );
}
