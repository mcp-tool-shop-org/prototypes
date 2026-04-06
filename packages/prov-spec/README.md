<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/prov-spec/readme.png" alt="Prov-Spec — Provenance Specification Framework" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/prov-spec/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/prov-spec/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="spec/PROV_METHODS_SPEC.md"><img src="https://img.shields.io/badge/spec-v1.0.0-blue" alt="Spec Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/prov-spec/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**A formal, versioned specification and conformance suite for provenance method IDs, records, and validation.**

---

## What is this?

A normative specification defining:
- **Method IDs** — stable, namespaced identifiers for provenance operations
- **Provenance Records** — structured JSON documenting tool invocations
- **Conformance Levels** — testable compliance tiers
- **Test Vectors** — canonical inputs/outputs for interoperability

## What is this not?

- Not a framework
- Not an SDK
- Not MCP-specific
- Not Python-specific

## Who is it for?

- **Engine authors** — implement provenance in any language
- **Tool integrators** — wrap existing tools with provenance
- **Auditors** — verify provenance claims
- **Infrastructure builders** — build provenance-aware systems

---

## Stability Guarantee

> **Method IDs marked `stable` are append-only and will never change semantics.**
> **Compatibility is guaranteed within a major version.**

---

## Quick Start

### Verify in 10 seconds

```bash
# Clone and run a test vector
git clone https://github.com/mcp-tool-shop-org/prov-spec
cd prov-spec
python tools/python/prov_validator.py check-vector integrity.digest.sha256
```

Expected output: `INFO: Test vector integrity.digest.sha256 passed`

---

### 1. Understand the spec

Read [`spec/PROV_METHODS_SPEC.md`](spec/PROV_METHODS_SPEC.md) — the normative specification.

### 2. Check the catalog

Browse [`spec/methods.json`](spec/methods.json) — machine-readable method registry.

### 3. Declare conformance

Ship a `prov-capabilities.json` in your project:

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

### 4. Validate (optional)

Use the reference validator:

```bash
# List known methods
python -m prov_validator list-methods

# Validate a provenance record
python -m prov_validator validate-methods record.json --strict

# Run test vectors
python -m prov_validator check-vector integrity.digest.sha256
```

---

## Repository Structure

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
├── tools/                   # Reference implementations (optional)
│   └── python/              # Python reference validator
├── examples/                # Example JSON files
├── interop/                 # Interoperability proofs
│   └── PROOF_NODE_ENGINE.md # Node.js engine proof
├── CONFORMANCE_LEVELS.md    # Conformance tiers
└── CHANGELOG.md             # Version history
```

**Note:** Reference tools are provided for convenience and are not required for conformance.

---

## Conformance Levels

| Level | Name | Requirements |
|-------|------|--------------|
| **1** | Integrity | `integrity.digest.*` methods |
| **2** | Engine | Level 1 + `engine.*` methods |
| **3** | Lineage | Level 2 + `lineage.*` methods |

See [`CONFORMANCE_LEVELS.md`](CONFORMANCE_LEVELS.md) for details.

---

## Method Namespaces

| Namespace | Purpose |
|-----------|---------|
| `adapter.*` | Envelope wrapping, transport |
| `engine.*` | Evidence extraction, provenance construction |
| `integrity.*` | Hashing, signatures, verification |
| `lineage.*` | Parent linking, graph operations |

Reserved for future use: `policy.*`, `attestation.*`, `execution.*`, `audit.*`

---

## Versioning

- **Spec version:** `v1.0.0`
- **Method catalog:** append-only within major version
- **Schemas:** `additionalProperties: false` — forward-compatible within patch

---

## Contributing

1. New method IDs: open an issue with use case
2. Spec clarifications: submit PR to `spec/`
3. Reference tools: submit PR to `tools/`

Method IDs require real-world justification. We don't speculatively add IDs.

---

## License

MIT — see [LICENSE](LICENSE)

---

## References

- [PROV_METHODS_SPEC.md](spec/PROV_METHODS_SPEC.md) — Normative specification
- [PROV_METHODS_CATALOG.md](spec/PROV_METHODS_CATALOG.md) — Human-readable catalog
- [CONFORMANCE_LEVELS.md](CONFORMANCE_LEVELS.md) — Conformance tiers
- [MCP_COMPATIBILITY.md](spec/MCP_COMPATIBILITY.md) — MCP envelope compatibility
