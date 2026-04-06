<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/code-bearings/readme.png" width="400" alt="Code Bearings">
</p>

# @code-bearings/cli

Command-line interface for Code Bearings — source-grounded review, learning, and control for modern codebases.

**Get your bearings back in your code.**

## Install

```bash
# Global install
npm install -g @code-bearings/cli

# Or run directly
npx @code-bearings/cli analyze
```

## Commands

### `analyze` — Index your project

```bash
code-bearings analyze
code-bearings analyze -p ./my-project
code-bearings analyze -t ./tsconfig.build.json
```

Indexes all TypeScript/JavaScript source files, extracts symbols and dependencies, builds module boundaries, and stores everything in a local SQLite database (`.code-bearings/bearings.db`).

### `review` — Generate a change brief

```bash
code-bearings review                     # staged + unstaged vs HEAD
code-bearings review --staged            # staged changes only
code-bearings review HEAD~1..HEAD        # last commit
code-bearings review main..feature       # branch comparison
code-bearings review --stdin             # read diff from stdin
code-bearings review --format html -o review.html
code-bearings review --mode bug-hunter   # purpose mode lens
```

Generates a risk-scored, evidence-backed change brief from any git diff. Includes symbol explanations, reviewer tips, contract shifts, and unknowns.

### `compare` — Compare branches

```bash
code-bearings compare                    # current branch vs main/master
code-bearings compare main               # current branch vs main
code-bearings compare main feature       # explicit base and head
```

### `module` — Show a module card

```bash
code-bearings module auth
code-bearings module auth --json
```

Shows the module's public surface, internal structure, dependencies, reverse dependencies, metrics, and evidence.

### `function` — Show a function card

```bash
code-bearings function generateChangeBrief
code-bearings function generateChangeBrief --json
```

### `overview` — System map

```bash
code-bearings overview
code-bearings overview --json
```

### `modules` — List all modules

```bash
code-bearings modules
```

### `ci` — CI/CD artifacts

```bash
code-bearings ci                         # compare HEAD vs base branch
code-bearings ci --base main --fail-on-risk high
code-bearings ci --out ./review-artifacts
```

Generates Markdown, JSON, HTML, and compact text review artifacts. Optionally exits non-zero if risk exceeds a threshold (`low`, `medium`, `high`).

## Output Formats

| Format | Flag | Description |
|--------|------|-------------|
| Full | `--format full` | Complete Markdown with evidence (default) |
| Compact | `--format compact` | One-line-per-module summary |
| HTML | `--format html` | Interactive HTML report with graphs |
| JSON | `--json` | Machine-readable JSON |

## Purpose Modes

| Mode | Flag | Lens |
|------|------|------|
| General | `--mode general` | Canonical change brief (default) |
| Bug Hunter | `--mode bug-hunter` | Failure hypotheses, blind spots |
| Learning | `--mode learning` | Syntax translations, before/after |
| Architecture | `--mode architecture` | Module roles, boundary health |
| Exploration | `--mode exploration` | Guided questions for unfamiliar code |

## Requirements

- Node.js >= 20
- TypeScript project with `tsconfig.json`
- Git (for review/compare/ci commands)

## Security

- No network access. No telemetry. No analytics.
- Read-only source access. Static analysis only.
- Local SQLite database in `.code-bearings/` directory.

## License

[MIT](../../LICENSE)

---

Part of [Code Bearings](https://github.com/mcp-tool-shop-org/code-bearings) · Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
