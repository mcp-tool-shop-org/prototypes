---
title: Beginners Guide
description: A step-by-step introduction to provenance, prov-spec, and prov-engine-js for newcomers.
sidebar:
  order: 99
---

New to provenance or prov-engine-js? This page walks you through the core ideas and gets you running in minutes.

## What this tool does

prov-engine-js is a command-line tool (and importable library) that answers two questions about any JSON data:

1. **"Has this data been changed?"** -- It computes a fingerprint (SHA-256 digest) over a deterministic representation of the data. If someone modifies even a single byte, the fingerprint changes.
2. **"Is this data wrapped correctly?"** -- It packages JSON payloads into a standard envelope format (MCP envelope v0.1) so downstream systems know the shape to expect.

The engine is a single JavaScript file with zero npm dependencies. It uses only Node.js built-in modules (`node:fs`, `node:crypto`, `node:process`).

## Key concepts

### Provenance

Provenance means "where something came from." In data pipelines, provenance answers questions like: Was this artifact modified after it was built? Can I trust that this JSON payload is the same one the CI server produced?

### Canonicalization

JSON does not guarantee key order or whitespace. `{"b":2,"a":1}` and `{"a": 1, "b": 2}` are logically identical but produce different bytes. Canonicalization converts any JSON value into a single deterministic byte sequence so that hashing is reliable. prov-engine-js sorts object keys alphabetically and strips all whitespace.

### Digest

A digest is a cryptographic hash of the canonical bytes. prov-engine-js uses SHA-256, producing a 64-character hex string. If the input changes, the digest changes. If the input stays the same, the digest stays the same -- regardless of formatting.

### MCP envelope

An MCP envelope is a thin wrapper around any JSON payload: `{ "schema_version": "mcp.envelope.v0.1", "result": <your data> }`. It standardizes the outer shape so consumers can route, validate, and log tool outputs uniformly.

### prov-spec

prov-spec is the specification that defines how provenance engines should behave. It defines canonicalization rules, digest formats, envelope shapes, and conformance levels. prov-engine-js implements Level 1 (Integrity) of prov-spec.

## Prerequisites

You need Node.js 18 or later. No other software is required. Check your version:

```bash
node --version
# v18.0.0 or higher
```

## Step-by-step tutorial

### 1. Install the engine

Pick whichever method suits your workflow:

```bash
# Option A: add to a project
npm install @mcptoolshop/prov-engine-js

# Option B: run without installing (npx)
npx @mcptoolshop/prov-engine-js --help

# Option C: clone the repo
git clone https://github.com/mcp-tool-shop-org/prov-engine-js.git
cd prov-engine-js
node prov-engine.js --help
```

### 2. Compute your first digest

Create a small JSON file and hash it:

```bash
echo '{"name":"alice","role":"admin"}' > user.json
npx @mcptoolshop/prov-engine-js digest user.json
```

You will see output like this:

```json
{
  "canonical_form": "{\"name\":\"alice\",\"role\":\"admin\"}",
  "digest": {
    "alg": "sha256",
    "value": "..."
  }
}
```

The `canonical_form` shows exactly what was hashed: keys sorted, no whitespace. The `digest.value` is the SHA-256 hex string.

### 3. Verify a digest

Verification re-computes the hash and compares it to a claimed value. Create an artifact file:

```bash
cat > check.json << 'EOF'
{
  "content": {"name": "alice", "role": "admin"},
  "digest": {
    "alg": "sha256",
    "value": "PASTE_THE_DIGEST_VALUE_FROM_STEP_2_HERE"
  }
}
EOF
npx @mcptoolshop/prov-engine-js verify-digest check.json
echo $?
```

If the digest matches, the exit code is `0`. If someone tampered with the content, the exit code is `1` and an error message appears on stderr.

### 4. Wrap data in an MCP envelope

```bash
echo '{"tool":"greet","message":"hello"}' > payload.json
npx @mcptoolshop/prov-engine-js wrap payload.json
```

Output:

```json
{
  "schema_version": "mcp.envelope.v0.1",
  "result": {
    "tool": "greet",
    "message": "hello"
  }
}
```

If the input is already an envelope, the engine passes it through unchanged -- no double-wrapping.

### 5. Inspect the capability manifest

```bash
npx @mcptoolshop/prov-engine-js describe
```

This prints a JSON manifest showing which prov-spec methods the engine implements, its conformance level, and which test vectors it passes.

## Common mistakes

| Mistake | What happens | Fix |
|---------|-------------|-----|
| Passing a directory instead of a file to `digest` | `SyntaxError` from `JSON.parse` | Point to a `.json` file, not a folder |
| Forgetting to create the input file first | `ENOENT` error | Create the file before running the command |
| Using `require()` instead of `import` | `ERR_REQUIRE_ESM` | The package is ESM-only; use `import` syntax |
| Expecting formatted output from `canonicalize` | Canonical JSON has no whitespace | This is by design; the CLI `digest`/`wrap` commands pretty-print their outer output |
| Running `verify-digest` without `content` and `digest` fields | `"Missing 'content' field"` error | The input must have both `content` and `digest` (with `alg` and `value`) |

## Where to go next

- **[Getting Started](/prov-engine-js/handbook/getting-started/)** -- More installation details and first-use examples
- **[Usage](/prov-engine-js/handbook/usage/)** -- All CLI commands, programmatic usage, and integration patterns
- **[Canonicalization](/prov-engine-js/handbook/canonicalization/)** -- Deep dive into how deterministic JSON works
- **[Reference](/prov-engine-js/handbook/reference/)** -- Full CLI reference, capability manifest schema, and FAQ
