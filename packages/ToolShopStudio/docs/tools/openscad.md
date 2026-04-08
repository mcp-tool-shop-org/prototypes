# OpenSCAD MCP

> Pure-text parametric CAD: STL, OBJ, 3MF, PNG preview, DXF — text in, mesh out

**Version:** 1.7.0-toolshop  
**Pipeline:** `renderModel`

## Presets

| Preset | Format | Extension | Tier | Fallback |
|--------|--------|-----------|------|----------|
| `stl-print-ready` | STL | `.stl` | Guaranteed | — |
| `obj-mesh` | OBJ | `.obj` | Guaranteed | — |
| `3mf-color` | 3MF | `.3mf` | Premium | stl-print-ready |
| `png-preview` | PNG | `.png` | Guaranteed | — |
| `dxf-2d` | DXF | `.dxf` | Guaranteed | — |

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
- quality-to-$fn mapping (draft=16, standard=32, high=64)
- custom line-buffer progress parser (plain text stderr)
- dangerous construct detection (import, surface, include, use)
- user variables injection via -D key=value

## Example

**Render parametric cube to STL**

```typescript
await openscad.renderModel(
  { inputPath: "cube.scad", outputPath: "cube.stl", preset: "stl-print-ready", variables: { size: 20 } },
  { signal, userId, notify, createAsset, runOpenSCAD, checkInput, assertOutput, statFile },
);
```
