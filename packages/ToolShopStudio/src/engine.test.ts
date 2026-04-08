import { describe, it, expect } from "vitest";
import { buildFlags } from "./build-flags.js";
import {
  parseProgressLine,
  calculatePercent,
} from "./progress-parser.js";
import type { TranscodeForYouTube, ProbeResult } from "./schemas.js";

// ── Test fixtures ─────────────────────────────────────────────────

const MINIMAL_PROBE: ProbeResult = {
  streams: [
    {
      codec_name: "h264",
      codec_type: "video",
      width: 1920,
      height: 1080,
      pix_fmt: "yuv420p",
      field_order: "progressive",
      r_frame_rate: "30/1",
    },
    {
      codec_name: "aac",
      codec_type: "audio",
      channels: 2,
      sample_rate: "48000",
    },
  ],
  format: {
    filename: "input.mp4",
    format_name: "mov,mp4,m4a,3gp,3g2,mj2",
    duration: "120.0",
    bit_rate: "8000000",
  },
};

// ── buildFlags golden snapshots ───────────────────────────────────

describe("buildFlags", () => {
  it("sdr_1080p: produces correct flags for yt-1080p-h264", () => {
    const req: TranscodeForYouTube = {
      inputPath: "/sandbox/user1/input.mp4",
      outputPath: "/sandbox/user1/output.mp4",
      preset: "yt-1080p-h264",
      allowFallback: true,
      timeoutSeconds: 3600,
    };

    const flags = buildFlags(req, MINIMAL_PROBE);

    expect(flags).toMatchSnapshot();
  });

  it("shorts_sdr_1080x1920: produces correct flags for yt-shorts-h264", () => {
    const req: TranscodeForYouTube = {
      inputPath: "/sandbox/user1/short.mp4",
      outputPath: "/sandbox/user1/short_out.mp4",
      preset: "yt-shorts-h264",
      allowFallback: true,
      timeoutSeconds: 3600,
    };

    const flags = buildFlags(req, MINIMAL_PROBE);

    expect(flags).toMatchSnapshot();
  });

  it("hdr_pq_4k: produces correct flags for yt-4k-hdr-h265", () => {
    const req: TranscodeForYouTube = {
      inputPath: "/sandbox/user1/hdr_input.mp4",
      outputPath: "/sandbox/user1/hdr_output.mp4",
      preset: "yt-4k-hdr-h265",
      allowFallback: true,
      timeoutSeconds: 3600,
    };

    const flags = buildFlags(req, MINIMAL_PROBE);

    expect(flags).toMatchSnapshot();
    // HDR tags must be present
    expect(flags).toContain("-color_primaries");
    expect(flags).toContain("bt2020");
    expect(flags).toContain("-color_trc");
    expect(flags).toContain("smpte2084");
    expect(flags).toContain("-colorspace");
    expect(flags).toContain("bt2020nc");
  });

  it("closed-gop params are present for all presets", () => {
    const presets = [
      "yt-1080p-h264",
      "yt-1080p-h265",
      "yt-4k-h264",
      "yt-4k-h265",
      "yt-4k-hdr-h265",
      "yt-shorts-h264",
      "yt-shorts-h265",
    ] as const;

    for (const preset of presets) {
      const req: TranscodeForYouTube = {
        inputPath: "/in.mp4",
        outputPath: "/out.mp4",
        preset,
        allowFallback: true,
        timeoutSeconds: 3600,
      };

      const flags = buildFlags(req, MINIMAL_PROBE);

      if (preset.includes("h264")) {
        expect(flags).toContain("-x264-params");
        const idx = flags.indexOf("-x264-params");
        expect(flags[idx + 1]).toBe("keyint=60:min-keyint=60:scenecut=0");
      } else {
        expect(flags).toContain("-x265-params");
        const idx = flags.indexOf("-x265-params");
        expect(flags[idx + 1]).toBe("open-gop=0:scenecut=0");
      }
    }
  });
});

// ── Progress parser ───────────────────────────────────────────────

describe("progress parser", () => {
  it("handles split chunks correctly", () => {
    // Simulate ffmpeg progress output that arrives in split chunks
    const collected: Array<{ key: string; value: string }> = [];

    // Chunk 1: complete line + partial line
    const chunk1 = "frame=100\nfps=30.0\nout_time_us=333";
    // Chunk 2: rest of partial line + new complete line
    const chunk2 = "3000\nprogress=continue\n";

    // Process chunk1
    let buffer = "";
    buffer += chunk1;
    const lines1 = buffer.split("\n");
    buffer = lines1.pop() ?? "";
    for (const line of lines1) {
      const kv = parseProgressLine(line);
      if (kv) collected.push(kv);
    }

    // Process chunk2
    buffer += chunk2;
    const lines2 = buffer.split("\n");
    buffer = lines2.pop() ?? "";
    for (const line of lines2) {
      const kv = parseProgressLine(line);
      if (kv) collected.push(kv);
    }

    expect(collected).toEqual([
      { key: "frame", value: "100" },
      { key: "fps", value: "30.0" },
      { key: "out_time_us", value: "3333000" },
      { key: "progress", value: "continue" },
    ]);
  });

  it("calculatePercent clamps to 0-100", () => {
    expect(calculatePercent("0", 120)).toBe(0);
    expect(calculatePercent("60000000", 120)).toBe(50);
    expect(calculatePercent("120000000", 120)).toBe(100);
    // Over 100% — clamped
    expect(calculatePercent("150000000", 120)).toBe(100);
    // Negative — clamped
    expect(calculatePercent("-1000", 120)).toBe(0);
    // Zero duration
    expect(calculatePercent("50000000", 0)).toBe(0);
  });
});
