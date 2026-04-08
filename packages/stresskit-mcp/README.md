<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/stresskit-mcp/readme.png" width="400" alt="StressKit-MCP">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/stresskit-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Health and security testing toolkit for MCP (Model Context Protocol) servers. Answers the question: "Is this MCP server safe enough to run, and predictable enough to depend on, under real workloads?"

## Features

- **Protocol Compliance** — Verify MCP handshake, tool schemas, error format, and capability honesty
- **Security Scanning** — Validate input sanitization, auth flows, path traversal, shell injection, and secret leakage
- **Operational Readiness** — Measure latency (p50/p95/p99), concurrency ramp, and crash recovery
- **Trust Model** — Check command transparency, source pinning, minimal permissions, and update safety
- **Evidence Generation** — Produce structured JSON reports with finding codes, severity, and repro bundles

## Quick Start

```bash
# Clone and run from source
git clone https://github.com/mcp-tool-shop-org/stresskit-mcp.git
cd stresskit-mcp

# Run checks against a stdio MCP server (ad-hoc)
python engines/stresskit-cli/stresskit_cli.py check python -m my_mcp_server

# Run checks against a named target from stresskit.targets.json
python engines/stresskit-cli/stresskit_cli.py check --target claude-fresh

# Run all enabled targets
python engines/stresskit-cli/stresskit_cli.py check --all

# Choose specific profiles (default: mcp-core)
python engines/stresskit-cli/stresskit_cli.py check --target claude-fresh -p mcp-core -p mcp-ops

# JSON output for CI
python engines/stresskit-cli/stresskit_cli.py check --target claude-fresh --json
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `check` | Run profile checks against one or more MCP servers |
| `version` | Show CLI version, schema version, and available profiles |
| `profiles` | List available test profiles with check counts |
| `targets` | List configured targets from `stresskit.targets.json` |
| `validate` | Validate a previously generated report file against the schema |

## Profiles

StressKit ships with four test profiles, each covering a different quality dimension:

| Profile | Title | Checks | Status |
|---------|-------|--------|--------|
| `mcp-core` | Protocol Correctness | 7 of 11 implemented (handshake, list_tools, error_format, capability_honesty, invoke_smoke, schema_reject_invalid, timeout_behavior) | Live |
| `mcp-ops` | Operational Readiness | 1 of 12 implemented (concurrency_ramp) | Live |
| `mcp-secure` | Security Posture | 15 defined | Planned |
| `mcp-trust` | Trust Model | 11 defined | Planned |

## Target Configuration

Define MCP servers to test in `stresskit.targets.json`:

```json
{
  "targets": [
    {
      "name": "my-server",
      "display_name": "My MCP Server",
      "transport": { "kind": "stdio", "command": "python", "args": ["-m", "my_server"] },
      "fixtures": {
        "invoke_smoke": { "tool": "my_tool", "args": {} }
      },
      "tags": ["local", "python"]
    }
  ]
}
```

Fixtures tell StressKit which tools to call during checks. Without `invoke_smoke`, smoke and concurrency checks are skipped for that target.

## Project Structure

```
stresskit-mcp/
├── engines/stresskit-cli/  # Python CLI: stresskit_cli.py, mcp_client.py, check_runner.py, target_loader.py
├── profiles/               # Profile definitions (mcp-core, mcp-ops, mcp-secure, mcp-trust)
├── schemas/                # JSON schemas for reports and target config
├── tests/                  # pytest suite (version consistency + smoke tests)
└── stresskit.targets.json  # Example target configuration
```

## Related Projects

- [tool-scan](https://github.com/mcp-tool-shop-org/tool-scan) — Security scanner for MCP tools
- [mcp-stress-test](https://github.com/mcp-tool-shop-org/mcp-stress-test) — Red team toolkit for scanner validation

## Security & Data Scope

| Aspect | Detail |
|--------|--------|
| **Data touched** | MCP server connections (stdio/SSE), test results, JSON reports written to disk |
| **Data NOT touched** | No telemetry, no analytics, no credential storage, no cloud sync |
| **Permissions** | Network: connects to target MCP servers only. Disk: writes JSON reports to output directory |
| **Network** | Outbound to target MCP servers only (user-configured) |
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

MIT License — see [LICENSE](LICENSE) for details.

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
