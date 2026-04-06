---
title: Beginners Guide
description: A step-by-step walkthrough for first-time prov-spec implementers.
sidebar:
  order: 99
---

This guide walks you through implementing prov-spec from scratch. By the end you will have a working provenance record, validated it against the spec, and declared conformance.

## 1. What problem does prov-spec solve?

When tools process data, consumers need to answer three questions:

- **What happened?** Which operations were applied to produce the output?
- **Can I verify it?** Is the output's integrity independently checkable?
- **Where did it come from?** Can I trace the output back through a chain of inputs?

prov-spec answers these by defining a standard vocabulary of **method IDs** (what happened), a **provenance record** format (structured JSON), and **conformance levels** (how much you implement). Any language, any tool -- the spec is protocol-neutral.

## 2. Key concepts

Before writing code, understand these five building blocks:

| Concept | What it is | Where it lives |
|---------|-----------|----------------|
| **Method ID** | A stable, namespaced string identifying a processing step (e.g., `integrity.digest.sha256`) | `prov.record.methods[]` |
| **Provenance Record** | A JSON object documenting a tool invocation -- inputs, outputs, methods applied, and evidence | Schema: `prov.record.v0.1` |
| **Artifact** | A reference to an input or output with optional digest for integrity checking | Schema: `artifact.v0.1` |
| **Envelope** | An optional wrapper that pairs a tool's result with its provenance record | Schema: `mcp.envelope.v0.1` |
| **Conformance Level** | A testable tier (L1 Integrity, L2 Engine, L3 Lineage) declaring what your implementation supports | Declared in `prov-capabilities.json` |

Method IDs follow a strict grammar: lowercase, dot-separated, with an optional version suffix. For example, `adapter.wrap.envelope_v0_1` belongs to the `adapter` namespace and is pinned to envelope version 0.1.

## 3. Your first provenance record

Create a file called `my-record.json`:

```json
{
  "schema_version": "prov.record.v0.1",
  "run_id": "demo-run-001",
  "tool": {
    "name": "my-tool",
    "version": "1.0.0"
  },
  "inputs": [
    {
      "schema_version": "artifact.v0.1",
      "artifact_id": "input-doc",
      "media_type": "application/json"
    }
  ],
  "outputs": [
    {
      "schema_version": "artifact.v0.1",
      "artifact_id": "output-doc",
      "media_type": "application/json",
      "digest": {
        "alg": "sha256",
        "value": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      }
    }
  ],
  "methods": [
    "integrity.digest.sha256",
    "engine.prov.artifact.register_output"
  ],
  "evidence": [],
  "parents": []
}
```

Key points:

- `run_id` uniquely identifies this invocation.
- `methods[]` lists only the method IDs that were actually applied.
- `digest` uses lowercase hexadecimal and explicitly states the algorithm.
- `evidence` and `parents` are empty arrays when not applicable.

## 4. Validating your record

Clone the repo and use the reference validator:

```bash
git clone https://github.com/mcp-tool-shop-org/prov-spec
cd prov-spec

# Check method ID syntax and catalog membership
python tools/python/prov_validator.py validate-methods my-record.json --strict

# Run the SHA-256 test vector to confirm your canonicalization matches
python tools/python/prov_validator.py check-vector integrity.digest.sha256

# Run all built-in checks
python tools/python/prov_validator.py self-test
```

The validator checks three things:

1. **Syntax** -- each method ID matches the grammar (`^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*(_v[0-9]+_[0-9]+)?$`).
2. **Namespace** -- each method belongs to a known namespace (`adapter`, `engine`, `integrity`, or `lineage`), not a reserved one.
3. **Catalog membership** (strict mode) -- each method ID exists in `spec/methods.json`.

## 5. Declaring conformance

Once your implementation satisfies a conformance level, ship a `prov-capabilities.json` in your project root:

```json
{
  "schema": "prov-capabilities@v0.1",
  "engine": {
    "name": "my-tool",
    "version": "1.0.0"
  },
  "implements": [
    "integrity.digest.sha256"
  ],
  "conformance_level": "L1-integrity"
}
```

The three levels build on each other:

| Level | What you need | What it proves |
|-------|--------------|----------------|
| **L1 -- Integrity** | At least one `integrity.digest.*` method with correct canonicalization | Outputs have verifiable cryptographic hashes |
| **L2 -- Engine** | L1 + `adapter.wrap.envelope_v0_1` + `adapter.provenance.attach_record_v0_1` + `engine.prov.artifact.register_output` | You can construct valid provenance records inside envelopes |
| **L3 -- Lineage** | L2 + `lineage.parent.link` | You can chain provenance records into a directed acyclic graph |

Start with L1. Move to L2 when you wrap outputs in envelopes. Add L3 when you link records across tool invocations.

Validate your manifest:

```bash
python tools/python/prov_validator.py validate-manifest prov-capabilities.json
```

## 6. Wrapping output in an envelope

To reach L2 conformance, wrap your tool output in an `mcp.envelope.v0.1`:

```json
{
  "schema_version": "mcp.envelope.v0.1",
  "result": {
    "status": "ok",
    "data": "your tool output here"
  },
  "provenance": {
    "schema_version": "prov.record.v0.1",
    "run_id": "demo-run-002",
    "tool": {
      "name": "my-tool",
      "version": "1.0.0",
      "adapter": "custom"
    },
    "inputs": [
      {
        "schema_version": "artifact.v0.1",
        "artifact_id": "request-01",
        "media_type": "application/json"
      }
    ],
    "outputs": [
      {
        "schema_version": "artifact.v0.1",
        "artifact_id": "response-01",
        "media_type": "application/json",
        "digest": {
          "alg": "sha256",
          "value": "abc123def456..."
        }
      }
    ],
    "methods": [
      "adapter.wrap.envelope_v0_1",
      "adapter.provenance.attach_record_v0_1",
      "engine.prov.artifact.register_output",
      "integrity.digest.sha256"
    ],
    "evidence": [],
    "parents": []
  }
}
```

Rules to remember:

- Never double-wrap. If your tool already returns an envelope, pass it through unchanged and claim `adapter.pass_through.envelope_v0_1` instead.
- Only claim methods you actually applied. Claiming `integrity.digest.sha256` without computing a real digest is a conformance violation.
- Set `provenance` to `null` if you cannot reliably compute artifact digests.

## 7. Common mistakes and how to avoid them

| Mistake | Why it fails | Fix |
|---------|-------------|-----|
| Uppercase in method IDs | Grammar requires `%x61-7A` (lowercase a-z only) | Use `integrity.digest.sha256`, never `Integrity.Digest.SHA256` |
| Hyphens instead of dots | Grammar uses dots as separators | Use `adapter.wrap`, never `adapter-wrap` |
| Claiming methods not applied | Semantic contract violation -- auditors will flag it | Only list methods in `methods[]` that were actually executed |
| Non-deterministic digests | Same input must always produce the same hash | Canonicalize JSON before hashing: sorted keys, compact separators, UTF-8 |
| Double-wrapping envelopes | Spec forbids nesting envelopes | Check if the payload already has `schema_version: "mcp.envelope.v0.1"` before wrapping |
| Uppercase hex in digests | Spec requires lowercase hexadecimal | Always output `abcdef`, never `ABCDEF` |
| Using reserved namespaces | `policy.*`, `attestation.*`, `execution.*`, `audit.*` are reserved | Stick to `adapter`, `engine`, `integrity`, `lineage` |
| Empty `methods[]` array | A record with no claimed methods has no provenance value | Always claim at least one method that was applied |

For canonicalization, use this pattern in any language:

```python
import json

def canonical_json(obj):
    return json.dumps(obj, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
```

The canonical form is then hashed as UTF-8 bytes. The test vector at `spec/vectors/integrity.digest.sha256/` provides a reference input/output pair you can validate against.
