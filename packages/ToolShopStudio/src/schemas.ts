import { z } from "zod";

// ── Preset enum (7 YouTube-safe presets) ──────────────────────────
export const PresetEnum = z.enum([
  "yt-1080p-h264",
  "yt-1080p-h265",
  "yt-4k-h264",
  "yt-4k-h265",
  "yt-4k-hdr-h265",
  "yt-shorts-h264",
  "yt-shorts-h265",
]);
export type Preset = z.infer<typeof PresetEnum>;

// ── Probe result (ffprobe output subset) ──────────────────────────
export const ProbeStreamSchema = z.object({
  codec_name: z.string(),
  codec_type: z.enum(["video", "audio", "subtitle", "data"]),
  width: z.number().optional(),
  height: z.number().optional(),
  pix_fmt: z.string().optional(),
  field_order: z.string().optional(),
  r_frame_rate: z.string().optional(),
  avg_frame_rate: z.string().optional(),
  duration: z.string().optional(),
  bit_rate: z.string().optional(),
  color_space: z.string().optional(),
  color_transfer: z.string().optional(),
  color_primaries: z.string().optional(),
  profile: z.string().optional(),
  level: z.number().optional(),
  channels: z.number().optional(),
  sample_rate: z.string().optional(),
});
export type ProbeStream = z.infer<typeof ProbeStreamSchema>;

export const ProbeFormatSchema = z.object({
  filename: z.string(),
  format_name: z.string(),
  duration: z.string().optional(),
  size: z.string().optional(),
  bit_rate: z.string().optional(),
});
export type ProbeFormat = z.infer<typeof ProbeFormatSchema>;

export const ProbeResultSchema = z.object({
  streams: z.array(ProbeStreamSchema),
  format: ProbeFormatSchema,
});
export type ProbeResult = z.infer<typeof ProbeResultSchema>;

// ── YouTubeMediaAsset ─────────────────────────────────────────────
export const YouTubeMediaAssetSchema = z.object({
  id: z.string().uuid(),
  paths: z.object({
    input: z.string(),
    output: z.string(),
  }),
  probes: z.object({
    input: ProbeResultSchema.optional(),
    output: ProbeResultSchema.optional(),
  }),
  warnings: z.array(z.string()),
  expiresAt: z.string().datetime().optional(),
  thumbnailPaths: z.object({
    landscape: z.string().optional(), // 16:9
    portrait: z.string().optional(),  // 4:5
  }),
});
export type YouTubeMediaAsset = z.infer<typeof YouTubeMediaAssetSchema>;

// ── TranscodeForYouTube input ─────────────────────────────────────
export const TranscodeForYouTubeSchema = z.object({
  inputPath: z.string().min(1),
  outputPath: z.string().min(1),
  preset: PresetEnum,
  customBitrate: z
    .object({
      videoMbps: z.number().positive().optional(),
      audioBitrate: z.string().optional(), // e.g. "320k"
    })
    .optional(),
  allowFallback: z.boolean().default(true),
  maxOutputBytes: z.number().positive().optional(),
  orientationHint: z.enum(["landscape", "portrait", "square"]).optional(),
  timeoutSeconds: z.number().positive().default(3600),
});
export type TranscodeForYouTube = z.infer<typeof TranscodeForYouTubeSchema>;

// ── GenerateYouTubeThumbnail input ────────────────────────────────
export const GenerateYouTubeThumbnailSchema = z.object({
  videoPath: z.string().min(1),
  output: z.object({
    landscape: z.string().min(1), // 16:9 (1280×720)
    portrait: z.string().min(1),  // 4:5  (1080×1350)
  }),
  timestamp: z.string().default("00:00:01"), // HH:MM:SS or seconds
  overlayText: z.string().max(100).optional(),
  style: z
    .object({
      brightness: z.number().min(-1).max(1).default(0),
      contrast: z.number().min(-1).max(1).default(0),
      saturation: z.number().min(0).max(3).default(1),
    })
    .default({}),
});
export type GenerateYouTubeThumbnail = z.infer<typeof GenerateYouTubeThumbnailSchema>;
