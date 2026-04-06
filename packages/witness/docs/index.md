# Witness

A local-first, append-only, cryptographically verifiable event journal for human-AI work.

## Key Features

- **Append-only event journal** — local-first, no cloud dependency
- **Ed25519 signatures** + SHA-256 digests over canonical JSON
- **Testimony generation** — portable proof trails for audits
- **Offline verification** — third parties validate without Witness installed
- **Deterministic replay** — same inputs produce same output bytes
- **CLI interface** — init, record, testify, verify commands

## Install / Quick Start

```bash
pip install cryptography
witness init
witness record --action "example.action" --intent "Demo"
witness testify --format md
witness verify
```

## Links

- [GitHub Repository](https://github.com/mcp-tool-shop-org/witness)
- [MCP Tool Shop](https://github.com/mcp-tool-shop-org)
