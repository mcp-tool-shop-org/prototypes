import { describe, it, expect, vi } from "vitest";
import {
  convertDocument,
  type ConvertDocumentContext,
} from "./convert.js";
import { createPandocCRUD } from "./crud.js";
import { ensureCorrectExtension } from "./output-polish.js";
import { PANDOC_PRESET_SPECS } from "./preset-spec.js";
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
  crud: ReturnType<typeof createPandocCRUD>,
  overrides?: Partial<ConvertDocumentContext>,
): {
  ctx: ConvertDocumentContext;
  notifications: PandocNotification[];
} {
  const notifications: PandocNotification[] = [];
  const ac = new AbortController();

  const ctx: ConvertDocumentContext = {
    signal: ac.signal,
    userId: "user1",
    notify: (n) => notifications.push(n),
    createAsset: async (a) => { await crud.create(a); },
    runPandoc: vi.fn(async (_args, _signal, onProgress) => {
      onProgress(50);
      onProgress(99);
    }),
    checkInput: vi.fn(async () => GOOD_INPUT_CHECK),
    assertOutput: vi.fn(async () => GOOD_ASSERTION),
    statFile: vi.fn(async () => ({ size: 9_200 })),
    ...overrides,
  };

  return { ctx, notifications };
}

// ── Tests ────────────────────────────────────────────────────────

describe("pandoc full integration", () => {
  it("blog-post happy path: polish + CRUD create + correct metadata", async () => {
    const crud = createPandocCRUD();
    const { ctx, notifications } = makeCtx(crud);

    const asset = await convertDocument(
      {
        inputPath: "/data/sandbox/user1/readme.md",
        outputPath: "/data/sandbox/user1/readme.html",
        preset: "blog-post",
      },
      ctx,
    );

    // Asset shape
    expect(asset.id).toBeTruthy();
    expect(asset.preset).toBe("blog-post");
    expect(asset.outputPath).toBe("/data/sandbox/user1/readme.html");
    expect(asset.inputMetadata.format).toBe("markdown");
    expect(asset.inputMetadata.sizeBytes).toBe(5_000);
    expect(asset.outputMetadata.format).toBe("html5");
    expect(asset.outputMetadata.sizeBytes).toBe(9_200);
    expect(asset.expiresAt).toBeTruthy();
    expect(new Date(asset.expiresAt).getTime()).toBeGreaterThan(Date.now());

    // CRUD persisted
    const stored = await crud.read(asset.id);
    expect(stored).not.toBeNull();
    expect(stored?.id).toBe(asset.id);

    const all = await crud.list();
    expect(all).toHaveLength(1);

    // Filter by preset
    const filtered = await crud.list({ preset: "academic-pdf" });
    expect(filtered).toHaveLength(0);

    // Notifications: progress → ready
    const readyNotifs = notifications.filter((n) => n.type === "pandoc:ready");
    expect(readyNotifs).toHaveLength(1);
    expect(
      readyNotifs[0].type === "pandoc:ready" && readyNotifs[0].sizeBytes,
    ).toBe(9_200);
  });

  it("newsletter fallback → correct preset in asset + warning emitted", async () => {
    let assertCallCount = 0;
    const crud = createPandocCRUD();
    const { ctx, notifications } = makeCtx(crud, {
      assertOutput: vi.fn(async () => {
        assertCallCount++;
        return assertCallCount === 1 ? BAD_ASSERTION : GOOD_ASSERTION;
      }),
    });

    const asset = await convertDocument(
      {
        inputPath: "/data/sandbox/user1/news.md",
        outputPath: "/data/sandbox/user1/news.html",
        preset: "newsletter",
      },
      ctx,
    );

    // Should have fallen back to blog-post
    expect(asset.preset).toBe("blog-post");
    expect(asset.outputPath).toBe("/data/sandbox/user1/news.html");
    expect(asset.outputMetadata.format).toBe("html5");

    // CRUD has the fallback asset
    const stored = await crud.read(asset.id);
    expect(stored?.preset).toBe("blog-post");

    // Warning about fallback was emitted
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

  it("dual preset smoke: blog-post + academic-pdf in same CRUD store", async () => {
    const crud = createPandocCRUD();

    // Blog-post
    const { ctx: ctx1 } = makeCtx(crud);
    const blogAsset = await convertDocument(
      {
        inputPath: "/data/sandbox/user1/post.md",
        outputPath: "/data/sandbox/user1/post.html",
        preset: "blog-post",
      },
      ctx1,
    );

    // Academic PDF
    const { ctx: ctx2 } = makeCtx(crud);
    const pdfAsset = await convertDocument(
      {
        inputPath: "/data/sandbox/user1/thesis.md",
        outputPath: "/data/sandbox/user1/thesis.pdf",
        preset: "academic-pdf",
      },
      ctx2,
    );

    // Both stored
    const all = await crud.list();
    expect(all).toHaveLength(2);

    // Filter works
    const blogs = await crud.list({ preset: "blog-post" });
    expect(blogs).toHaveLength(1);
    expect(blogs[0].id).toBe(blogAsset.id);

    const pdfs = await crud.list({ preset: "academic-pdf" });
    expect(pdfs).toHaveLength(1);
    expect(pdfs[0].id).toBe(pdfAsset.id);

    // Different output formats
    expect(blogAsset.outputMetadata.format).toBe("html5");
    expect(pdfAsset.outputMetadata.format).toBe("pdf");
  });
});

// ── Output polish unit tests ─────────────────────────────────────

describe("ensureCorrectExtension", () => {
  it("returns unchanged if extension matches", () => {
    const spec = PANDOC_PRESET_SPECS["blog-post"];
    expect(ensureCorrectExtension("out.html", spec)).toBe("out.html");
  });

  it("appends extension if missing", () => {
    const spec = PANDOC_PRESET_SPECS["academic-pdf"];
    expect(ensureCorrectExtension("thesis", spec)).toBe("thesis.pdf");
  });

  it("appends correct extension if different", () => {
    const spec = PANDOC_PRESET_SPECS["ebook"];
    expect(ensureCorrectExtension("book.txt", spec)).toBe("book.txt.epub");
  });
});
