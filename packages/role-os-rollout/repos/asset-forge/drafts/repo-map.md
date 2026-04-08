# Repo Map — asset-forge

## Stack

- Rust (3 crates: ship-schema, ship-hull, ship-export)
- GLB (binary glTF 2.0) output
- JSON manifest companion files
- Test suite via ship-testkit (golden family tests)

## Crate architecture

| Crate | Purpose |
|-------|---------|
| ship-schema | SloopAssetSpec types, validation (24 range checks), v1→v2 migration, archetype presets |
| ship-hull | Geometry generation: curves, stations, sections, lofting, overlays (rig, sails, cabin) |
| ship-export | GLB export, manifest generation, mesh validation (NaN, degenerate, bounds) |
| ship-testkit | Golden family tests: all 6 archetypes generated + validated |

## Primary seam: Generation/export truth

### Three laws this seam governs

**Source law:** Input is SloopAssetSpec v2 (JSON). StyleEnforcer clamps parameters within valid ranges. Generation is fully deterministic. But the spec is NOT embedded in the exported GLB — export strips the input, making the output unreversible.

**Fidelity law:** "Procedural" means deterministic generation from spec, not physical simulation. Curves are hand-authored control points (heuristic positions like "keel deepest at 0.35L"). Sections are hand-drawn normalized profiles. Material is diffuse RGB only. These approximation decisions are NOT disclosed in export metadata.

**Export law:** GLB carries geometry + materials + node names. What is lost: input spec, curve definitions, station landmarks, damage state, style law parameters, render conventions (axis, waterline, pivot). Manifest carries bounding box + mesh counts but NOT spec hash, generator version, or approximation disclosure.

### Contract surfaces with truth concerns

| Surface | What it claims | Truth concern |
|---------|---------------|---------------|
| `origin: "procedural"` in manifest | Asset was procedurally generated | **HIGH** — implies validated/systematic, but curves are hand-authored |
| `archetype` in manifest | Asset matches named preset | **MEDIUM** — user can modify all params but keep original label |
| GLB geometry | Faithful to spec | **MEDIUM** — StyleEnforcer may clamp/modify input before generation |
| Material colors | PBR-ready | **MEDIUM** — diffuse only, metallicness hardcoded, no textures |
| Manifest counts | Accurate geometry stats | **OK** — computed from actual mesh at export time |

### What survives export vs what is lost

| Survives | Lost |
|----------|------|
| Vertex positions, normals | Input spec parameters |
| Triangle indices | Curve control points |
| Material colors (diffuse) | Style law enforcement decisions |
| Mesh group names | Damage/wear state |
| Bounding box | Section profiles |
| `origin: procedural` | Render conventions (axis, waterline) |

## Validation

- `cargo test` — golden family tests (6 archetypes × geometry invariants + export validity)
- Mesh validation: no NaN/Inf, no degenerate triangles, indices in bounds, normals unit-length
