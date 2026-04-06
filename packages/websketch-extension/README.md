<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src=".github/websketch-logo.png" alt="WebSketch" width="400">
</p>

# websketch-extension

**Chrome extension to capture web pages as [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir).**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-extension/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-extension/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-extension/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

---

## Getting Started

1. Build and load the extension (see [Installation](#installation))
2. Navigate to any web page and click the WebSketch icon
3. Click "Capture Current Page" — the capture JSON is copied to clipboard
4. Validate: `websketch validate capture.json` or paste into the [demo](https://mcptoolshop.com)
5. Visualize: `websketch render capture.json` or use the demo's Tree/ASCII views

Configure limits via the Settings link in the popup. See the full [workflow guide](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started).

## Features

- One-click page capture
- Automatic clipboard copy
- DOM tree capture with computed styles (display, position, visibility)
- Element bounding boxes (via `getBoundingClientRect`)
- Configurable limits (maxDepth, maxNodes, maxStringLength)
- Warning banners when capture is truncated
- Fast, lightweight — no network calls or external services

## Installation

### From Source (Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/mcp-tool-shop-org/websketch-extension.git
   cd websketch-extension
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` directory

### Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store soon.

## Usage

1. **Navigate** to any web page
2. **Click** the WebSketch extension icon in your toolbar
3. **Click** "Capture Current Page"
4. **Copy** the capture data (automatically copied to clipboard)
5. **Use** the WebSketch IR data with other tools

## Development

### Prerequisites

- Node.js 18+
- npm
- Chrome or Edge browser

### Setup

```bash
npm ci
npm run typecheck
npm run lint
npm test
```

### Build

```bash
npm run build       # Production build
npm run dev         # Development build with watch mode
```

The built extension will be in the `dist/` directory.

### Project Structure

```
websketch-extension/
├── src/
│   ├── content.ts         # Content script — DOM capture logic
│   ├── popup.ts           # Popup UI — triggers capture, shows result
│   ├── options.ts         # Options page — configure capture limits
│   ├── settings.ts        # Settings helper — chrome.storage read/write
│   └── static/
│       ├── popup.html     # Popup HTML
│       ├── options.html   # Options page HTML
│       └── icons/         # Extension icons (16/48/128px)
├── tests/                 # Vitest tests
├── scripts/               # Utility scripts (icon placeholders)
├── build.js               # esbuild bundler + manifest generator
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Scripts

```bash
npm run build           # Build for production
npm run dev             # Watch mode for development
npm run clean           # Remove dist/ directory
npm run typecheck       # Run TypeScript type checking
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm test                # Run tests in watch mode
npm run test:run        # Run tests once
npm run test:coverage   # Generate coverage report
npm run validate        # Run all checks (typecheck, lint, test, build)
```

## WebSketch IR Format

The extension captures pages in the WebSketch IR format:

```json
{
  "root": {
    "type": "HTML",
    "id": "...",
    "classes": ["..."],
    "text": "...",
    "bounds": { "x": 0, "y": 0, "width": 1920, "height": 1080 },
    "styles": { "display": "block", "position": "static", "visibility": "visible" },
    "children": [...]
  },
  "metadata": {
    "url": "https://example.com",
    "title": "Page Title",
    "timestamp": "2026-01-29T...",
    "schemaVersion": "0.1",
    "viewport": { "width": 1920, "height": 1080 }
  },
  "warnings": []
}
```

## Troubleshooting

**Build fails with missing assets:**
```bash
npm run build -- --allow-missing
```

**Extension not loading:** Ensure `dist/manifest.json` exists. Check `chrome://extensions/` for errors. Try `npm run clean && npm run build`.

**Capture not working:** Check browser console for errors. Ensure you're on a normal webpage (not `chrome://` pages). Reload the extension after rebuilding.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security & Data Scope

| Aspect | Detail |
|--------|--------|
| **Data touched** | Current tab DOM (read-only), captured WebSketch IR JSON (clipboard/download) |
| **Data NOT touched** | No telemetry, no analytics, no remote servers, no credential storage |
| **Permissions** | Chrome: activeTab, scripting, storage (sync settings only). No background network |
| **Network** | None — fully offline extension |
| **Telemetry** | None collected or sent |

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10 |
| B. Error Handling | 10 |
| C. Operator Docs | 10 |
| D. Shipping Hygiene | 10 |
| E. Identity (soft) | 10 |
| **Overall** | **50/50** |

> Full audit: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## License

MIT — see [LICENSE](LICENSE) for details.

## Links

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **Issues**: [github.com/mcp-tool-shop-org/websketch-extension/issues](https://github.com/mcp-tool-shop-org/websketch-extension/issues)
