# Blender MCP

> Headless 3D rendering: PNG preview, GLB export, video, STL mesh, Cycles — no GUI needed

**Version:** 1.7.0-toolshop  
**Pipeline:** `renderBlend`

## Presets

| Preset | Format | Extension | Tier | Fallback |
|--------|--------|-----------|------|----------|
| `png-preview` | PNG | `.png` | Guaranteed | — |
| `glb-export` | GLB | `.glb` | Guaranteed | — |
| `video-1080p` | MP4 | `.mp4` | Guaranteed | — |
| `stl-from-mesh` | STL | `.stl` | Guaranteed | — |
| `cycles-render` | PNG | `.png` | Premium | png-preview |

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
- safe pre-baked Python one-liners for GLB/STL export (no user code)
- quality-to-samples mapping (draft=64, standard=256, high=1024)
- custom line-buffer progress parser (Fra:/Rendered/tiles keywords)
- 7 throwIfAborted checkpoints for responsive cancellation

## Example

**Render Blender scene to PNG preview**

```typescript
await blender.renderBlend(
  { inputPath: "scene.blend", outputPath: "render.png", preset: "png-preview" },
  { signal, userId, notify, createAsset, runBlender, checkInput, assertOutput, statFile },
);
```
