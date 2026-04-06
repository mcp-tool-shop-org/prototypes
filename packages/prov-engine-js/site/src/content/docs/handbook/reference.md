---
title: Reference
description: Complete CLI and API reference for prov-engine-js.
sidebar:
  order: 4
---

## CLI reference

All commands output JSON to stdout. Exit code `0` indicates success; `1` indicates failure.

### `describe`

Print the engine's capability manifest.

```bash
npx @mcptoolshop/prov-engine-js describe
```

**Output:**

```json
{
  "schema": "prov-capabilities@v0.1",
  "engine": {
    "name": "prov-engine-js",
    "version": "1.0.1",
    "vendor": "prov-spec",
    "repo": "https://github.com/mcp-tool-shop-org/prov-engine-js",
    "license": "MIT"
  },
  "implements": [
    "adapter.wrap.envelope_v0_1",
    "integrity.digest.sha256"
  ],
  "optional": [],
  "conformance_level": "fully-conformant",
  "constraints": {
    "canonicalization": "jcs-subset",
    "supported_digest_algorithms": ["sha256"]
  },
  "test_vectors_validated": [
    "integrity.digest.sha256",
    "adapter.wrap.envelope_v0_1"
  ],
  "known_deviations": []
}
```

### `digest <file>`

Canonicalize JSON and compute SHA-256 digest.

```bash
npx @mcptoolshop/prov-engine-js digest input.json
```

**Input:** Any valid JSON file.

**Output:**

```json
{
  "canonical_form": "{\"a\":1,\"b\":2}",
  "digest": {
    "alg": "sha256",
    "value": "abd8d7fa4bab05cdd8da39bee28237e3b2c9cb08ccfc73e0af3e5a6f17eaee5a"
  }
}
```

### `wrap <file>`

Wrap payload in an MCP envelope.

```bash
npx @mcptoolshop/prov-engine-js wrap payload.json
```

**Input:** Any valid JSON file.

**Output:**

```json
{
  "schema_version": "mcp.envelope.v0.1",
  "result": { "...": "original payload" }
}
```

If the input already has `schema_version` equal to `mcp.envelope.v0.1`, it passes through unchanged (no double-wrapping).

### `verify-digest <file>`

Verify a digest claim against recomputed hash.

```bash
npx @mcptoolshop/prov-engine-js verify-digest artifact.json
```

**Input:** JSON file with `content` and `digest` fields:

```json
{
  "content": { "a": 1, "b": 2 },
  "digest": {
    "alg": "sha256",
    "value": "abd8d7fa4bab05cdd8da39bee28237e3b2c9cb08ccfc73e0af3e5a6f17eaee5a"
  }
}
```

**Exit codes:** `0` = valid, `1` = mismatch.

### `check-vector <dir>`

Run a prov-spec test vector.

```bash
npx @mcptoolshop/prov-engine-js check-vector path/to/vector-dir
```

**Input:** Directory containing `input.json` and `expected.json`.

The engine auto-detects the vector type:
- `canonical_form` + `digest` fields = `integrity.digest.sha256`
- `schema_version` = `mcp.envelope.v0.1` = `adapter.wrap.envelope_v0_1`

**Output:** `PASS: <vector-name> vector` on success, error message on failure.

### `--help` / `-h`

Print usage information and exit.

```bash
npx @mcptoolshop/prov-engine-js --help
```

### `--version` / `-v`

Print the engine version and exit.

```bash
npx @mcptoolshop/prov-engine-js --version
# prov-engine.js v1.0.1
```

## Implemented methods

| Method | Input | Output |
|--------|-------|--------|
| `integrity.digest.sha256` | Any JSON value | `{ canonical_form, digest: { alg: "sha256", value: "<hex>" } }` |
| `adapter.wrap.envelope_v0_1` | Any JSON payload | `{ schema_version: "mcp.envelope.v0.1", result: <payload> }` |

## Capability manifest schema

The `describe` command returns a manifest conforming to `prov-capabilities@v0.1`:

| Field | Type | Description |
|-------|------|-------------|
| `schema` | string | Always `"prov-capabilities@v0.1"` |
| `engine.name` | string | Engine identifier |
| `engine.version` | string | Semver version (mirrors `package.json` version) |
| `engine.vendor` | string | Specification the engine targets |
| `engine.repo` | string | Source repository URL |
| `engine.license` | string | SPDX license identifier |
| `implements` | string[] | List of implemented method identifiers |
| `optional` | string[] | Methods supported but not required by the spec |
| `conformance_level` | string | `"fully-conformant"` or `"partially-conformant"` |
| `constraints.canonicalization` | string | Canonicalization strategy (e.g. `"jcs-subset"`) |
| `constraints.supported_digest_algorithms` | string[] | Hash algorithms the engine supports |
| `test_vectors_validated` | string[] | Vector suites the engine passes |
| `known_deviations` | string[] | Documented deviations from the spec (empty when fully conformant) |

## Architecture

The entire engine is a single file (`prov-engine.js`) organized into four sections:

1. **Utilities** — `die()`, `readJsonFile()`, `writeJson()` for basic I/O
2. **Canonical JSON** — `canonicalize()` for deterministic serialization
3. **Digest computation** — `sha256Hex()`, `computeDigest()` for the hash pipeline
4. **Commands** — `cmdDescribe()`, `cmdDigest()`, `cmdWrap()`, `cmdVerifyDigest()`, `cmdCheckVector()` for CLI entry points

### Dependencies

None. The engine uses three Node.js built-in modules only:

| Module | Purpose |
|--------|---------|
| `node:fs` | Read input JSON files from disk |
| `node:crypto` | SHA-256 hash computation |
| `node:process` | CLI argument parsing, exit codes, stdout/stderr |

## Error handling

All errors are written to stderr as plain-text messages and cause the process to exit with code `1`. Common error scenarios:

| Scenario | Message |
|----------|---------|
| Missing CLI argument | `"digest requires <input.json>"` |
| File not found or invalid JSON | Node.js `SyntaxError` or `ENOENT` error |
| Unsupported digest algorithm | `"Unsupported digest algorithm: <alg>"` |
| Digest mismatch | `"Digest mismatch: expected <expected>, got <actual>"` |
| Missing required fields | `"Missing 'content' field"` or `"Missing or invalid 'digest' field"` |
| Non-finite number in JSON | `"Non-finite numbers not allowed in canonical JSON"` |
| Unknown command | `"Unknown command: <cmd>"` |

The engine does not throw unhandled exceptions for expected error paths. Invalid JSON input causes `JSON.parse()` to throw, which Node.js surfaces as a stack trace to stderr.

## FAQ

**Can I use CommonJS (`require`)?**
No. The package is ESM-only (`"type": "module"` in package.json). Use `import` or dynamic `import()`.

**Does this handle binary data?**
No. The engine operates on JSON values. Hash binary artifacts separately.

**What happens with invalid JSON input?**
`JSON.parse()` throws a `SyntaxError` and the process exits with code 1.

**Will L2 (Attribution) or L3 (Lineage) be supported?**
Not in the current scope. Those levels require signature infrastructure and dependency tracking beyond the single-file zero-dependency design.

**Where are the test vectors?**
In the [prov-spec repository](https://github.com/mcp-tool-shop-org/prov-spec), not in this repo. Clone prov-spec alongside this engine and point `check-vector` at the vectors directory.
