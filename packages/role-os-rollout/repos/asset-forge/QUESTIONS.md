# asset-forge — Questions

## Answered during lockdown

### Q1: Can asset-forge cause generated outputs to look more authoritative than the pipeline can defend?

**Answer:** In bounded ways, yes. `origin: "procedural"` could imply physics-based when curves are hand-authored. Manifest doesn't disclose curve authorship or material simplification. Modified presets retain archetype labels. But the tool never explicitly claims physics accuracy or engineering-grade geometry. The gaps are in metadata disclosure, not false claims.

### Q2: What is source vs derived?

**Answer:** SloopAssetSpec (JSON) is source. GLB is derived. Export is one-way — spec cannot be recovered from GLB. Manifest bridges with counts and archetype label but no spec hash.

### Q3: Does "procedural" mean "validated"?

**Answer:** No. "Procedural" means "generated deterministically from rules." The rules are hand-authored control points, not physics simulations. Same input always produces same output, but the output is an approximation, not a validated representation.
