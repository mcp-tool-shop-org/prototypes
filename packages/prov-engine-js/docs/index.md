# prov-engine-js

A minimal, zero-dependency Node.js provenance engine implementing the [prov-spec](https://github.com/mcp-tool-shop-org/prov-spec) standard.

## What It Does

Computes canonical JSON digests and wraps payloads in MCP envelopes — the two fundamental operations for provenance integrity. Single-file engine, zero dependencies, fully conformant with prov-spec Level 1 (Integrity).

## Key Features

- **Zero dependencies** — uses only Node.js built-ins
- **Single-file engine** — entire implementation in `prov-engine.js`
- **CLI + programmatic** — command line or import into your code
- **prov-spec L1 conformant** — passes all Level 1 test vectors
- **JCS-subset canonicalization** — deterministic JSON per prov-spec Section 6

## Install

```bash
pnpm add @mcptoolshop/prov-engine-js
```

## Quick Start

```bash
# Compute a digest
echo '{"b":2,"a":1}' > input.json
npx @mcptoolshop/prov-engine-js digest input.json

# Wrap in envelope
npx @mcptoolshop/prov-engine-js wrap payload.json
```

## Links

- [GitHub Repository](https://github.com/mcp-tool-shop-org/prov-engine-js)
- [npm Package](https://www.npmjs.com/package/@mcptoolshop/prov-engine-js)
- [prov-spec](https://github.com/mcp-tool-shop-org/prov-spec) — the specification
- [MCP Tool Shop](https://github.com/mcp-tool-shop-org)
