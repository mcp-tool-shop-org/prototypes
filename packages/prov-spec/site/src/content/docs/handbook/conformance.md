---
title: Conformance
description: Conformance levels and method namespaces defined by prov-spec.
sidebar:
  order: 2
---

## Conformance levels

Conformance is **incremental** -- each level builds on the previous one. Claim only the level you fully satisfy.

### Level 1 -- Integrity

Focus: cryptographic correctness.

| Requirement | Detail |
|-------------|--------|
| Required methods | `integrity.digest.sha256` (or `sha512` / `blake3`) |
| Canonicalization | JSON content must follow the JCS-subset rules in the spec |
| Digest format | `{ "alg": "<algorithm>", "value": "<lowercase-hex>" }` |
| Determinism | Same input must always produce the same digest |

Claim L1:

```json
{
  "conformance_level": "L1-integrity",
  "implements": ["integrity.digest.sha256"]
}
```

### Level 2 -- Engine

Focus: provenance record construction.

Requires everything from L1, plus:

| Required methods | Purpose |
|-----------------|---------|
| `adapter.wrap.envelope_v0_1` | Wrap non-envelope payloads |
| `adapter.provenance.attach_record_v0_1` | Attach a provenance record to an envelope |
| `engine.prov.artifact.register_output` | Register output artifacts |

Additional rules:

- Envelope must be a valid `mcp.envelope.v0.1`.
- No double-wrapping -- existing envelopes pass through unchanged.
- Only claim methods that were actually applied.

### Level 3 -- Lineage

Focus: provenance chains and graphs.

Requires everything from L2, plus:

| Required methods | Purpose |
|-----------------|---------|
| `lineage.parent.link` | Link to parent provenance records |

Additional rules:

- `parents[]` must contain valid `run_id` values.
- Parent records should be retrievable.
- The lineage graph must be a DAG (no cycles).

## Method namespaces

All method IDs belong to one of four defined namespaces:

| Namespace | Purpose |
|-----------|---------|
| `adapter.*` | Envelope wrapping, transport, execution wrappers |
| `engine.*` | Evidence extraction, normalization, provenance construction |
| `integrity.*` | Hashing, signatures, verification |
| `lineage.*` | Parent linking and graph operations |

Four additional namespaces are **reserved** for future use:

| Namespace | Intended purpose |
|-----------|-----------------|
| `policy.*` | Access control, retention policies |
| `attestation.*` | Third-party attestations, compliance claims |
| `execution.*` | Runtime environment, resource usage |
| `audit.*` | Audit trail operations |

Implementations must not use reserved namespaces until they are formally specified.

## Optional methods

These methods are not required for any conformance level but enhance an implementation:

| Method | Purpose |
|--------|---------|
| `engine.prov.artifact.register_input` | Track input artifacts |
| `engine.extract.evidence.json_pointer` | JSON pointer evidence anchors |
| `engine.extract.evidence.text_lines` | Text line evidence anchors |
| `integrity.signature.create` | Sign provenance records |
| `integrity.signature.verify` | Verify signatures |

Declare optional methods in your `prov-capabilities.json`:

```json
{
  "optional": [
    "engine.prov.artifact.register_input",
    "integrity.signature.create"
  ]
}
```

## Automated validation

```bash
# Validate your manifest
python tools/python/prov_validator.py validate-manifest prov-capabilities.json

# Run applicable test vectors
python tools/python/prov_validator.py check-vector integrity.digest.sha256
python tools/python/prov_validator.py check-vector adapter.wrap.envelope_v0_1

# Run all built-in checks (schemas, vectors, catalog)
python tools/python/prov_validator.py self-test
```

## Next steps

See [Specification](/prov-spec/handbook/specification/) for repository structure, versioning rules, and canonicalization details.
