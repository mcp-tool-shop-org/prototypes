---
title: Getting Started
description: Install prov-engine-js and compute your first provenance digest.
sidebar:
  order: 1
---

prov-engine-js is a minimal, zero-dependency Node.js provenance engine that implements the prov-spec standard. It computes canonical JSON digests and wraps payloads in MCP envelopes.

## Prerequisites

- **Node.js 18 or later** (tested on 18, 20, and 22)
- No other dependencies required

## Install

Add prov-engine-js to your project:

```bash
pnpm add @mcptoolshop/prov-engine-js
```

Or run commands directly without installing:

```bash
npx @mcptoolshop/prov-engine-js describe
```

You can also clone the repo and run the engine file directly:

```bash
git clone https://github.com/mcp-tool-shop-org/prov-engine-js.git
cd prov-engine-js
node prov-engine.js describe
```

## First use: compute a digest

Create a JSON file and compute its canonical form and SHA-256 digest:

```bash
echo '{"b":2,"a":1}' > input.json
npx @mcptoolshop/prov-engine-js digest input.json
```

Output:

```json
{
  "canonical_form": "{\"a\":1,\"b\":2}",
  "digest": {
    "alg": "sha256",
    "value": "abd8d7fa4bab05cdd8da39bee28237e3b2c9cb08ccfc73e0af3e5a6f17eaee5a"
  }
}
```

Notice that the keys were sorted (`a` before `b`) and whitespace was removed. The digest is computed over this canonical byte sequence.

## Verify a digest

To verify that content matches a claimed digest, create an artifact file:

```bash
cat > artifact.json << 'EOF'
{
  "content": {"a": 1, "b": 2},
  "digest": {
    "alg": "sha256",
    "value": "abd8d7fa4bab05cdd8da39bee28237e3b2c9cb08ccfc73e0af3e5a6f17eaee5a"
  }
}
EOF
npx @mcptoolshop/prov-engine-js verify-digest artifact.json
echo $?  # 0 = valid
```

## Wrap a payload in an MCP envelope

```bash
echo '{"tool":"example","result":"ok"}' > payload.json
npx @mcptoolshop/prov-engine-js wrap payload.json
```

Output:

```json
{
  "schema_version": "mcp.envelope.v0.1",
  "result": {
    "tool": "example",
    "result": "ok"
  }
}
```

## What is provenance?

Provenance is the record of where something came from and what happened to it. For data flowing through automated pipelines, provenance provides a verifiable trail. prov-engine-js targets **Level 1 (Integrity)** of the prov-spec standard, which covers canonical JSON serialization and cryptographic digests.

## Next steps

- [Usage](/prov-engine-js/handbook/usage/) covers all CLI commands and programmatic patterns
- [Canonicalization](/prov-engine-js/handbook/canonicalization/) explains the deterministic JSON rules in detail
- [Reference](/prov-engine-js/handbook/reference/) has the full CLI and API reference
