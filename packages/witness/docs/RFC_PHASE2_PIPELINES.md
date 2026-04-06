# RFC: Phase 2B Testimony Pipelines

**Status:** Draft (Updated post-Phase 2A)
**Author:** mcp-tool-shop
**Created:** 2026-01-30
**Updated:** 2026-01-30

## Summary

This RFC proposes optional pipeline architecture for Witness testimony generation. Pipelines are **transport, not logic** — they orchestrate existing capabilities without adding new semantics.

## Context: What Phase 2A Delivered

Phase 2A shipped testimony as a first-class artifact:

| Capability | Status | How |
|------------|--------|-----|
| Deterministic rendering | ✅ Shipped | `--generated-at` |
| Stable JSON schema | ✅ Shipped | `schemas/testimony.schema.v0.1.json` |
| Artifact emission | ✅ Shipped | `--emit-artifact DIR` |
| Exact store embedding | ✅ Shipped | `--include-events` → `raw_event.bytes_base64` |
| Grep-able citations | ✅ Shipped | `CITE: <event_id> <digest>` |
| Manifest with digests | ✅ Shipped | `testimony.manifest.json` |

**Key insight:** The `testify()` function already implements a pipeline internally:
```
events → filter → analyze → render → emit
```

Phase 2B asks: should this be decomposable?

## Design Principles (Unchanged)

### 1. Determinism is Non-Negotiable

Every pipeline stage must produce identical output given identical input.

### 2. Pipelines are Transport, Not Logic

Pipelines orchestrate existing capabilities. They do not:
- Add new cryptographic semantics
- Transform event content
- Introduce new flag types
- Change verification rules

If a pipeline stage needs to "understand" event content beyond filtering, it belongs in the core library, not a pipeline.

### 3. Testimony In, Testimony Out

Pipelines consume events and produce testimony artifacts. The intermediate representation is always a `TestimonyResult` or equivalent.

### 4. Opt-In Only

Pipelines are never required. The monolithic `testify()` function remains the default and recommended path.

## Proposed Scope: Minimal Pipeline API

### What's In Scope

1. **Filter stages** — subset events by time, actor, action
2. **Render stages** — select output format (md, json, text)
3. **Emit stages** — write artifacts to filesystem
4. **Compose stages** — chain filters before rendering

### What's Explicitly Out of Scope

1. Custom analyzers (use core library)
2. Custom flag types (requires schema bump)
3. Parallel execution (determinism risk)
4. Plugin distribution (premature)
5. Pipeline config storage in event journal (complexity)

## Minimal Implementation Sketch

```python
from witness.testify import testify, TestimonyResult
from typing import Callable, List
from pathlib import Path

# A pipeline is just composed functions
Pipeline = Callable[[Path], TestimonyResult]

def make_pipeline(
    *,
    since: str | None = None,
    until: str | None = None,
    actor_id: str | None = None,
    format: str = "md",
    include_events: bool = False,
    generated_at: str | None = None,
) -> Pipeline:
    """Create a configured testimony pipeline."""
    def run(db_path: Path) -> TestimonyResult:
        return testify(
            db_path,
            since=since,
            until=until,
            actor_id=actor_id,
            format=format,
            include_events=include_events,
            generated_at=generated_at,
        )
    return run

# Usage
daily_report = make_pipeline(since="2026-01-01", format="md")
result = daily_report(Path(".witness/events.db"))
```

This is intentionally boring. The value is in the composition, not the mechanism.

## Alternatives Considered

### 1. FlexiFlow-style DAG

**Rejected.** Parallel execution complicates determinism proofs. Not worth the complexity.

### 2. Stage Protocol with Registry

**Deferred.** The abstraction is premature. We don't have enough usage patterns to know what stages people actually need.

### 3. Config-as-Data (Pipeline JSON)

**Deferred.** Storing pipeline configs in the event journal adds complexity without clear benefit. If needed later, it can be added without breaking changes.

## Open Questions (Updated)

1. ~~Should pipeline configs be stored in the same journal as events?~~ **Deferred.** Not in Phase 2B.

2. ~~How do we handle non-deterministic external data?~~ **Resolved.** `--check-files` produces flags, not failures. File verification is informational.

3. ~~What's the extension distribution mechanism?~~ **Deferred.** No custom stages in Phase 2B.

4. **New:** Should `make_pipeline()` be in the public API, or remain internal?

## Exit Criteria for Phase 2B

Phase 2B is complete when:

- [ ] `make_pipeline()` or equivalent exists in codebase
- [ ] At least 2 example pipelines documented
- [ ] No changes to Phase 1 or Phase 2A semantics
- [ ] Tests confirm pipeline output matches direct `testify()` output

## Non-Goals

Phase 2B will **not**:
- Add new CLI commands
- Change the `testify` command behavior
- Require pipelines for any existing workflow
- Introduce breaking changes

## Decision

**Implement minimal pipeline composition as an internal utility.**

Expose `make_pipeline()` in the public API only if real-world usage demonstrates need. Until then, keep it internal and undocumented.

See [ADR-0003](adr/ADR-0003-testimony-pipeline-deferral.md) for the original deferral decision.

## References

- [Phase 2A Implementation](../src/witness/testify.py)
- [Testimony Schema](../schemas/testimony.schema.v0.1.json)
- [VERIFICATION.md](../VERIFICATION.md) — Testimony generation docs
- [ADR-0003](adr/ADR-0003-testimony-pipeline-deferral.md)
