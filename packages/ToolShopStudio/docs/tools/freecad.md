# FreeCAD MCP

> Safe 3D CAD export: STL, STEP, GLB, 3MF, OBJ — headless, no user code

**Version:** 1.7.0-toolshop  
**Pipeline:** `exportPart`

## Presets

| Preset | Format | Extension | Tier | Fallback |
|--------|--------|-----------|------|----------|
| `stl-print-ready` | STL | `.stl` | Guaranteed | — |
| `step-precision` | STEP | `.step` | Guaranteed | — |
| `glb-web-ready` | GLB | `.glb` | Guaranteed | — |
| `3mf-slicer-ready` | 3MF | `.3mf` | Premium | stl-print-ready |
| `obj-mesh` | OBJ | `.obj` | Guaranteed | — |

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
- safe Python one-liners via FreeCADCmd -c (no exec/eval)
- $INPUT/$OUTPUT placeholder substitution

## Example

**Export FreeCAD part to print-ready STL**

```typescript
await freecad.exportPart(
  { inputPath: "bracket.FCStd", outputPath: "bracket.stl", preset: "stl-print-ready" },
  { signal, userId, notify, createAsset, runFreeCAD, checkInput, assertOutput, statFile },
);
```
