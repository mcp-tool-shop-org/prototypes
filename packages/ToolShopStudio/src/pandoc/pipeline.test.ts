import { describe, it, expect, vi } from "vitest";
import {
  convertDocument,
  type ConvertDocumentContext,
} from "./convert.js";
import type { PandocDocumentAsset } from "./schemas.js";
import type { PandocNotification } from "./types.js";
import type { PandocInputCheck, PandocAssertionResult } from "./preflight.js";
import type { PandocPresetSpec } from "./preset-spec.js";

// ── Fixtures ─────────────────────────────────────────────────────

const GOOD_INPUT_CHECK: PandocInputCheck = {
  ok: true,
  warnings: [],
  sizeBytes: 5_000,
  detectedFormat: "markdown",
};

const GOOD_ASSERTION: PandocAssertionResult = {
  ok: true,
  warnings: [],
};

const BAD_ASSERTION: PandocAssertionResult = {
  ok: false,
  warnings: ["Output file is empty — pandoc produced no content."],
};

function makeCtx(
  overrides?: Partial<ConvertDocumentContext>,
): {
  ctx: ConvertDocumentContext;
  notifications: PandocNotification[];
  assets: PandocDocumentAsset[];
} {
  const notifications: PandocNotification[] = [];
  const assets: PandocDocumentAsset[] = [];
  const ac = new AbortController();

  const ctx: ConvertDocumentContext = {
    signal: ac.signal,
    userId: "user1",
    notify: (n) => notifications.push(n),
    createAsset: vi.fn(async (a) => {
      assets.push(a);
    }),
    runPandoc: vi.fn(async (_args, _signal, onProgress) => {
      onProgress(50);
      onProgress(99);
    }),
    checkInput: vi.fn(async () => GOOD_INPUT_CHECK),
    assertOutput: vi.fn(async () => GOOD_ASSERTION),
    statFile: vi.fn(async () => ({ size: 12_000 })),
    ...overrides,
  };

  return { ctx, notifications, assets };
}

const VALID_REQ = {
  inputPath: "/data/sandbox/user1/doc.md",
  outputPath: "/data/sandbox/user1/doc.html",
  preset: "blog-post" as const,
  timeoutSeconds: 60,
  maxOutputBytes: 0,
};

// ── Tests ────────────────────────────────────────────────────────

describe("convertDocument pipeline", () => {
  it("blog-post happy path: produces asset with correct shape", async () => {
    const { ctx, notifications, assets } = makeCtx();

    const asset = await convertDocument(VALID_REQ, ctx);

    expect(asset.id).toBeTruthy();
    expect(asset.inputPath).toBe(VALID_REQ.inputPath);
    expect(asset.outputPath).toBe(VALID_REQ.outputPath);
    expect(asset.preset).toBe("blog-post");
    expect(asset.inputMetadata.format).toBe("markdown");
    expect(asset.inputMetadata.sizeBytes).toBe(5_000);
    expect(asset.outputMetadata.format).toBe("html5");
    expect(asset.outputMetadata.sizeBytes).toBe(12_000);
    expect(assets).toHaveLength(1);

    // Should have progress + ready notifications
    const progressNotifs = notifications.filter(
      (n) => n.type === "pandoc:progress",
    );
    const readyNotifs = notifications.filter(
      (n) => n.type === "pandoc:ready",
    );
    expect(progressNotifs.length).toBeGreaterThan(0);
    expect(readyNotifs).toHaveLength(1);

    // Final progress must be 100%
    const last100 = progressNotifs.filter(
      (n) => n.type === "pandoc:progress" && n.percent === 100,
    );
    expect(last100.length).toBeGreaterThanOrEqual(1);

    // Ready notification has correct shape
    const ready = readyNotifs[0];
    expect(ready.type === "pandoc:ready" && ready.preset).toBe("blog-post");
    expect(ready.type === "pandoc:ready" && ready.sizeBytes).toBe(12_000);
  });

  it("newsletter → fallback to blog-post on assertion fail + warning emitted", async () => {
    let assertCallCount = 0;
    const { ctx, notifications } = makeCtx({
      assertOutput: vi.fn(async () => {
        assertCallCount++;
        // First call (newsletter) → fails assertion
        // Second call (blog-post fallback) → passes
        return assertCallCount === 1 ? BAD_ASSERTION : GOOD_ASSERTION;
      }),
    });

    const asset = await convertDocument(
      {
        ...VALID_REQ,
        preset: "newsletter",
      },
      ctx,
    );

    expect(asset).toBeDefined();
    // Should have fallen back to blog-post
    expect(asset.preset).toBe("blog-post");

    // Should have a warning notification about fallback
    const warningNotifs = notifications.filter(
      (n) => n.type === "pandoc:warning",
    );
    expect(warningNotifs.length).toBeGreaterThanOrEqual(1);
    expect(
      warningNotifs.some(
        (n) =>
          n.type === "pandoc:warning" &&
          n.warnings.some((w) => w.includes("falling back")),
      ),
    ).toBe(true);
  });

  it("AbortSignal cancels immediately", async () => {
    const ac = new AbortController();
    ac.abort(); // pre-abort

    const { ctx } = makeCtx({ signal: ac.signal });

    await expect(convertDocument(VALID_REQ, ctx)).rejects.toThrow("Aborted");
  });

  it("maxOutputBytes preflight rejects when estimate exceeds limit", async () => {
    const { ctx } = makeCtx();

    // blog-post → html5 → factor 1.8 → 5000 * 1.8 = 9000
    // Set maxOutputBytes to 100 (way below 9000)
    await expect(
      convertDocument(
        {
          ...VALID_REQ,
          maxOutputBytes: 100,
        },
        ctx,
      ),
    ).rejects.toThrow("exceeds maxOutputBytes");
  });
});
