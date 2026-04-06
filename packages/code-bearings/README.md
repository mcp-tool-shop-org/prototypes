<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/code-bearings/readme.png" width="600" alt="Code Bearings">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/code-bearings/actions"><img src="https://github.com/mcp-tool-shop-org/code-bearings/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@code-bearings/cli"><img src="https://img.shields.io/npm/v/@code-bearings/cli" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/code-bearings/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/code-bearings/"><img src="https://img.shields.io/badge/Landing_Page-blue" alt="Landing Page"></a>
</p>

**Get your bearings back in your code.**

Code Bearings is a source-grounded control surface for modern codebases. It indexes your TypeScript project into a graph of files, symbols, modules, and dependencies — then projects that truth onto every surface where you need it: CLI, VS Code, CI.

Truth stays canonical. AI helps explain, teach, and project. The human stays in charge.

## What It Does

| Surface | What you get |
|---------|-------------|
| **CLI** | `code-bearings analyze` indexes your project. `code-bearings review` generates a change brief from any git diff — risk-scored, evidence-backed, with reviewer guidance. |
| **VS Code** | Activity bar trees, interactive review panels, hover tooltips, CodeLens annotations, gutter decorations, status bar context — all fed from the same canonical truth. |
| **CI** | `code-bearings ci` generates review artifacts (Markdown, JSON, HTML) and optionally fails on risk thresholds. |

## Install

```bash
# CLI (global)
npm install -g @code-bearings/cli

# Or run directly
npx @code-bearings/cli analyze

# VS Code extension (from marketplace or local)
# Search "Code Bearings" in the VS Code extensions panel
```

## Quick Start

```bash
# 1. Index your project
code-bearings analyze

# 2. Review your changes
code-bearings review

# 3. Explore the graph
code-bearings modules
code-bearings module store
code-bearings function generateChangeBrief

# 4. Compare branches
code-bearings compare main feature-branch

# 5. Generate CI artifacts
code-bearings ci --fail-on-risk high
```

## Architecture

Code Bearings is a monorepo with three packages that share a strict layering contract:

```
@code-bearings/core    ← Shared product logic (extraction, graph, review, rendering)
@code-bearings/cli     ← Thin CLI consuming core
@code-bearings/vscode  ← Thin editor surface consuming core
```

**Core owns truth.** CLI is thin. Extension is thin. No forked product.

### Three Layers of Truth

| Layer | What | Example |
|-------|------|---------|
| **A. Extracted Truth** | Facts from source code | "Function X calls function Y" |
| **B. Derived Structure** | Computed from Layer A | "Module M has fan-in 7, risk score 25" |
| **C. Human Narration** | Explanations over A+B | "This change removes error handling from a high-traffic path" |

### Five Purpose Modes

General Review tells the truth. Other modes help humans think with that truth.

| Mode | Lens |
|------|------|
| **General** | Canonical change brief — what changed, risk, evidence |
| **Bug Hunter** | Failure hypotheses, blind spots, inspection prompts |
| **Learning** | Syntax translations, before/after explanations |
| **Architecture** | Module roles, boundary health, system position |
| **Exploration** | Guided questions for unfamiliar codebases |

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [`@code-bearings/core`](packages/core/) | Shared extraction, graph, review, and rendering logic | [![npm](https://img.shields.io/npm/v/@code-bearings/core)](https://www.npmjs.com/package/@code-bearings/core) |
| [`@code-bearings/cli`](packages/cli/) | Command-line interface | [![npm](https://img.shields.io/npm/v/@code-bearings/cli)](https://www.npmjs.com/package/@code-bearings/cli) |
| [`@code-bearings/vscode`](packages/vscode/) | VS Code extension | — |

## Requirements

- Node.js >= 20
- TypeScript project with a `tsconfig.json`
- Git (for review/compare commands)

## Security & Trust

- **No network access.** No telemetry. No analytics. No phone-home.
- **Read-only source access.** Code Bearings reads your source files via AST parsing. It never modifies them.
- **Local database only.** The `.code-bearings/bearings.db` SQLite file stays in your project.
- **No code execution.** Static analysis only.

See [SECURITY.md](SECURITY.md) for the full threat model.

## License

[MIT](LICENSE)

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
