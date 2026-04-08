import { describe, it, expect, vi } from "vitest";
import { generateYouTubeThumbnail, type ThumbnailContext } from "./generate-thumbnail.js";
import { createInMemoryCRUD } from "./crud.js";
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

// ── Thumbnail tests ───────────────────────────────────────────────

describe("generateYouTubeThumbnail", () => {
  it("happy path: generates dual thumbnails", async () => {
    const mockExtract = vi.fn(async () => {});
    const mockGenerate = vi.fn(async () => {});

    const ctx: ThumbnailContext = {
      signal: new AbortController().signal,
      userId: "user1",
      tmpDir: "/data/sandbox/user1/tmp",
      extractFrame: mockExtract,
      generateStyledThumbnail: mockGenerate,
    };

    const result = await generateYouTubeThumbnail(
      {
        videoPath: "/data/sandbox/user1/output.mp4",
        output: {
          landscape: "/data/sandbox/user1/thumb_16x9.jpg",
          portrait: "/data/sandbox/user1/thumb_4x5.jpg",
        },
      },
      ctx,
    );

    expect(result.landscape).toBe("/data/sandbox/user1/thumb_16x9.jpg");
    expect(result.portrait).toBe("/data/sandbox/user1/thumb_4x5.jpg");

    // extractFrame called once (single temp still)
    expect(mockExtract).toHaveBeenCalledTimes(1);

    // generateStyledThumbnail called twice (landscape + portrait)
    expect(mockGenerate).toHaveBeenCalledTimes(2);

    // Verify dimensions: first call = 1280x720, second = 1080x1350
    const call0 = mockGenerate.mock.calls[0] as unknown[];
    expect(call0[2]).toBe(1280);
    expect(call0[3]).toBe(720);

    const call1 = mockGenerate.mock.calls[1] as unknown[];
    expect(call1[2]).toBe(1080);
    expect(call1[3]).toBe(1350);
  });

  it("passes overlay text through to generateStyledThumbnail", async () => {
    const mockGenerate = vi.fn(async () => {});

    const result = await generateYouTubeThumbnail(
      {
        videoPath: "/data/sandbox/user1/output.mp4",
        output: {
          landscape: "/data/sandbox/user1/thumb_16x9.jpg",
          portrait: "/data/sandbox/user1/thumb_4x5.jpg",
        },
        overlayText: "MY TITLE",
      },
      {
        signal: new AbortController().signal,
        userId: "user1",
        tmpDir: "/data/sandbox/user1/tmp",
        extractFrame: vi.fn(async () => {}),
        generateStyledThumbnail: mockGenerate,
      },
    );

    // Both calls should receive overlay text
    const c0 = mockGenerate.mock.calls[0] as unknown[];
    const c1 = mockGenerate.mock.calls[1] as unknown[];
    expect(c0[5]).toBe("MY TITLE");
    expect(c1[5]).toBe("MY TITLE");
  });
});

// ── Transcode + thumbnail wiring test ─────────────────────────────

describe("transcode with thumbnail wiring", () => {
  it("generates thumbnails when generateThumbnail is provided", async () => {
    const notifications: YouTubeNotification[] = [];
    const crud = createInMemoryCRUD();
    const mockThumbGen = vi.fn(async () => ({
      landscape: "/data/sandbox/user1/output_thumb_16x9.jpg",
      portrait: "/data/sandbox/user1/output_thumb_4x5.jpg",
    }));

    const ctx: TranscodeContext = {
      signal: new AbortController().signal,
      userId: "user1",
      notify: (n) => notifications.push(n),
      createAsset: async (a) => { await crud.create(a); },
      runFfmpeg: vi.fn(async (_f, _s, onProgress) => {
        onProgress(50);
        onProgress(100);
      }),
      runProbe: vi.fn(async () => GOOD_PROBE),
      generateThumbnail: mockThumbGen,
    };

    const asset = await transcodeForYouTube(
      {
        inputPath: "/data/sandbox/user1/input.mp4",
        outputPath: "/data/sandbox/user1/output.mp4",
        preset: "yt-1080p-h264",
      },
      ctx,
    );

    expect(asset.thumbnailPaths.landscape).toBe(
      "/data/sandbox/user1/output_thumb_16x9.jpg",
    );
    expect(asset.thumbnailPaths.portrait).toBe(
      "/data/sandbox/user1/output_thumb_4x5.jpg",
    );
    expect(mockThumbGen).toHaveBeenCalledTimes(1);
  });
});
