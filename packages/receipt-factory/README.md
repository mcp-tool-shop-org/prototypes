<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/receipt-factory/readme.png" width="400" alt="receipt-factory">
</p>

<p align="center">
  Receipts are how we prove work happened — without trusting vibes.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/receipt-factory/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/receipt-factory/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/receipt-factory/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/receipt-factory/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

A receipt is a signed, timestamped, reproducible record of **what happened**:

- **What was done** — actions, inputs, outputs
- **Why it was done** — intent, policy, context
- **Who/what did it** — actor, runner, tool versions
- **Proof it happened** — hashes, links, checksums, logs
- **How to verify it** — commands, re-run instructions

You can read a receipt in 30 seconds and verify it in 2 minutes. Everything is reproducible. If it isn't, it's not a receipt.

## Packages

| Package | Description |
|---------|-------------|
| [`@receipt-factory/core`](packages/core) | Receipt schema, canonicalization, SHA-256 hashing, fluent builder API |
| [`@receipt-factory/render`](packages/render) | Markdown + standalone HTML renderers |
| [`@receipt-factory/verify`](packages/verify) | Schema validation, hash integrity, link verification, policy enforcement |
| [`@receipt-factory/sign`](packages/sign) | Cosign-based signing — receipts, policies, bundles (detached sidecars) |
| [`@receipt-factory/evidence`](packages/evidence) | Evidence packs — portable, content-addressed evidence bundles |
| [`@receipt-factory/index`](packages/index) | Receipt index — scan, search, filter receipt directories |
| [`@receipt-factory/policy`](packages/policy) | Policy packs — portable, versioned lint configuration |
| [`@receipt-factory/bundle`](packages/bundle) | Receipt bundles — self-verifying truth capsules (zip) |
| [`@receipt-factory/adapter-github`](packages/adapters/github) | GitHub Actions data fetching via `gh` CLI |
| [`@receipt-factory/cli`](apps/factory-cli) | The `rf` command — create, collect, render, verify, sign receipts |

## Pipelines

| Pipeline | Receipt Kind | What it proves |
|----------|-------------|----------------|
| [`ci-receipts`](pipelines/ci-receipts) | `ci_run` | A CI build/test happened with specific inputs and results |
| [`release-receipts`](pipelines/release-receipts) | `release` | A release was published with specific assets and commits |
| [`registry-sync`](pipelines/registry-sync) | `registry_sync` | What's published vs what's in the repo — drift classification |
| [`security-audit`](pipelines/security-audit) | `audit` | What was scanned, with what tool, what vulnerabilities were found |
| [`sbom`](pipelines/sbom) | `sbom` | Software bill of materials generated and attested |

## Quick start

```bash
# Install the CLI
npm install -g @receipt-factory/cli

# Create a receipt from a GitHub Actions run
rf make ci --from github --run 12345678

# Render it
rf render receipts/ci/2026-03-03/12345678.json --format html

# Verify it
rf verify receipts/ci/2026-03-03/12345678.json

# Verify with strict lint + policy
rf verify receipts/ci/2026-03-03/12345678.json --strict --policy policy.json

# Bundle receipts into a portable capsule
rf bundle create receipts/ci/2026-03-03/12345678.json --follow --policy policy.json

# Sign the bundle
rf bundle sign bundles/abc123.bundle.zip --keyless
```

## Trust layers

receipt-factory provides four stacking trust layers:

1. **Receipt integrity** — SHA-256 content-addressed receipts (tamper-evident)
2. **Governance integrity** — policy-based lint rules with signed policy files
3. **Bundle integrity** — self-verifying zip bundles with hash manifests
4. **Bundle authority** — detached cosign signatures on bundles (tamper-proof)

Verification order: signature → file integrity → semantic integrity → governance.

## What this proves

- A build, test, release, audit, or SBOM generation happened at a specific time
- The inputs and outputs are content-addressed and tamper-evident
- You can re-verify the receipt at any time with `rf verify`
- The full provenance chain is walkable with `rf graph`

## What this does NOT prove

- That the underlying code is correct (receipts prove process, not quality)
- That the CI environment itself wasn't compromised (that's a supply chain problem)
- That artifacts haven't been modified after receipt creation (use signing for that)

## Security

See [SECURITY.md](SECURITY.md) for threat model and reporting.

**No telemetry.** receipt-factory never phones home, tracks usage, or collects analytics.

## License

MIT

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
