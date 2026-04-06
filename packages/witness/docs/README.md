# Witness Documentation Index

## Core Documents

| Document | Purpose |
|----------|---------|
| [CONTRACT.md](../CONTRACT.md) | What is law vs example — start here |
| [IMPLEMENTATION_NOTES.md](../IMPLEMENTATION_NOTES.md) | Locked invariants (do not change without schema bump) |
| [VERIFICATION.md](../VERIFICATION.md) | Crypto rules, worked examples, testimony generation |
| [SECURITY.md](../SECURITY.md) | Vulnerability reporting and security scope |

## Schemas

| Schema | Version | Purpose |
|--------|---------|---------|
| [testimony.schema.v0.1.json](../schemas/testimony.schema.v0.1.json) | 0.1 | JSON output contract for `witness testify --format json` |

## Phase 2

| Track | Status | Document |
|-------|--------|----------|
| **2A: Testimony as Artifact** | ✅ Complete | Shipped in v0.1.0 |
| **2B: Pipeline Composition** | ⏸️ Paused | [RFC](RFC_PHASE2_PIPELINES.md) — spike exists, no public API |
| 2C: Provenance Interop | Not started | Depends on 2B patterns |
| 2D: Multi-Actor | Not started | — |
| 2E: Time Anchoring | Not started | Optional, late phase |

See [PHASE2_STATUS.md](PHASE2_STATUS.md) for detailed status.

## Architecture Decision Records

| ADR | Decision |
|-----|----------|
| [ADR-0003](adr/ADR-0003-testimony-pipeline-deferral.md) | Defer testimony pipelines to Phase 2 |

## Quick Links

- **Golden fixtures:** [`tests/fixtures/golden/`](../tests/fixtures/golden/)
- **Verification tools:** [`tools/verify_golden.py`](../tools/verify_golden.py)
- **Canonical check:** [`tools/check_canonical.py`](../tools/check_canonical.py)
