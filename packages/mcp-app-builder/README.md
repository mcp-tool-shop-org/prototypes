<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-app-builder/readme.png" alt="MCP App Builder" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-app-builder/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-app-builder/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/mcp-app-builder"><img src="https://codecov.io/gh/mcp-tool-shop-org/mcp-app-builder/branch/main/graph/badge.svg" alt="codecov" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-1.0-green" alt="MCP" /></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-app-builder/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

> Build MCP servers with interactive UI components — from VS Code.

## Overview

**MCP App Builder** helps developers rapidly create, test, and deploy MCP (Model Context Protocol) servers. It supports the new **MCP Apps** standard (January 2026), enabling interactive UI components directly in AI conversations.

## Features

### Scaffolding
- **New Server Wizard**: Create MCP servers with guided setup
- **Templates**: Basic, With-UI, and Full server configurations
- **Auto-configuration**: TypeScript, MCP SDK, and project structure

### Development
- **Schema Validation**: Real-time validation of `mcp.json` and `mcp-tools.json`
- **Auto-validate on save**: Schemas checked automatically when you save (configurable)
- **Type Generation**: Generate TypeScript types from tool definitions
- **IntelliSense**: JSON Schema support for config files

### Testing
- **Test Harness**: Run tests against your MCP tools
- **Auto-generated Tests**: Tests created from tool definitions and examples
- **Output Channel**: Formatted test results with pass/fail status

### Tool Playground
- **Connect to MCP servers**: stdio or HTTP/SSE transport
- **Browse tools**: See all available tools with descriptions
- **Auto-generated forms**: Input fields generated from tool parameter schemas
- **Invoke and inspect**: Call tools and see formatted results with timing
- **Session history**: Review past invocations, replay with one click

### Dashboard
- **Visual Interface**: Quick access to all commands
- **Workspace Integration**: Detects MCP projects automatically
- **Status Bar**: MCP indicator when in an MCP project

## Quick Start

1. **Install the extension** from VS Code Marketplace or via `code --install-extension mcp-tool-shop.mcp-app-builder`
2. **Create a new server**: `Ctrl+Shift+P` / `Cmd+Shift+P` → "MCP: New Server"
3. **Choose a template**:
   - `basic` - Simple hello world server
   - `with-ui` - Server with table and chart UI components
   - `full` - Complete server with tools, resources, and prompts

## Keyboard Shortcuts

| Shortcut | Command |
|----------|---------|
| `Ctrl+Alt+N` (`Cmd+Alt+N` on Mac) | New Server |
| `Ctrl+Alt+V` (`Cmd+Alt+V` on Mac) | Validate Schema |
| `Ctrl+Alt+P` (`Cmd+Alt+P` on Mac) | Tool Playground |

## Commands

| Command | Description |
|---------|-------------|
| `MCP: New Server` | Create a new MCP server project |
| `MCP: Validate Schema` | Validate the current mcp.json or mcp-tools.json |
| `MCP: Generate Types` | Generate TypeScript types from tool definitions |
| `MCP: Test Server` | Run tests against your MCP tools |
| `MCP: Open Dashboard` | Open the visual dashboard |
| `MCP: Tool Playground` | Interactive tool testing and invocation |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `mcp-app-builder.defaultTemplate` | `basic` | Default template for new servers (basic/with-ui/full) |
| `mcp-app-builder.autoValidate` | `true` | Validate schemas automatically on save |
| `mcp-app-builder.testPort` | `3000` | Port for the MCP test server |

## MCP Apps UI Components

The extension provides builders for MCP Apps UI components:

```typescript
import { table, chart } from '@mcp-app-builder/ui-components';
import { dashboard } from '@mcp-app-builder/ui-components/builders';

// Create a search results table
const results = table(
  [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'status', header: 'Status' },
  ],
  data,
  { pageSize: 10 }
);

// Create a line chart
const lineChart = chart({
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{ label: 'Users', data: [100, 250, 400] }],
  },
});

// Create a dashboard with metrics
const overview = dashboard({
  title: 'Analytics',
  metrics: [
    { label: 'Users', value: 1234, change: 12 },
    { label: 'Revenue', value: '$5,678', change: -3 },
  ],
  chart: { type: 'line', data: { labels: ['Jan', 'Feb', 'Mar'], datasets: [{ label: 'Users', data: [100, 250, 400] }] } },
});
```

## File Structure

Generated MCP server projects follow this structure:

```
my-mcp-server/
├── mcp.json           # Server configuration
├── mcp-tools.json     # Tool definitions
├── package.json       # Node.js dependencies
├── tsconfig.json      # TypeScript configuration
└── src/
    ├── index.ts       # Server entry point
    ├── resources.ts   # Resource handlers (full template)
    └── prompts.ts     # Prompt handlers (full template)
```

## Development

### Prerequisites

- Node.js 18+
- VS Code 1.85+

### Setup

```bash
git clone https://github.com/mcp-tool-shop-org/mcp-app-builder
cd mcp-app-builder
npm install
npm run compile
```

### Running

Press `F5` in VS Code to launch Extension Development Host.

### Testing

```bash
npm test
```

## Roadmap

### Phase 1 (Current) - Deterministic Foundation
- [x] Project scaffolding with templates
- [x] Schema validation system
- [x] Type generation from schemas
- [x] UI component primitives
- [x] Test harness foundation
- [x] Dashboard webview
- [x] Tool Playground (interactive tool invocation)

### Phase 2 - AI-Assisted Development
- [ ] AI tool generation from natural language
- [ ] Smart code completion for tool handlers
- [ ] Automated documentation generation

### Phase 3 - Publishing & Distribution
- [ ] One-click publishing to MCP registries
- [ ] Version management
- [ ] Dependency resolution

### Phase 4 - Visual Builder
- [ ] Drag-and-drop UI component builder
- [ ] Live preview of MCP Apps
- [ ] Visual flow editor

## Contributing

Contributions are welcome! Please read our contributing guidelines (coming soon).

## Security & Privacy

**Data touched:** workspace files (mcp.json, mcp-tools.json, generated TypeScript), VS Code settings, extension output channels.

**Data NOT touched:** source code beyond MCP configs, git history, network (except localhost test harness), credentials, environment variables. No telemetry is collected or sent.

**Permissions:** filesystem read/write for scaffolding and type generation (workspace only), localhost network for test harness. See [SECURITY.md](SECURITY.md) for the full policy.

## License

MIT

## Links

- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP Apps Specification](http://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/)
- [GitHub Organization](https://github.com/mcp-tool-shop-org)

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
