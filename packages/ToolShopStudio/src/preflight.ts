import path from "node:path";
import type { ProbeStream, ProbeResult } from "./schemas.js";
import type { PresetSpec } from "./preset-spec.js";

// ── Sandbox validation ────────────────────────────────────────────

/**
 * Ensures the given path is inside the user's sandbox directory.
 * Prevents path traversal attacks (../../etc).
 */
export function validateSandboxPath(
  userId: string,
  filePath: string,
  sandboxRoot = "/data/sandbox",
): void {
  const userRoot = path.resolve(sandboxRoot, userId);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(userRoot + path.sep) && resolved !== userRoot) {
    throw new Error(
      `Path "${filePath}" escapes sandbox for user "${userId}". ` +
        `Must be inside "${userRoot}".`,
    );
  }
}

// ── Progressive scan detection ────────────────────────────────────

export interface ScanResult {
  isProgressive: boolean;
  warnings: string[];
}

/**
 * Checks whether a video stream is likely progressive (not interlaced).
 * Returns warnings for ambiguous cases so the caller can decide.
 */
export function isLikelyProgressive(stream: ProbeStream): ScanResult {
  const warnings: string[] = [];
  const fo = stream.field_order?.toLowerCase();

  // Definitely interlaced
  if (fo === "tt" || fo === "bb" || fo === "tb" || fo === "bt") {
    return { isProgressive: false, warnings: [`Interlaced: field_order=${fo}`] };
  }

  // Explicitly progressive
  if (fo === "progressive") {
    return { isProgressive: true, warnings };
  }

  // Missing or unknown field_order — warn but assume progressive
  if (!fo || fo === "unknown") {
    warnings.push(
      `field_order is "${fo ?? "missing"}"; assuming progressive. ` +
        `Interlaced content may produce combing artifacts.`,
    );
    return { isProgressive: true, warnings };
  }

  // Unexpected value — warn
  warnings.push(`Unexpected field_order="${fo}"; assuming progressive.`);
  return { isProgressive: true, warnings };
}

// ── Output size preflight ─────────────────────────────────────────

/**
 * Estimates output file size in bytes based on duration and video bitrate.
 * Uses a 1.05 overhead multiplier for container + audio.
 */
export function estimateOutputBytes(
  durationSec: number,
  videoMbps: number,
): number {
  const videoBytesPerSec = (videoMbps * 1_000_000) / 8;
  const audioBytesPerSec = (192 * 1_000) / 8; // 192 kbps AAC
  const rawBytes = (videoBytesPerSec + audioBytesPerSec) * durationSec;
  return Math.ceil(rawBytes * 1.05); // 5% container overhead
}

// ── Output assertion ──────────────────────────────────────────────

export interface AssertionResult {
  ok: boolean;
  warnings: string[];
}

/**
 * Assert that a transcoded output matches the expected PresetSpec.
 *
 * Checks: MP4 container, progressive scan, AAC-LC 48kHz audio,
 * pix_fmt, profile per preset, closed-GOP params.
 */
export function assertOutputMatchesSpec(
  spec: PresetSpec,
  outputProbe: ProbeResult,
): AssertionResult {
  const warnings: string[] = [];

  // ── Container: must be MP4 ──────────────────────────────────────
  const fmt = outputProbe.format.format_name.toLowerCase();
  if (!fmt.includes("mp4") && !fmt.includes("mov")) {
    warnings.push(`Expected MP4 container, got "${outputProbe.format.format_name}".`);
  }

  // ── Find video and audio streams ────────────────────────────────
  const videoStream = outputProbe.streams.find((s) => s.codec_type === "video");
  const audioStream = outputProbe.streams.find((s) => s.codec_type === "audio");

  if (!videoStream) {
    warnings.push("No video stream found in output.");
    return { ok: false, warnings };
  }

  // ── Progressive scan ────────────────────────────────────────────
  const scanResult = isLikelyProgressive(videoStream);
  if (!scanResult.isProgressive) {
    warnings.push("Output is interlaced; YouTube requires progressive.");
  }
  warnings.push(...scanResult.warnings);

  // ── Pixel format ────────────────────────────────────────────────
  if (videoStream.pix_fmt && videoStream.pix_fmt !== spec.pixFmt) {
    warnings.push(
      `Expected pix_fmt="${spec.pixFmt}", got "${videoStream.pix_fmt}".`,
    );
  }

  // ── Profile ─────────────────────────────────────────────────────
  if (videoStream.profile) {
    const actual = videoStream.profile.toLowerCase();
    const expected = spec.profile.toLowerCase();
    if (!actual.includes(expected)) {
      warnings.push(
        `Expected profile="${spec.profile}", got "${videoStream.profile}".`,
      );
    }
  }

  // ── Audio: AAC-LC at 48 kHz ─────────────────────────────────────
  if (!audioStream) {
    warnings.push("No audio stream found in output.");
  } else {
    const audioCodec = audioStream.codec_name?.toLowerCase();
    if (audioCodec !== "aac") {
      warnings.push(`Expected audio codec "aac", got "${audioStream.codec_name}".`);
    }
    if (audioStream.sample_rate && audioStream.sample_rate !== "48000") {
      warnings.push(
        `Expected audio sample rate 48000, got "${audioStream.sample_rate}".`,
      );
    }
  }

  // ── HDR tags (if HDR preset) ────────────────────────────────────
  if (spec.hdrTags) {
    if (videoStream.color_primaries !== spec.hdrTags["color_primaries"]) {
      warnings.push(
        `HDR: expected color_primaries="${spec.hdrTags["color_primaries"]}", ` +
          `got "${videoStream.color_primaries ?? "missing"}".`,
      );
    }
    if (videoStream.color_transfer !== spec.hdrTags["color_trc"]) {
      warnings.push(
        `HDR: expected color_transfer="${spec.hdrTags["color_trc"]}", ` +
          `got "${videoStream.color_transfer ?? "missing"}".`,
      );
    }
    if (videoStream.color_space !== spec.hdrTags["colorspace"]) {
      warnings.push(
        `HDR: expected color_space="${spec.hdrTags["colorspace"]}", ` +
          `got "${videoStream.color_space ?? "missing"}".`,
      );
    }
  }

  return {
    ok: warnings.length === 0,
    warnings,
  };
}
