---
title: Canonicalization
description: How prov-engine-js produces deterministic JSON for reliable digests.
sidebar:
  order: 3
---

Canonicalization is the process of producing a single, deterministic byte sequence from any JSON value. Without it, the same logical object can produce different digests depending on key order or whitespace.

## The problem

JSON is not deterministic by default. These three strings represent the same logical object but produce different byte sequences:

```json
{"b": 2, "a": 1}
{"a":1,"b":2}
{ "a" : 1 , "b" : 2 }
```

If you hash them as raw bytes, you get three different digests for the same data. Canonicalization solves this by defining exactly one correct serialization for any JSON value.

## The rules (prov-spec Section 6)

prov-engine-js implements a JCS-subset (RFC 8785 compatible) canonicalization:

| Rule | Detail |
|------|--------|
| **Sorted keys** | Object keys sorted lexicographically by Unicode code point order |
| **No whitespace** | No spaces or newlines between tokens. Separators are `,` and `:` only |
| **Number normalization** | No leading zeros, no trailing zeros after decimal, no positive sign, `-0` becomes `0` |
| **Minimal string escaping** | Only required JSON escape sequences are emitted |
| **UTF-8 encoding** | The canonical string is encoded as UTF-8 before hashing |
| **Recursive** | Arrays and nested objects are canonicalized at every level |

## Example walkthrough

Given this input (parsed from any formatting):

```json
{
  "name": "example",
  "version": 2,
  "tags": ["beta", "alpha"],
  "metadata": {
    "z_field": true,
    "a_field": null
  }
}
```

The canonical output is:

```
{"metadata":{"a_field":null,"z_field":true},"name":"example","tags":["beta","alpha"],"version":2}
```

What happened:

- **Top-level keys sorted**: `metadata` before `name` before `tags` before `version`
- **Nested keys sorted**: `a_field` before `z_field`
- **Array order preserved**: arrays are ordered sequences, so `["beta","alpha"]` stays the same
- **No whitespace**: everything is tightly packed

## Why not `JSON.stringify` with a replacer?

`JSON.stringify(obj, Object.keys(obj).sort())` does not recursively sort nested objects. It also adds whitespace if you pass an indent argument. The `canonicalize` function handles all nesting levels and produces strictly minimal output.

## The digest pipeline

Once canonicalization produces a deterministic UTF-8 string, the digest pipeline is straightforward:

```
JSON value
  → canonicalize(value)      → deterministic UTF-8 string
  → encode as UTF-8 bytes    → Node.js crypto handles this
  → SHA-256 hash             → 32 bytes
  → hex-encode               → 64-character lowercase hex string
```

The `digest` command outputs both the `canonical_form` (so you can inspect what was hashed) and the `digest` object with the algorithm and hex value.

## Conformance levels

prov-spec defines two conformance statuses:

### Fully conformant

An engine is fully conformant at a given level if it implements all required methods, passes all test vectors, and reports zero known deviations. prov-engine-js is fully conformant at Level 1 (Integrity).

### Partially conformant

An engine is partially conformant if it implements some but not all methods, passes most but not all vectors, or reports known deviations.

## prov-spec levels

| Level | Name | Scope |
|-------|------|-------|
| L1 | Integrity | Canonical JSON + cryptographic digests. Proves content has not changed. |
| L2 | Attribution | Signatures and identity. Proves who produced the content. |
| L3 | Lineage | Dependency chains and transformation records. Proves how content was derived. |

prov-engine-js implements Level 1 fully. Levels 2 and 3 are outside the current scope, as they require signature infrastructure and dependency tracking that go beyond the single-file zero-dependency design.

## Test vectors

prov-spec ships test vectors: pairs of `input.json` and `expected.json` files. Any conformant engine must produce the expected output for each input. The `check-vector` command validates against these vectors.

The engine auto-detects the vector type from the shape of `expected.json`:

- If it has `canonical_form` and `digest` fields: `integrity.digest.sha256` vector
- If it has `schema_version` equal to `mcp.envelope.v0.1`: `adapter.wrap.envelope_v0_1` vector
