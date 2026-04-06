---
title: Specification
description: Repository structure, versioning, canonicalization, and change control.
sidebar:
  order: 3
---

## Repository structure

```
prov-spec/
├── spec/                    # Normative specification
│   ├── PROV_METHODS_SPEC.md # Main specification document
│   ├── PROV_METHODS_CATALOG.md # Human-readable method registry
│   ├── MCP_COMPATIBILITY.md # MCP envelope compatibility policy
│   ├── methods.json         # Machine-readable method catalog
│   ├── schemas/             # JSON Schemas
│   │   ├── prov.record.schema.v0.1.json
│   │   ├── artifact.schema.v0.1.json
│   │   ├── evidence.schema.v0.1.json
│   │   ├── mcp.envelope.schema.v0.1.json
│   │   ├── prov-capabilities.schema.json
│   │   └── methods.schema.json
│   └── vectors/             # Test vectors (positive + negative)
│       ├── integrity.digest.sha256/
│       ├── adapter.wrap.envelope_v0_1/
│       ├── engine.extract.evidence.json_pointer/
│       └── method_id_syntax/
├── tools/                   # Reference implementations
│   └── python/              # Python reference validator
├── examples/                # Example JSON files
├── interop/                 # Interoperability proofs
├── CONFORMANCE_LEVELS.md    # Conformance tiers
└── CHANGELOG.md             # Version history
```

Key directories:

- **spec/** -- everything normative lives here.
- **spec/schemas/** -- JSON Schema files validated with `additionalProperties: false`.
- **spec/vectors/** -- test vector directories, one per method ID.
- **tools/** -- reference implementations provided for convenience (not required for conformance).

## Versioning

Current spec version: **v1.0.0**

### Allowed changes by version type

| Change type | Patch (0.1.x) | Minor (0.x.0) | Major (x.0.0) |
|-------------|:---:|:---:|:---:|
| Typo fixes, clarifications | Yes | Yes | Yes |
| New method IDs | No | Yes | Yes |
| New optional fields | No | Yes | Yes |
| Normative requirement changes | No | Yes | Yes |
| Grammar changes | No | No | Yes |
| Canonicalization changes | No | No | Yes |
| Breaking semantic changes | No | No | Yes |

### Method catalog rules

- The method catalog is **append-only** within a major version.
- Method IDs cannot be removed or renamed.
- Deprecated methods remain valid forever and must include a `superseded_by` reference.
- Schemas use `additionalProperties: false` and are forward-compatible within a patch.

### Deprecation process

1. Mark the method status as `deprecated` in the catalog.
2. Add a `superseded_by` field pointing to the replacement.
3. Continue supporting the deprecated ID indefinitely.
4. If semantics must change, create a new method ID with a new version suffix.

## Method ID grammar

Method IDs follow a strict ABNF grammar:

```abnf
method-id     = namespace *("." segment) [version-suffix]
namespace     = segment
segment       = ALPHA *(ALPHA / DIGIT / "_")
version-suffix = "_v" major "_" minor
major         = 1*DIGIT
minor         = 1*DIGIT
ALPHA         = %x61-7A  ; lowercase a-z only
DIGIT         = %x30-39  ; 0-9
```

Regex for validation:

```
^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*(_v[0-9]+_[0-9]+)?$
```

Valid examples: `adapter.wrap.envelope_v0_1`, `integrity.digest.sha256`, `lineage.parent.link`

Invalid examples: `Adapter.Wrap` (uppercase), `adapter-wrap` (hyphen), `123.method` (starts with digit)

## Canonicalization

For digest computation, JSON content must be canonicalized (compatible with JCS / RFC 8785):

1. **Encoding** -- UTF-8, no BOM.
2. **Keys** -- sorted lexicographically by Unicode code point.
3. **Whitespace** -- compact form (no whitespace between tokens).
4. **Numbers** -- no leading zeros, no trailing zeros after decimal, no positive sign.
5. **Strings** -- minimal escaping (only required escapes).
6. **Separators** -- `,` between elements, `:` between key-value pairs.

Digest computation steps:

1. Canonicalize the content.
2. Encode as UTF-8 bytes.
3. Apply the hash algorithm.
4. Encode the result as lowercase hexadecimal.

## Security considerations

- Digests should be computed by the producing system and verified by consumers.
- Digest algorithms must be explicitly stated (no default assumptions).
- Signatures attest to record integrity, not content truthfulness.
- Claiming a method ID without satisfying its semantic contract is a conformance violation.

## Contributing

1. **New method IDs** -- open an issue with a real-world use case.
2. **Spec clarifications** -- submit a PR to `spec/`.
3. **Reference tools** -- submit a PR to `tools/`.

Method IDs require real-world justification. Speculative additions are not accepted.

## Next steps

See [Reference](/prov-spec/handbook/reference/) for the complete method catalog and stability guarantee.
