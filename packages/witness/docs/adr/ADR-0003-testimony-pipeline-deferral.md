# ADR-0003: Testimony Pipeline Architecture Deferral

**Status:** Accepted
**Date:** 2026-01-30
**Deciders:** mcp-tool-shop
**Technical Story:** Phase 2 planning for extensible testimony generation

## Context

Phase 1 of Witness establishes the cryptographic foundation:
- Canonical JSON serialization
- Ed25519 signatures
- Append-only storage
- Timeline analysis with flag detection

The `witness testify` command generates human-readable reports from event journals. The current implementation is monolithic:

```python
def testify(db_path, since=None, until=None, format="md", ...):
    # All logic in one function
    events = load_events(db_path, since, until)
    analysis = analyze_timeline(events)
    return render(analysis, format)
```

We considered three architectural approaches for Phase 2:

1. **FlexiFlow DAG**: Directed acyclic graph with parallel stages
2. **ReportKit Minimal**: Functional pipeline with `|` operator
3. **Defer**: Keep current implementation, gather usage data

## Decision

**We will defer the pipeline architecture decision until after Phase 1 production deployment.**

The current `testify()` function will remain as-is, with options added incrementally as needed.

## Rationale

### Why Defer?

1. **Insufficient Usage Data**

   We don't yet know:
   - Which filters are most commonly used?
   - Do users need custom analyzers?
   - What output formats are actually requested?

   Building an extensibility framework without this data risks over-engineering.

2. **Determinism Complexity**

   Guaranteeing determinism across arbitrary pipeline stages is hard:
   - Custom stages may have hidden non-determinism
   - Configuration serialization must be canonical
   - Extension versioning affects reproducibility

   More time is needed to design this correctly.

3. **Current Solution Works**

   The monolithic `testify()` function:
   - Produces correct reports
   - Supports 3 output formats
   - Has filtering options (--since, --until, --event)
   - Integrates with CI via exit codes

   There's no pressing need for extensibility today.

4. **Reversibility**

   This decision is easily reversed:
   - No architectural debt is created
   - The current API remains stable
   - Pipeline architecture can be added alongside existing API

### Why Not FlexiFlow DAG?

- Complexity exceeds current needs
- Parallel execution complicates determinism proofs
- Configuration schema is complex

### Why Not ReportKit Minimal?

- Looks great but may be too minimal
- Hard to serialize functional pipelines as data
- Would require significant refactoring

## Consequences

### Positive

- Ship Phase 1 faster without pipeline architecture
- Gather real usage data before committing to design
- Keep codebase simple and maintainable
- Avoid premature abstraction

### Negative

- Users wanting custom stages must wait
- Some code duplication if features are added piecemeal
- May need migration path when pipeline is eventually added

### Neutral

- Phase 2 timeline is extended
- More design discussion needed later

## Compliance

This ADR does not affect Phase 1 compliance:
- Golden fixtures remain authoritative
- Canonical JSON is unchanged
- Cryptographic guarantees are preserved
- Exit code contract is maintained

## Review Schedule

Revisit this decision:
- After 3 months of Phase 1 production use
- When 3+ users request custom pipeline stages
- If determinism bugs appear in `testify()`

## References

- [RFC: Phase 2 Deterministic Testimony Pipelines](../RFC_PHASE2_PIPELINES.md)
- [Phase 1 CONTRACT.md](../../CONTRACT.md)
- [testify.py implementation](../../src/witness/testify.py)
