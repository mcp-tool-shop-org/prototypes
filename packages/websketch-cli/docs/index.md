# websketch-cli

**CLI for WebSketch IR rendering, diffing, and fingerprinting.**

websketch-cli turns WebSketch IR capture files into actionable output for humans, LLMs, and CI pipelines. Point it at a `.json` capture and get ASCII layouts, structural fingerprints, semantic diffs, or bundled packages -- all from a single command-line tool.

## Quick start

```bash
npm install -g @mcptoolshop/websketch

# Render a capture as ASCII art
websketch render-ascii capture.json

# Compute a structural fingerprint
websketch fingerprint capture.json

# Diff two captures
websketch diff before.json after.json

# Bundle captures into a shareable file
websketch bundle before.json after.json -o bundle.ws.json
```

## What it does

| Command | Purpose |
|---------|---------|
| `validate` | Check that a capture conforms to the WebSketch IR schema |
| `render-ascii` | Render a capture to ASCII art (LLM-readable with `--llm`) |
| `fingerprint` | Hash a page layout for change detection without pixel diffing |
| `diff` | Compare two captures and produce a ranked change report |
| `bundle` | Package captures (and optional diff) into a single `.ws.json` file |

Every command supports `--json` for machine-readable output and deterministic exit codes for CI scripting.

## Links

- [GitHub repository](https://github.com/mcp-tool-shop-org/websketch-cli)
- [npm package](https://www.npmjs.com/package/@mcptoolshop/websketch)
- [MCP Tool Shop](https://mcp-tool-shop.github.io/)
- [Handbook](https://github.com/mcp-tool-shop-org/websketch-cli/blob/main/HANDBOOK.md)
- [Contributing](https://github.com/mcp-tool-shop-org/websketch-cli/blob/main/CONTRIBUTING.md)
- [Changelog](https://github.com/mcp-tool-shop-org/websketch-cli/blob/main/CHANGELOG.md)
