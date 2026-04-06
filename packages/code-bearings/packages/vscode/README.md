<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/code-bearings/readme.png" width="400" alt="Code Bearings">
</p>

# Code Bearings for VS Code

Source-grounded review, learning, and control — right inside your editor.

**Get your bearings back in your code.**

## Features

### Activity Bar

Code Bearings adds a compass icon to your activity bar with two tree views:

- **Modules** — Browse all indexed modules, their files, and exported symbols. Click to navigate.
- **Review Brief** — See the current review state: changed modules sorted by risk, contract shifts, unknowns.

### Interactive Review Panel

Run **Code Bearings: Review Changes** to open an interactive review panel alongside your editor.

- Risk-scored module cards with evidence
- SVG dependency graphs
- Click any evidence location to jump to the source
- Switch between five purpose modes (General, Bug Hunter, Learning, Architecture, Exploration)
- Focus mode for deep-diving into individual modules

### Context at the Cursor

When you hover, select, or navigate — Code Bearings tells you what matters:

- **Status bar** — Always-visible one-liner: symbol name, module, callers, tests, risk level
- **Hover tooltips** — Layered intelligence: review context, graph context (callers, callees, tests, downstream), unknowns
- **CodeLens** — Inline annotations on changed symbols during review (risk, change type, downstream impact)
- **Gutter decorations** — Color-coded dots on changed symbol lines (red/yellow/blue for risk levels)

### Freshness Tracking

Code Bearings detects when your context might be stale:

- File saves, branch switches, and new commits are tracked
- Stale indicators appear in the status bar, tree views, and review panel
- Click the stale banner to refresh — atomic updates, no scroll loss
- Manual refresh always available via **Code Bearings: Refresh All**

## Commands

| Command | Description |
|---------|-------------|
| `Code Bearings: Analyze Project` | Index the current workspace |
| `Code Bearings: Review Changes` | Review staged + unstaged changes |
| `Code Bearings: Review Branch` | Review changes against a base branch |
| `Code Bearings: Show Module Card` | Pick a module and view its card |
| `Code Bearings: Show Function Card` | View a function card by name |
| `Code Bearings: System Overview` | Show the full system map |
| `Code Bearings: Show Symbol Detail` | Deep-dive into the symbol at cursor |
| `Code Bearings: Refresh All` | Re-index and re-review if stale |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `codeBearings.dbPath` | `.code-bearings/bearings.db` | Path to the bearings database |
| `codeBearings.autoAnalyze` | `false` | Automatically re-analyze on file save |
| `codeBearings.cursorContext.enabled` | `true` | Show contextual intelligence at cursor |
| `codeBearings.cursorContext.codeLensEnabled` | `true` | Show CodeLens on changed symbols |
| `codeBearings.cursorContext.gutterEnabled` | `true` | Show gutter decorations on changed lines |
| `codeBearings.reviewMode` | `general` | Default review mode lens |

## Requirements

- VS Code >= 1.85.0
- TypeScript/JavaScript project with `tsconfig.json`
- Git (for review commands)

## Security

- No network access. No telemetry. No analytics.
- Read-only source access via AST parsing.
- Local SQLite database in `.code-bearings/` directory.
- Webview scripts are injected by the extension, not loaded externally.

## License

[MIT](../../LICENSE)

---

Part of [Code Bearings](https://github.com/mcp-tool-shop-org/code-bearings) · Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
