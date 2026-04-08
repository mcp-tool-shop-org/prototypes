# Start Here

**Welcome to the MCP Tool Registry.** This is the ecosystem hub for identifying, discovering, and installing MCP-compatible tools.

## Quick Orientation

- **What is this?** The canonical source of truth for tools built on the [Model Context Protocol](https://modelcontextprotocol.io). It is a metadata-only registry.
- **Where are the tools?** We index tools. The code lives elsewhere (GitHub, PyPI, etc).
- **Is this safe?** We enforce [Least Privilege](docs/registry-guidelines.md) and [Data Validation](docs/contract.md). Tools default to zero access.

## I want to...

### 🔍 Find a Tool

- **Web**: Browse the [Public Explorer](https://mcp-tool-shop-org.github.io/mcp-tool-registry/).
- **CLI**: Run `mcpt list` or `mcpt search <query>`.

### 📦 Use a Tool

1. Install the CLI: `pip install mcpt` (or `npm install -g @modelcontextprotocol/cli`)
2. Add a tool: `mcpt add <tool-id>`
3. Run it: `mcpt run <tool-id>`

### 🛠️ Submit a Tool

Have you built an MCP server? Add it to the registry.

1. Fork this repository.
2. Edit `registry.json` to add your tool metadata.
3. Open a Pull Request.

👉 [Detailed Submission Guide](docs/submitting-tools.md)

## For Developers & Integrators

- **Schema**: [Product Contract](docs/contract.md)
- **Data Source**: Use `dist/registry.index.json` (The stable artifact).
- **AI Context**: Use `dist/registry.llms.txt` for LLM RAG pipelines.

## Canonical vs Generated Data

- **Canonical**: `registry.json` (The source of truth you edit)
- **Generated**: `dist/*` (Artifacts built by CI for consumption)
