# FFmpeg YouTube MCP

> YouTube-safe presets (guaranteed + premium with fallback), closed-GOP locks, dual thumbnails

**Version:** 1.7.0-toolshop  
**Pipeline:** `transcodeForYouTube`

## Presets

| Preset | Format | Extension | Tier | Fallback |
|--------|--------|-----------|------|----------|
| `yt-1080p-h264` | MP4 | `.mp4` | Guaranteed | — |
| `yt-1080p-h265` | MP4 | `.mp4` | Premium | yt-1080p-h264 |
| `yt-4k-h264` | MP4 | `.mp4` | Guaranteed | — |
| `yt-4k-h265` | MP4 | `.mp4` | Premium | yt-4k-h264 |
| `yt-4k-hdr-h265` | MP4 | `.mp4` | Premium | yt-4k-h265 |
| `yt-shorts-h264` | MP4 | `.mp4` | Guaranteed | — |
| `yt-shorts-h265` | MP4 | `.mp4` | Premium | yt-shorts-h264 |

## Architectural Patterns

- schema-first (Zod parse on entry)
- context DI (all side effects injected)
- sandbox validation (path traversal prevention)
- preflight input check (async, stat-based)
- postflight output assertion (async, stat-based)
- spec-driven fallback (premium → guaranteed)
- AbortSignal cancellation (7+ checkpoints)
- typed notifications (progress, warning, ready)
- buildAndNotifyAsset helper
- CRUD factory with lazy hydration
- output polish (auto-extension, metadata, expiry)
- closed-GOP locks (scenecut=0, keyint=60)
- dual thumbnail generation (16:9 + 4:5)
- ffprobe-based input probing

## Example

**SDR 1080p transcode**

```typescript
await transcodeForYouTube(
  { inputPath: "input.mp4", outputPath: "output.mp4", preset: "yt-1080p-h264" },
  { signal, userId, notify, createAsset, runFfmpeg, runProbe },
);
```
