# Pandoc MCP

> Zero-flag document conversion: blog, academic PDF, ebook, slides, newsletter

**Version:** 1.7.0-toolshop  
**Pipeline:** `convertDocument`

## Presets

| Preset | Format | Extension | Tier | Fallback |
|--------|--------|-----------|------|----------|
| `blog-post` | html5 | `.html` | Guaranteed | — |
| `academic-pdf` | pdf | `.pdf` | Guaranteed | — |
| `ebook` | epub | `.epub` | Guaranteed | — |
| `slides` | revealjs | `.html` | Guaranteed | — |
| `newsletter` | html5 | `.html` | Premium | blog-post |

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

## Example

**Convert markdown to academic PDF**

```typescript
await pandoc.convertDocument(
  { inputPath: "thesis.md", outputPath: "thesis.pdf", preset: "academic-pdf" },
  { signal, userId, notify, createAsset, runPandoc, checkInput, assertOutput, statFile },
);
```
