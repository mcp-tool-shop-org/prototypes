<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-demo/readme.png" width="400" alt="WebSketch">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-demo/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-demo/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/websketch-demo/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-demo/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Interactive demo site for [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) — visualize grammar-based UI representation.

## Getting Started

1. Visit the [live demo](https://mcp-tool-shop-org.github.io/websketch-demo/)
2. Paste a WebSketch capture JSON into the Input pane
3. Click **Visualize** to see Tree and ASCII views
4. Switch to **Compare** mode to diff two captures side-by-side
5. Click **Export Bundle** to download a shareable `.ws.json` file

Captures are created with the [Chrome extension](https://github.com/mcp-tool-shop-org/websketch-extension). See the full [workflow guide](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started).

## Features

- Interactive visualization of WebSketch IR grammar
- Live JSON editor with syntax validation
- Tree view with role badges, semantic hints, and bbox info
- ASCII wireframe rendering
- Compare mode with side-by-side ASCII and diff summary
- Export bundle for sharing captures
- Embedded warning display for truncated captures
- Fast, lightweight vanilla TypeScript implementation
- Responsive design for all devices

## Quick Start

### For Developers

#### Prerequisites

- Node.js 20+
- npm or yarn

#### Installation

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-demo.git
cd websketch-demo

npm ci
npm run dev
```

The app will open at `http://localhost:3000`.

#### Available Scripts

```bash
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run preview          # Preview production build

npm run typecheck        # Run TypeScript type checking
npm run lint             # Check code with ESLint
npm run format           # Format code with Prettier

npm test                 # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

## Project Structure

```
websketch-demo/
├── src/
│   ├── __tests__/          # Test files
│   ├── main.ts             # Application entry point
│   └── styles.css          # Global styles
├── .github/
│   └── workflows/
│       └── ci.yml          # CI/CD pipeline
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── vitest.config.ts        # Vitest configuration
```

## Technology Stack

- **Framework**: Vanilla TypeScript (no framework overhead)
- **Build Tool**: Vite
- **Testing**: Vitest
- **Linting**: ESLint + TypeScript ESLint
- **Formatting**: Prettier
- **CI/CD**: GitHub Actions

## Links

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **Issues**: [github.com/mcp-tool-shop-org/websketch-demo/issues](https://github.com/mcp-tool-shop-org/websketch-demo/issues)

## Security & Data Scope

| Aspect | Detail |
|--------|--------|
| **Data touched** | User-pasted JSON in browser (client-side only), no server processing |
| **Data NOT touched** | No telemetry, no analytics, no backend, no persistent storage |
| **Permissions** | Browser sandbox only — no file access, no network calls |
| **Network** | None — static site, all processing client-side |
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

MIT — see [LICENSE](LICENSE).

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
