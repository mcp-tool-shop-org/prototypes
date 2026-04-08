---
title: Getting Started
description: Install ToolShopStudio and run your first conversion.
sidebar:
  order: 1
---

## Installation

```bash
npm install @mcptoolshop/toolshopstudio
```

## First transcode

Every tool follows the same pattern: pass a request object (input/output/preset) and a context object with injected side effects. Here is a complete FFmpeg example:

```typescript
import { transcodeForYouTube, createInMemoryCRUD, runFfmpeg, runProbe } from "@mcptoolshop/toolshopstudio";

const crud = createInMemoryCRUD();
const controller = new AbortController();

const video = await transcodeForYouTube(
  { inputPath: "input.mp4", outputPath: "output.mp4", preset: "yt-1080p-h264" },
  {
    signal: controller.signal,
    userId: "demo-user",
    notify: (n) => console.log(n.type, n),
    createAsset: (a) => crud.create(a),
    runFfmpeg,
    runProbe,
  },
);
```

The same pattern applies to every tool -- swap the pipeline function and provide the tool-specific runner:

```typescript
import { pandoc } from "@mcptoolshop/toolshopstudio";

const doc = await pandoc.convertDocument(
  { inputPath: "post.md", outputPath: "post.html", preset: "blog-post" },
  { signal, userId, notify, createAsset, runPandoc, checkInput, assertOutput, statFile },
);
```

## Docker

All six runtime binaries are pre-installed in the Docker image:

```bash
docker build -t toolshopstudio .
docker run -v ./sandbox:/sandbox toolshopstudio
```

## CLI

Use the `toolshop` CLI to interact with the registry:

```bash
npm run toolshop registry list         # table of all tools + preset counts
npm run toolshop registry show ffmpeg  # full details for one tool
npm run toolshop registry summary      # 6 tools, 32 presets, 15 formats
npm run toolshop registry docs         # generate markdown docs to docs/
```

## Development

```bash
npm install          # dependencies
npm run typecheck    # tsc --noEmit
npm test             # vitest (323 tests)
npm run build        # compile to dist/
npm run smoke        # end-to-end smoke (all six tools + registry, 15 tests)
npm run docs:generate # generate registry docs to docs/
```
