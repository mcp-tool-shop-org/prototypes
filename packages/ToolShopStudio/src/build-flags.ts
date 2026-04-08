/**
 * Pure, deterministic ffmpeg flag builder.
 * YouTube 2026 invariant compliant.
 *
 * Takes a transcode request + probe result, returns the full ffmpeg
 * argv (minus the `ffmpeg` binary itself). No side effects.
 */

import type { TranscodeForYouTube, ProbeResult } from "./schemas.js";
import { PRESET_SPECS, buildBaseFlags } from "./preset-spec.js";

/**
 * Build the complete ffmpeg flag array for a YouTube-safe transcode.
 *
 * Order: input → base flags → video filter → codec/pixFmt/profile/crf/maxrate →
 *        HDR tags → customBitrate override → closed-GOP params → -y output
 */
export function buildFlags(
  req: TranscodeForYouTube,
  probe: ProbeResult,
): string[] {
  const spec = PRESET_SPECS[req.preset];
  const flags: string[] = [];

  // ── Input ───────────────────────────────────────────────────────
  flags.push("-i", req.inputPath);

  // ── Base invariants ─────────────────────────────────────────────
  flags.push(...buildBaseFlags());

  // ── Video filter (orientation-aware) ────────────────────────────
  flags.push("-vf", resolveVf(spec.vf, req.orientationHint, probe));

  // ── Codec, pixel format, profile, CRF, rate control ─────────────
  flags.push("-c:v", spec.codec);
  flags.push("-pix_fmt", spec.pixFmt);
  flags.push("-profile:v", spec.profile);
  flags.push("-crf", String(spec.crf));
  flags.push("-maxrate", spec.maxrate);
  flags.push("-bufsize", spec.bufsize);

  // ── HDR tags (only for HDR presets) ─────────────────────────────
  if (spec.hdrTags) {
    for (const [key, value] of Object.entries(spec.hdrTags)) {
      flags.push(`-${key}`, value);
    }
  }

  // ── Custom bitrate override ─────────────────────────────────────
  if (req.customBitrate?.videoMbps) {
    flags.push("-b:v", `${req.customBitrate.videoMbps}M`);
  }
  if (req.customBitrate?.audioBitrate) {
    flags.push("-b:a", req.customBitrate.audioBitrate);
  }

  // ── Closed-GOP encoder params ───────────────────────────────────
  if (spec.codec === "libx264" && spec.x264Params) {
    flags.push("-x264-params", spec.x264Params);
  }
  if (spec.codec === "libx265" && spec.x265Params) {
    flags.push("-x265-params", spec.x265Params);
  }

  // ── Progress pipe (stderr key=value parsing) ────────────────────
  flags.push("-progress", "pipe:2");

  // ── Output (overwrite) ──────────────────────────────────────────
  flags.push("-y", req.outputPath);

  return flags;
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Resolve the video filter string. If an orientationHint is given
 * and differs from the spec's default, swap width/height in the
 * scale+pad chain. Otherwise use the spec's vf as-is.
 */
function resolveVf(
  specVf: string,
  orientationHint: TranscodeForYouTube["orientationHint"],
  _probe: ProbeResult,
): string {
  if (!orientationHint) return specVf;

  // Parse the spec's scale dimensions from the vf string
  const scaleMatch = specVf.match(
    /scale=(\d+):(\d+):force_original_aspect_ratio=decrease,pad=(\d+):(\d+)/,
  );
  if (!scaleMatch) return specVf;

  const [, sw, sh, pw, ph] = scaleMatch;
  const specW = Number(sw);
  const specH = Number(sh);
  const specIsLandscape = specW > specH;

  const wantLandscape = orientationHint === "landscape";
  const wantPortrait = orientationHint === "portrait";
  const wantSquare = orientationHint === "square";

  // If hint matches spec orientation, no change needed
  if ((wantLandscape && specIsLandscape) || (wantPortrait && !specIsLandscape)) {
    return specVf;
  }

  // Swap dimensions for orientation mismatch
  if ((wantPortrait && specIsLandscape) || (wantLandscape && !specIsLandscape)) {
    return specVf
      .replace(`scale=${sw}:${sh}`, `scale=${sh}:${sw}`)
      .replace(`pad=${pw}:${ph}`, `pad=${ph}:${pw}`);
  }

  // Square: use min dimension for both
  if (wantSquare) {
    const dim = Math.min(specW, specH);
    return specVf
      .replace(`scale=${sw}:${sh}`, `scale=${dim}:${dim}`)
      .replace(`pad=${pw}:${ph}`, `pad=${dim}:${dim}`);
  }

  return specVf;
}
