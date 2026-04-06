---
title: Reference
description: Capture output format, settings, validation, and development workflow.
sidebar:
  order: 2
---

## Capture output format

The extension produces a `RawCapture` JSON document. This is a pre-compilation DOM snapshot -- not yet compiled to the full WebSketch IR grammar. The top-level structure:

| Field | Type | Description |
|-------|------|-------------|
| `root` | object | Root node of the captured DOM tree |
| `metadata` | object | Page metadata (see below) |
| `warnings` | string[] | Present when capture limits were exceeded |

### Metadata fields

| Field | Type | Description |
|-------|------|-------------|
| `metadata.url` | string | Source page URL |
| `metadata.title` | string | Page title |
| `metadata.timestamp` | string | ISO 8601 capture timestamp |
| `metadata.schemaVersion` | string | IR schema version (currently `"0.1"`) |
| `metadata.viewport` | object | `width` and `height` of the browser viewport |

### Node structure

Each node in the `root` tree contains:

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | HTML tag name (e.g. `"DIV"`, `"SPAN"`) |
| `id` | string? | Element `id` attribute, omitted if empty |
| `classes` | string[]? | CSS class names, omitted if none |
| `text` | string? | Direct text content (not children), truncated to `maxStringLength` |
| `bounds` | DOMRect | Bounding box from `getBoundingClientRect` (`x`, `y`, `width`, `height`, etc.) |
| `styles` | object | Three computed properties: `display`, `position`, `visibility` |
| `children` | array? | Child nodes, omitted if none or if depth limit reached |

## Settings

Click **Settings** in the popup header to open the options page:

| Setting | Default | Description |
|---------|---------|-------------|
| `maxDepth` | 50 | Maximum DOM tree traversal depth |
| `maxNodes` | 10,000 | Maximum nodes in the capture |
| `maxStringLength` | 10,000 | Maximum characters per text content |

Settings are persisted via `chrome.storage.sync`, so they follow your Chrome profile across devices.

### Truncation behavior

When limits are exceeded, the extension adds messages to the `warnings` array:

- **maxDepth** -- subtrees beyond the depth limit are omitted. A warning names the element and how many children were skipped.
- **maxNodes** -- capture stops adding new nodes after the limit. A warning reports how many siblings were skipped.
- **maxStringLength** -- text content is silently truncated (no warning added).

A yellow warning banner appears in the popup showing the first warning message.

## Validation

Validate a capture against the WebSketch IR schema using the CLI:

```bash
websketch validate capture.json
```

This checks structural integrity, required fields, and version compatibility. Install the WebSketch CLI from [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli).

## Rendering

Convert a capture to human-readable formats:

```bash
# ASCII tree view
websketch render capture.json

# Full rendering with styles
websketch render capture.json --format detailed
```

## Development

### Building

```bash
npm ci
npm run build        # Production build to dist/
npm run dev          # Watch mode for development
```

The build script (`build.js`) uses esbuild to bundle TypeScript, copies static assets from `src/static/`, and generates `manifest.json` (Manifest V3) into `dist/`.

### Testing

```bash
npm test             # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Coverage report
npm run typecheck    # TypeScript type checking
npm run lint         # Run ESLint
npm run validate     # All checks: typecheck + lint + test + build
```

### Project structure

```
websketch-extension/
  src/
    content.ts         # Content script — captures DOM in the target page
    popup.ts           # Popup UI — triggers capture, copies to clipboard
    options.ts         # Options page — configure capture limits
    settings.ts        # Settings helper — chrome.storage.sync read/write
    static/
      popup.html       # Popup HTML
      options.html     # Options page HTML
      icons/           # Extension icons (16/48/128px PNGs)
  tests/               # Vitest test files
  scripts/             # Utility scripts (icon placeholders)
  build.js             # esbuild bundler + manifest generator
  dist/                # Built extension (load this in Chrome)
```

**Note:** There is no checked-in `manifest.json`. The build script generates it into `dist/` with Manifest V3, requesting `activeTab`, `scripting`, and `storage` permissions. The content script is injected at `document_idle`, meaning capture runs after the page has finished loading.

### Build internals

The build script (`build.js`) performs three steps in order:

1. **Asset validation** -- checks that required icons and HTML files exist under `src/static/`. Pass `--allow-missing` to skip this check during development when icons are not yet created.
2. **Static copy** -- copies `popup.html`, `options.html`, and icon PNGs into `dist/`.
3. **TypeScript bundle** -- uses esbuild to compile `content.ts`, `popup.ts`, and `options.ts` into IIFE bundles targeting Chrome 100+. The `crypto` module is marked as external because the bundled `@mcptoolshop/websketch-ir` library references it for fingerprinting, which the extension does not use.

The generated `manifest.json` declares the content script to match `<all_urls>` with `run_at: "document_idle"`, so the capture function is available on every page after it finishes loading.

## Security and data scope

- **No network egress** -- the extension does not send captured data anywhere. It copies to clipboard only.
- **Content script** runs in the target page with read-only DOM access. It only reads element tag names, IDs, classes, text content, bounding boxes, and three computed style properties.
- **Settings storage** uses `chrome.storage.sync` for capture limits only -- no page data is persisted.
- **No telemetry** collected or sent.

### Chrome permissions explained

| Permission | Why it is needed |
|------------|-----------------|
| `activeTab` | Access the DOM of the tab you click the extension icon on. Cannot access other tabs. |
| `scripting` | Inject the content script that performs the DOM capture. |
| `storage` | Persist your capture limit settings via `chrome.storage.sync`. |

The extension does not request `host_permissions`, `tabs`, `cookies`, or any network-related permissions. It cannot read browsing history, intercept network traffic, or access tabs you have not explicitly activated it on.
