import type { Preset } from "./schemas.js";

// ── PresetSpec: pure data, no runtime logic ───────────────────────
export interface PresetSpec {
  codec: string;
  pixFmt: string;
  profile: string;
  crf: number;
  maxrate: string;
  bufsize: string;
  vf: string;
  hdrTags: Record<string, string> | null;
  isPremium: boolean;
  fallbackTo: Preset | null;
  x264Params?: string;
  x265Params?: string;
}

export const PRESET_SPECS: Record<Preset, PresetSpec> = {
  "yt-1080p-h264": {
    codec: "libx264",
    pixFmt: "yuv420p",
    profile: "high",
    crf: 18,
    maxrate: "12M",
    bufsize: "24M",
    vf: "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
    hdrTags: null,
    isPremium: false,
    fallbackTo: null,
    x264Params: "keyint=60:min-keyint=60:scenecut=0",
  },
  "yt-1080p-h265": {
    codec: "libx265",
    pixFmt: "yuv420p10le",
    profile: "main10",
    crf: 20,
    maxrate: "8M",
    bufsize: "16M",
    vf: "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
    hdrTags: null,
    isPremium: true,
    fallbackTo: "yt-1080p-h264",
    x265Params: "open-gop=0:scenecut=0",
  },
  "yt-4k-h264": {
    codec: "libx264",
    pixFmt: "yuv420p",
    profile: "high",
    crf: 18,
    maxrate: "40M",
    bufsize: "80M",
    vf: "scale=3840:2160:force_original_aspect_ratio=decrease,pad=3840:2160:(ow-iw)/2:(oh-ih)/2",
    hdrTags: null,
    isPremium: false,
    fallbackTo: null,
    x264Params: "keyint=60:min-keyint=60:scenecut=0",
  },
  "yt-4k-h265": {
    codec: "libx265",
    pixFmt: "yuv420p10le",
    profile: "main10",
    crf: 20,
    maxrate: "25M",
    bufsize: "50M",
    vf: "scale=3840:2160:force_original_aspect_ratio=decrease,pad=3840:2160:(ow-iw)/2:(oh-ih)/2",
    hdrTags: null,
    isPremium: true,
    fallbackTo: "yt-4k-h264",
    x265Params: "open-gop=0:scenecut=0",
  },
  "yt-4k-hdr-h265": {
    codec: "libx265",
    pixFmt: "yuv420p10le",
    profile: "main10",
    crf: 18,
    maxrate: "40M",
    bufsize: "80M",
    vf: "scale=3840:2160:force_original_aspect_ratio=decrease,pad=3840:2160:(ow-iw)/2:(oh-ih)/2",
    hdrTags: {
      "color_primaries": "bt2020",
      "color_trc": "smpte2084",
      "colorspace": "bt2020nc",
    },
    isPremium: true,
    fallbackTo: "yt-4k-h265",
    x265Params: "open-gop=0:scenecut=0",
  },
  "yt-shorts-h264": {
    codec: "libx264",
    pixFmt: "yuv420p",
    profile: "high",
    crf: 18,
    maxrate: "12M",
    bufsize: "24M",
    vf: "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
    hdrTags: null,
    isPremium: false,
    fallbackTo: null,
    x264Params: "keyint=60:min-keyint=60:scenecut=0",
  },
  "yt-shorts-h265": {
    codec: "libx265",
    pixFmt: "yuv420p10le",
    profile: "main10",
    crf: 20,
    maxrate: "8M",
    bufsize: "16M",
    vf: "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
    hdrTags: null,
    isPremium: true,
    fallbackTo: "yt-shorts-h264",
    x265Params: "open-gop=0:scenecut=0",
  },
} as const;

// ── Common invariant flags for all presets ─────────────────────────
export function buildBaseFlags(): string[] {
  return [
    // MP4 container: moov atom at front for streaming
    "-movflags", "+faststart",
    // Timestamp correction
    "-avoid_negative_ts", "make_zero",
    "-fflags", "+genpts",
    // Video track timescale (YouTube expects 90kHz)
    "-video_track_timescale", "90000",
    // Closed GOP: keyframe every 2s at 30fps
    "-g", "60",
    "-keyint_min", "60",
    // AAC audio: 48 kHz stereo
    "-c:a", "aac",
    "-ar", "48000",
    "-ac", "2",
    "-b:a", "192k",
  ];
}
