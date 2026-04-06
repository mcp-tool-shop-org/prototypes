<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src=".github/websketch-logo.png" alt="WebSketch" width="400">
</p>

# websketch-mcp

**MCP server exposing [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) tools for LLM agents.**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-mcp/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-mcp/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/websketch-mcp"><img src="https://img.shields.io/npm/v/@mcptoolshop/websketch-mcp?style=flat-square&color=cb3837" alt="npm version"></a>
</p>

MCP server exposing [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) tools for LLM agents.

## Getting Started

```bash
# Install
npm install -g @mcptoolshop/websketch-mcp

# Add to Claude Desktop config:
# { "mcpServers": { "websketch": { "command": "websketch-mcp" } } }

# The MCP server exposes 4 tools:
# 1. websketch_validate - preflight check (always call first)
# 2. websketch_render   - ASCII wireframe
# 3. websketch_diff     - compare two captures
# 4. websketch_fingerprint - structural hash
```

See the full [workflow guide](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started) in websketch-ir.

## Features

- 🛡️ **websketch_validate**: Preflight validation (never throws, returns `{ ok: true/false }`)
- 🎨 **websketch_render**: Render WebSketch IR captures to ASCII wireframes
- 🔍 **websketch_diff**: Compute diffs between UI captures
- 🔑 **websketch_fingerprint**: Generate deterministic fingerprints for captures

## Installation

### npm

```bash
npm install -g @mcptoolshop/websketch-mcp
```

### From Source

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-mcp.git
cd websketch-mcp
npm ci
npm run build
npm link
```

## Usage

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "websketch": {
      "command": "websketch-mcp"
    }
  }
}
```

### Programmatic

```bash
# Run as stdio server
websketch-mcp
```

Or programmatically in Node.js:

```typescript
import { spawn } from 'child_process';

const server = spawn('websketch-mcp', [], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

// Send MCP JSON-RPC messages to server.stdin
// Read MCP responses from server.stdout
```

## Tools

### websketch_render

Render a WebSketch IR capture to ASCII wireframe.

**Input:**
```json
{
  "capture": {
    "root": {
      "type": "Frame",
      "id": "root",
      "children": [...]
    }
  }
}
```

**Output:**
```
┌─────────────────────┐
│ Frame (root)        │
│ ├── Button (#btn1)  │
│ └── Text (#text1)   │
└─────────────────────┘
```

### websketch_diff

Compute a diff between two WebSketch IR captures.

**Input:**
```json
{
  "before": { "root": {...} },
  "after": { "root": {...} }
}
```

**Output:**
```json
{
  "added": [...],
  "removed": [...],
  "modified": [...]
}
```

### websketch_fingerprint

Generate a deterministic fingerprint for a capture.

**Input:**
```json
{
  "capture": { "root": {...} }
}
```

**Output:**
```
abc123def456...
```

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/mcp-tool-shop-org/websketch-mcp.git
cd websketch-mcp

# Install dependencies
npm ci

# Build
npm run build

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

### Scripts

```bash
npm run build         # Compile TypeScript to dist/
npm run dev           # Watch mode compilation
npm run start         # Run the compiled server
npm run typecheck     # Type checking without emit
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Generate coverage report
npm run clean         # Remove dist/ folder
```

### Project Structure

```
websketch-mcp/
├── src/
│   └── index.ts          # Main server implementation
├── tests/
│   ├── smoke.test.ts           # Smoke tests
│   ├── validate-tool.test.ts   # Validation tool tests
│   ├── validation.test.ts      # Capture validation tests
│   └── version.test.ts         # Version check tests
├── scripts/
│   └── add-shebang.js    # Post-build script
├── .github/
│   ├── workflows/
│   │   ├── ci.yml        # CI pipeline (includes security scanning)
│   │   └── publish.yml   # npm publish (release + dispatch)
│   └── dependabot.yml    # Dependency updates
├── dist/                 # Compiled output (gitignored)
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
├── vitest.config.ts      # Test configuration
└── .eslintrc.cjs         # ESLint configuration
```

## Testing

```bash
# Run all tests
npm test

# Run tests once (for CI)
npm run test:run

# Generate coverage report
npm run test:coverage
```

Tests are written using Vitest. See `tests/` directory for examples.

## Publishing

The package is configured with pre-publish safety checks:

```bash
# This will automatically:
# 1. Run type checking
# 2. Run linting
# 3. Run tests
# 4. Build the package
npm publish
```

Manual publish steps:

```bash
# Bump version
npm version patch|minor|major

# Publish to npm
npm publish

# Push tags
git push --follow-tags
```

## Troubleshooting

### CLI Not Found After Install

```bash
# Ensure global bin directory is in PATH
npm config get prefix

# Or use npx
npx websketch-mcp
```

### Build Failures

```bash
# Clean and rebuild
npm run clean
npm ci
npm run build
```

### Permission Errors on Unix

The post-build script automatically makes `dist/index.js` executable. If you encounter issues:

```bash
chmod +x dist/index.js
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security & Data Scope

| Aspect | Detail |
|--------|--------|
| **Data touched** | WebSketch IR JSON captures received via MCP protocol (in-memory processing only) |
| **Data NOT touched** | No telemetry, no analytics, no persistent storage, no credential storage |
| **Permissions** | stdio transport only — no network egress, no filesystem writes |
| **Network** | None — server communicates only via stdin/stdout |
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

MIT - see [LICENSE](LICENSE) file for details.

## Links

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **Model Context Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Issues**: [github.com/mcp-tool-shop-org/websketch-mcp/issues](https://github.com/mcp-tool-shop-org/websketch-mcp/issues)

## Support

For questions or issues, please open an issue on GitHub.
