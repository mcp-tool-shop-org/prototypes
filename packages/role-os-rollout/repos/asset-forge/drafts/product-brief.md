# Product Brief — asset-forge

## What this is

Procedural 3D ship generator. Takes declarative JSON specs (SloopAssetSpec v2), validates parameters, enforces style laws, generates mesh geometry via Catmull-Rom spline curves and lofted sections, and exports GLB (binary glTF 2.0) + JSON manifest. Fully deterministic — same spec → same output. Six archetype presets (Classic Runner, Courier, Patrol, Smuggler, Fishing, Merchant Light).

## Type

Rust library + CLI examples (3 crates: ship-schema, ship-hull, ship-export)

## Core value

Deterministic procedural generation from spec. Every output is traceable to its input spec. No randomness, no external model imports. Geometry validity is enforced by mesh validation (no NaN, no degenerate triangles, normals verified).

## What it is not

- Not a physics simulator — curves are hand-authored heuristics, not derived from naval architecture or hydrodynamics
- Not a high-fidelity PBR pipeline — diffuse RGB colors only, no textures, no normal maps
- Not a CAD tool — geometry is approximate, not engineering-grade
- Not self-documenting in export — GLB does not carry the input spec, curve definitions, damage state, or material model limitations

## Anti-thesis (6 statements)

1. Must never let "procedural" imply "physically validated" — curves are hand-authored control points, not derived from simulation or measured data
2. Must never let exported GLB read as self-contained canonical source — the input spec is required for provenance, and export strips generation metadata
3. Must never let diffuse-only color model pass as full PBR without disclosure — no textures, no normal maps, no roughness variation
4. Must never let modified presets retain archetype labels without flagging the modification
5. Must never let damage/wear state baked into geometry be invisible in the manifest
6. Must never let "deterministic" imply "correct" — deterministic means reproducible, not physically faithful

## Highest-risk seam

**Generation/export truth** — the boundary where generated outputs could look more authoritative, faithful, or canonical than the pipeline can actually defend. The liar-paths are: "procedural" implying validated, export stripping provenance, hand-authored curves undisclosed in metadata, and modified presets wearing original archetype labels.
