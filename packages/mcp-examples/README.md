<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-examples/readme.png" alt="MCP Examples" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-examples/actions/workflows/validate.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-examples/actions/workflows/validate.yml/badge.svg" alt="Validate Examples"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-examples/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Example workspaces for [MCP Tool Shop](https://github.com/mcp-tool-shop-org).

## How MCP Tool Shop Fits Together

- **Registry** ([mcp-tool-registry](https://github.com/mcp-tool-shop-org/mcp-tool-registry)) → what tools exist
- **CLI** ([mcpt](https://github.com/mcp-tool-shop-org/mcpt)) → how you consume them
- **Examples** → how you learn the model (this repo)
- **Tags** (v0.1.0, v0.2.0) → stability, reproducibility
- **main** → development only; may change without notice; builds may break
- **Tools default to least privilege** → no network, no writes, no side effects
- **Capability is always explicit and opt-in** → you decide when to enable

## Examples

| Example | Description |
|---------|-------------|
| [hello-tools](./hello-tools/) | Your first MCP workspace in 2 minutes |
| [hello-filesystem](./hello-filesystem/) | Irreversible side effects handled safely |

## Quick Start

```bash
cd hello-tools
python -m tools.echo.main "Hello, MCP!"
```

## Security & Data Scope

These examples are **local-only reference code** with no network access by default.

- **Data touched:** Local files in `./sandbox/` (hello-filesystem only, when ALLOW_WRITE=1)
- **Data NOT touched:** No cloud sync, no telemetry, no analytics, no authentication
- **Permissions:** File system writes require explicit opt-in; network requires ALLOW_NETWORK=1
- **Path traversal:** 6+ attack vectors tested in CI (unix, windows, URL-encoded, drive letter, UNC, symlink)

See [SECURITY.md](SECURITY.md) for vulnerability reporting and full threat model.

## Related

- [mcpt](https://github.com/mcp-tool-shop-org/mcpt) - CLI for discovering and running tools
- [mcp-tool-registry](https://github.com/mcp-tool-shop-org/mcp-tool-registry) - Tool metadata registry
