---
title: Usage
description: CLI commands, programmatic API, and integration patterns for prov-engine-js.
sidebar:
  order: 2
---

prov-engine-js works as both a CLI tool and as code you can import into your own projects. All CLI output is JSON written to stdout.

## CLI commands

The engine exposes five commands.

### `describe` — Print capability manifest

```bash
npx @mcptoolshop/prov-engine-js describe
```

Returns the engine's capability manifest: name, version, implemented methods, and conformance level.

### `digest <file>` — Compute canonical form and digest

```bash
npx @mcptoolshop/prov-engine-js digest input.json
```

Reads a JSON file, canonicalizes it per prov-spec Section 6, and computes a SHA-256 digest over the canonical UTF-8 bytes. Returns both the canonical form (so you can inspect what was hashed) and the digest.

### `wrap <file>` — Wrap in an MCP envelope

```bash
npx @mcptoolshop/prov-engine-js wrap payload.json
```

Wraps any JSON payload in a versioned MCP envelope. If the input is already an envelope (`schema_version` equals `mcp.envelope.v0.1`), it passes through unchanged to prevent double-wrapping.

### `verify-digest <file>` — Verify a digest claim

```bash
npx @mcptoolshop/prov-engine-js verify-digest artifact.json
```

The input file must contain `content` and `digest` fields. The engine re-canonicalizes the content, re-computes the hash, and compares. Exit code 0 means valid; exit code 1 means mismatch.

### `check-vector <dir>` — Run a prov-spec test vector

```bash
npx @mcptoolshop/prov-engine-js check-vector ../prov-spec/spec/vectors/integrity.digest.sha256
```

The vector directory must contain `input.json` and `expected.json`. The engine auto-detects the vector type from the expected output shape.

## Programmatic usage

The engine is an ES module. You can use the canonicalization and digest functions in your own code:

```js
import { createHash } from "node:crypto";

// Canonicalization (self-contained, no dependencies)
function canonicalize(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Non-finite numbers not allowed");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return "{" + keys.map(k => JSON.stringify(k) + ":" + canonicalize(value[k])).join(",") + "}";
  }
  throw new Error(`Non-JSON value type: ${typeof value}`);
}

// Compute a digest
const payload = { tool: "demo", version: 1 };
const canonical = canonicalize(payload);
const hash = createHash("sha256").update(canonical, "utf8").digest("hex");

console.log("Canonical:", canonical);
console.log("SHA-256:  ", hash);
```

:::note
A future release will export `canonicalize`, `computeDigest`, and `wrapEnvelope` as named exports so you can import them directly.
:::

## Integration patterns

### CI pipelines

Add digest verification to your CI workflow to detect tampered artifacts:

```yaml
- name: Verify artifact integrity
  run: npx @mcptoolshop/prov-engine-js verify-digest build-output.json
```

Compute digests at build time and store them alongside artifacts:

```yaml
- name: Compute provenance digest
  run: npx @mcptoolshop/prov-engine-js digest dist/manifest.json > dist/manifest.digest.json
```

### MCP tool servers

Wrap tool outputs in MCP envelopes before returning them to consumers. This gives every tool output a uniform shape for routing, validation, and logging.

### Test suites

Run prov-spec conformance checks as part of your test suite to ensure your provenance pipeline stays valid across updates.

## Exit codes

| Code | Meaning |
|------|---------|
| `0`  | Success (or digest verified) |
| `1`  | Failure (invalid input, digest mismatch, vector failure) |
