import { describe, it, expect, vi } from "vitest";
import { transcodeForYouTube, type TranscodeContext } from "./transcode.js";
import type { ProbeResult, YouTubeMediaAsset } from "./schemas.js";
import type { YouTubeNotification } from "./types.js";

// ── Fixtures ──────────────────────────────────────────────────────

const GOOD_PROBE: ProbeResult = {
  streams: [
    {
      codec_name: "h264",
      codec_type: "video",
      width: 1920,
      height: 1080,
      pix_fmt: "yuv420p",
      field_order: "progressive",
      profile: "High",
    },
    {
      codec_name: "aac",
      codec_type: "audio",
      channels: 2,
      sample_rate: "48000",
    },
  ],
  format: {
    filename: "/data/sandbox/user1/input.mp4",
    format_name: "mov,mp4,m4a,3gp,3g2,mj2",
    duration: "120.0",
    size: "50000000",
    bit_rate: "8000000",
  },
};

/** Probe result that fails assertion (wrong pix_fmt for h265 preset) */
const BAD_PROBE_H265: ProbeResult = {
  ...GOOD_PROBE,
  streams: [
    {
      codec_name: "hevc",
      codec_type: "video",
      width: 1920,
      height: 1080,
      pix_fmt: "yuv420p", // wrong — h265 preset expects yuv420p10le
      field_order: "progressive",
      profile: "Main",   // wrong — preset expects main10
    },
    GOOD_PROBE.streams[1],
  ],
};

function makeCtx(overrides?: Partial<TranscodeContext>): {
  ctx: TranscodeContext;
  notifications: YouTubeNotification[];
  assets: YouTubeMediaAsset[];
} {
  const notifications: YouTubeNotification[] = [];
  const assets: YouTubeMediaAsset[] = [];
  const ac = new AbortController();

  const ctx: TranscodeContext = {
    signal: ac.signal,
    userId: "user1",
    notify: (n) => notifications.push(n),
    createAsset: async (a) => { assets.push(a); },
    runFfmpeg: vi.fn(async (_flags, _signal, onProgress) => {
      onProgress(50);
      onProgress(100);
    }),
    runProbe: vi.fn(async () => GOOD_PROBE),
    ...overrides,
  };

  return { ctx, notifications, assets };
}

const VALID_REQ = {
  inputPath: "/data/sandbox/user1/input.mp4",
  outputPath: "/data/sandbox/user1/output.mp4",
  preset: "yt-1080p-h264",
  allowFallback: true,
  timeoutSeconds: 3600,
};

// ── Tests ─────────────────────────────────────────────────────────

describe("transcodeForYouTube pipeline", () => {
  it("sdr_1080p happy path: produces asset with correct shape", async () => {
    const { ctx, notifications, assets } = makeCtx();

    const asset = await transcodeForYouTube(VALID_REQ, ctx);

    expect(asset.id).toBeTruthy();
    expect(asset.paths.input).toBe(VALID_REQ.inputPath);
    expect(asset.paths.output).toBe(VALID_REQ.outputPath);
    expect(asset.probes.input).toBeDefined();
    expect(asset.probes.output).toBeDefined();
    expect(assets).toHaveLength(1);

    // Should have progress + ready notifications
    const progressNotifs = notifications.filter((n) => n.type === "youtube:progress");
    const readyNotifs = notifications.filter((n) => n.type === "youtube:ready");
    expect(progressNotifs.length).toBeGreaterThan(0);
    expect(readyNotifs).toHaveLength(1);
    expect(readyNotifs[0].type === "youtube:ready" && readyNotifs[0].preset).toBe("yt-1080p-h264");
  });

  it("h265 assertion failure → fallback to h264 + warning emitted", async () => {
    let probeCallCount = 0;
    const { ctx, notifications } = makeCtx({
      runProbe: vi.fn(async () => {
        probeCallCount++;
        // First call = input probe (good), second = output probe after h265 (bad)
        // Third = input probe again? No — we re-use inputProbe.
        // Second call = postflight for h265 → returns BAD_PROBE_H265
        // Third call = postflight for h264 fallback → returns GOOD_PROBE
        if (probeCallCount === 1) return GOOD_PROBE;       // input probe
        if (probeCallCount === 2) return BAD_PROBE_H265;    // h265 postflight → fails assertion
        return GOOD_PROBE;                                   // h264 fallback postflight → passes
      }),
    });

    const asset = await transcodeForYouTube(
      { ...VALID_REQ, preset: "yt-1080p-h265" },
      ctx,
    );

    expect(asset).toBeDefined();

    // Should have a warning notification about fallback
    const warningNotifs = notifications.filter((n) => n.type === "youtube:warning");
    expect(warningNotifs.length).toBeGreaterThanOrEqual(1);
    expect(
      warningNotifs.some(
        (n) =>
          n.type === "youtube:warning" &&
          n.warnings.some((w) => w.includes("falling back")),
      ),
    ).toBe(true);
  });

  it("AbortSignal cancels immediately", async () => {
    const ac = new AbortController();
    ac.abort(); // pre-abort

    const { ctx } = makeCtx({ signal: ac.signal });

    await expect(
      transcodeForYouTube(VALID_REQ, ctx),
    ).rejects.toThrow("Aborted");
  });

  it("preflight maxOutputBytes estimate rejects when no fallback", async () => {
    const { ctx } = makeCtx();

    await expect(
      transcodeForYouTube(
        {
          ...VALID_REQ,
          maxOutputBytes: 1000, // absurdly small — 120s @ 12Mbps ≈ 189MB
          allowFallback: false,
        },
        ctx,
      ),
    ).rejects.toThrow("exceeds maxOutputBytes");
  });
});
