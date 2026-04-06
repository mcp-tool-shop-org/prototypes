<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/receipt-factory/readme.png" width="400" />
</p>

# @receipt-factory/cli

The `rf` command — create, collect, render, verify, and sign receipts.

Part of [receipt-factory](https://github.com/mcp-tool-shop-org/receipt-factory).

## Install

```bash
npm install -g @receipt-factory/cli
```

## Commands

| Command | Description |
|---------|-------------|
| `rf make <kind>` | Create a receipt (ci, release, registry-sync, security-audit, sbom) |
| `rf collect <kind>` | Collect evidence into a portable pack |
| `rf render <file>` | Render a receipt to markdown or HTML |
| `rf verify <file>` | Verify receipt integrity (schema, hash, links) |
| `rf lint <file>` | Verify with strict lint checks |
| `rf sign <file>` | Sign a receipt with cosign |
| `rf index [dir]` | Build a receipt index |
| `rf search` | Search the receipt index |
| `rf graph [dir]` | Emit JSON graph of receipt references |
| `rf policy init` | Scaffold a default policy.json |
| `rf policy sign <file>` | Sign a policy with cosign |
| `rf bundle create <file>` | Create a portable receipt bundle (zip) |
| `rf bundle verify <file>` | Verify a receipt bundle |
| `rf bundle sign <file>` | Sign a bundle with cosign |
| `rf bundle inspect <file>` | Show bundle manifest summary |
| `rf init` | Create receipts/ directory |

## Quick start

```bash
# Create a CI receipt from GitHub Actions
rf make ci --from github --run 12345678

# Render to HTML
rf render receipts/ci/2026-03-03/12345678.json --format html

# Verify integrity
rf verify receipts/ci/2026-03-03/12345678.json --strict
```

## License

MIT
