# Current Priorities — asset-forge

## Status

Locked (Role OS lockdown 2026-03-24). Primary seam: generation/export truth.

## Classification

Lock candidate → locked.

## Seam family

Generation/export truth — same family as any system where derived output could look more authoritative or faithful than the pipeline can defend.

## Must-preserve invariants (7)

1. **Deterministic generation** — same spec → same geometry. No randomness, no external state.
2. **Spec validation** — 24 range checks reject invalid input before generation.
3. **Style enforcement** — StyleEnforcer clamps parameters within valid ranges before curves are built.
4. **Mesh validation** — no NaN/Inf positions/normals, no degenerate triangles, indices in bounds, normals unit-length.
5. **GLB is derived, not source** — exported GLB is a one-way transform of the spec. Spec is the source of truth.
6. **Archetype presets are defaults, not constraints** — user can modify any parameter. Archetype label is informational.
7. **Material model is diffuse-only** — no textures, no normal maps, no roughness variation. PBR fields are set to safe defaults.

## Banned detours

- Claiming physics-based generation (the tool uses hand-authored curves)
- Making GLB self-contained by embedding full spec (would blur source/derived boundary — spec embedding is a follow-up, not a banned direction, but must be clearly labeled as "embedded for convenience, spec remains canonical")
- Adding randomness to generation (breaks determinism + reproducibility)
- Removing mesh validation (the only fidelity guarantee the tool actually provides)
