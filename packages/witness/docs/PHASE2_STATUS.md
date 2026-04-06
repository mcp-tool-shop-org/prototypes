# Phase 2 Status

**Last updated:** 2026-01-30

## Overview

Phase 2 extends Witness without touching Phase 1 guarantees. Each track is independently shippable.

---

## Track 2A: Testimony as First-Class Artifact

**Status: ✅ Complete and locked**

Shipped in v0.1.0. Do not modify without schema bump.

### What shipped

| Feature | CLI | Guarantee |
|---------|-----|-----------|
| Deterministic rendering | `--generated-at <iso>` | Same inputs → same bytes |
| Stable JSON schema | `--format json` | Validated against `testimony.schema.v0.1.json` |
| Artifact emission | `--emit-artifact DIR` | Creates json + md + manifest |
| Exact store embedding | `--include-events` | `raw_event.bytes_base64` = exact SQLite bytes |
| Grep-able citations | (always) | `CITE: <event_id> <digest>` |
| Manifest integrity | (with emit) | SHA-256 digests + file sizes |

### Key commits

- `a515473` — feat: --include-events embeds exact store JSON
- `0fef27f` — feat: Phase 2A - Testimony as First-Class Artifact

---

## Track 2B: Pipeline Composition

**Status: ⏸️ Paused — internally proven, intentionally unshipped**

Implementation deferred until external pressure exists.

### What exists

- **RFC:** [RFC_PHASE2_PIPELINES.md](RFC_PHASE2_PIPELINES.md)
- **ADR:** [ADR-0003](adr/ADR-0003-testimony-pipeline-deferral.md)
- **Spike:** Internal stage enumeration (commit `0853cdc`)
  - `src/witness/_internal_stages.py` — NOT a public API
  - Bit-identity tests prove stages are composable
  - Public API snapshot test prevents drift

### What does NOT exist

- No public pipeline API
- No CLI changes
- No new schema fields
- No config format

### Unpause conditions

Unpause Track 2B when any of these occur:
1. A user asks for partial testimony
2. A user asks for pre/post hooks
3. A second tool wants to consume testimony stages
4. Internal friction maintaining testimony logic without named stages

---

## Track 2C: Provenance Interop

**Status: Not started**

Depends on Track 2B patterns being validated.

### Planned scope

- PROV-style export (`witness export --prov`)
- MCP envelope compatibility
- Round-trip guarantee to original event_id + digest

---

## Track 2D: Multi-Actor & Collaboration

**Status: Not started**

### Planned scope

- Multiple actors writing to same store
- Claim lifecycle (`witness assert-claim`, `witness revoke-claim`)
- Conflict visibility in testimony

---

## Track 2E: Time Anchoring

**Status: Not started (optional, late Phase 2)**

### Planned scope

- Anchor events (`witness anchor-time`)
- TSA / ledger / external notarization (pluggable)
- Anchor verification as informational flags

---

## What Phase 2 Will NOT Do

Out of scope for all tracks:
- Identity proof
- Trust scoring
- Policy enforcement
- Cloud sync
- "AI judgment" of intent

Witness remains neutral.
