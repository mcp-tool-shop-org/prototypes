---
title: Getting Started
description: What prov-spec is, who it serves, and how to run your first validation.
sidebar:
  order: 1
---

## What is prov-spec?

prov-spec is a **normative specification** that defines:

- **Method IDs** -- stable, namespaced identifiers for provenance operations.
- **Provenance Records** -- structured JSON objects documenting tool invocations.
- **Conformance Levels** -- testable compliance tiers so implementations can declare exactly what they support.
- **Test Vectors** -- canonical input/output pairs for interoperability testing.

## What is it not?

prov-spec is deliberately narrow:

- **Not a framework** -- there is no runtime, no library to import.
- **Not an SDK** -- implement the spec in any language you choose.
- **Not MCP-specific** -- the envelope compatibility layer is optional.
- **Not Python-specific** -- the reference validator happens to be Python, but the spec is language-neutral.

## Who is it for?

| Audience | How they use the spec |
|----------|----------------------|
| **Engine authors** | Implement provenance in any language against stable method IDs |
| **Tool integrators** | Wrap existing tools with standards-compliant provenance records |
| **Auditors** | Verify provenance claims using test vectors and the reference validator |
| **Infrastructure builders** | Build provenance-aware pipelines with forward-compatibility guarantees |

## Verify in 10 seconds

Clone the repo and run a test vector:

```bash
git clone https://github.com/mcp-tool-shop-org/prov-spec
cd prov-spec
python tools/python/prov_validator.py check-vector integrity.digest.sha256
```

Expected output:

```
INFO: Test vector integrity.digest.sha256 passed
```

## Declare conformance

Ship a `prov-capabilities.json` in your project root:

```json
{
  "schema": "prov-capabilities@v0.1",
  "engine": {
    "name": "your-engine",
    "version": "1.0.0"
  },
  "implements": [
    "adapter.wrap.envelope_v0_1",
    "integrity.digest.sha256"
  ],
  "conformance_level": "fully-conformant"
}
```

## Validate (optional)

Use the reference validator to list methods, validate records, and run test vectors:

```bash
# List known methods
python tools/python/prov_validator.py list-methods

# Validate a provenance record
python tools/python/prov_validator.py validate-methods record.json --strict

# Run test vectors
python tools/python/prov_validator.py check-vector integrity.digest.sha256

# Run all built-in checks (schemas, vectors, catalog)
python tools/python/prov_validator.py self-test
```

## Next steps

Proceed to [Conformance](/prov-spec/handbook/conformance/) to learn about the three compliance tiers and how to claim them.
