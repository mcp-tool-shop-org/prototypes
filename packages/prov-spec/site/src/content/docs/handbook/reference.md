---
title: Reference
description: Complete method catalog, namespace details, and stability guarantee.
sidebar:
  order: 4
---

## Stability guarantee

> Method IDs marked `stable` are append-only and will never change semantics.
> Compatibility is guaranteed within a major version.

Deprecated methods remain valid forever. Implementations should emit warnings for deprecated methods but must not reject them.

## Method catalog

All 18 stable methods defined in spec v0.1.0, grouped by namespace.

### adapter.\*

Envelope wrapping, transport, and execution wrappers.

| Method ID | Summary | Emitted when |
|-----------|---------|-------------|
| `adapter.wrap.envelope_v0_1` | Wrapped a legacy payload into `mcp.envelope.v0.1` | Adapter creates an envelope around non-envelope output |
| `adapter.pass_through.envelope_v0_1` | Tool returned an envelope; passed it through unchanged | Adapter performed pass-through without wrapping |
| `adapter.provenance.attach_record_v0_1` | Attached a `prov.record.v0.1` to the envelope | Envelope contains an adapter-generated provenance record |
| `adapter.errors.capture` | Captured an execution failure into `errors[]` | Tool failed and adapter populated standardized errors |
| `adapter.warnings.capture` | Captured non-fatal warnings into `warnings[]` | Partial results or degraded mode |

### engine.\*

Evidence extraction, normalization, and provenance construction.

| Method ID | Summary | Emitted when |
|-----------|---------|-------------|
| `engine.prov.record_v0_1.build` | Constructed a `prov.record.v0.1` record | Provenance record created by engine/adapter |
| `engine.prov.artifact.register_input` | Registered input artifact(s) | Inputs list populated |
| `engine.prov.artifact.register_output` | Registered output artifact(s) | Outputs list populated |
| `engine.extract.evidence.json_pointer` | Evidence anchors use JSON pointer fragments | Evidence sources include `#json:/` |
| `engine.extract.evidence.text_lines` | Evidence anchors use text line ranges | Evidence sources include `#text:line:` |
| `engine.coerce.evidence.v0_1` | Normalized evidence to `evidence.v0.1` schema | Tool evidence adapted into canonical format |

### integrity.\*

Hashing, signatures, and verification.

| Method ID | Summary | Emitted when |
|-----------|---------|-------------|
| `integrity.digest.sha256` | Computed SHA-256 digest(s) | Artifact digest uses `sha256` (64 hex chars) |
| `integrity.digest.sha512` | Computed SHA-512 digest(s) | Artifact digest uses `sha512` (128 hex chars) |
| `integrity.digest.blake3` | Computed BLAKE3 digest(s) | Artifact digest uses `blake3` (64 hex chars) |
| `integrity.record_digest.compute` | Computed digest of the provenance record itself | `integrity.record_digest` is populated |
| `integrity.signature.create` | Created a signature over the record digest | `integrity.signature` is populated |
| `integrity.signature.verify` | Verified a provenance record signature | Signature verification succeeded |

### lineage.\*

Parent linking and graph operations.

| Method ID | Summary | Emitted when |
|-----------|---------|-------------|
| `lineage.parent.link` | Linked to parent provenance record(s) via `parents[]` | `parents[]` populated with `run_id` values |
| `lineage.graph.build` | Built a lineage graph from multiple records | DAG representation constructed |

## Namespace summary

| Namespace | Status | Description |
|-----------|--------|-------------|
| `adapter` | Stable | Envelope wrapping, transport, execution wrappers |
| `engine` | Stable | Evidence extraction, normalization, provenance construction |
| `integrity` | Stable | Hashing, signatures, verification |
| `lineage` | Stable | Parent linking and graph operations |
| `policy` | Reserved | Access control, retention policies |
| `attestation` | Reserved | Third-party attestations, compliance claims |
| `execution` | Reserved | Runtime environment, resource usage |
| `audit` | Reserved | Audit trail operations |

## Semantic contracts

Every method ID carries a semantic contract. Claiming a method means the provenance record satisfies that contract. Key rules per namespace:

**adapter** -- Records must be inside valid envelopes. No double-wrapping. Errors and warnings arrays must contain at least one entry when their respective capture methods are claimed.

**engine** -- Records must have the correct `schema_version`. Artifact lists must be non-empty when register methods are claimed. Evidence sources must use the declared fragment format.

**integrity** -- Digest values must be lowercase hexadecimal at the correct length for the algorithm. Record digests are computed over canonical JSON (excluding the `integrity` field itself). Signatures must cover the `record_digest`.

**lineage** -- Parent arrays must contain valid `run_id` values. Parent records should be retrievable. The lineage graph must be acyclic.

## Schema files

All schemas live in `spec/schemas/` and use `additionalProperties: false` for strict validation.

| Schema | Purpose |
|--------|---------|
| `prov.record.schema.v0.1.json` | Provenance record |
| `artifact.schema.v0.1.json` | Artifact metadata |
| `artifact.ref.schema.v0.1.json` | Artifact references |
| `evidence.schema.v0.1.json` | Evidence anchor |
| `mcp.envelope.schema.v0.1.json` | Envelope wrapper |
| `mcp.request.schema.v0.1.json` | MCP request format |
| `prov-capabilities.schema.json` | Capability manifest |
| `methods.schema.json` | Method catalog format |
| `assist.request.schema.v0.1.json` | Assist request |
| `assist.response.schema.v0.1.json` | Assist response |
| `cli.error.schema.v0.1.json` | CLI error format |

## RFC references

- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) -- Key words for use in RFCs
- [RFC 6901](https://www.rfc-editor.org/rfc/rfc6901) -- JSON Pointer
- [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785) -- JSON Canonicalization Scheme
