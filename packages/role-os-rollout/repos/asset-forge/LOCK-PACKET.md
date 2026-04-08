# ASSETFORGE-001 — Generation/Export Truth Lock

**Repo:** asset-forge
**Seam:** Generation/export truth
**Date:** 2026-03-24
**Status:** PASS (clean — well-engineered pipeline with bounded metadata gaps)

## Three-law verification

### Source law

- **Spec is source:** SloopAssetSpec v2 (JSON) defines all generation parameters. Deterministic.
- **GLB is derived:** Export produces geometry + materials but strips spec, curves, damage state.
- **Manifest bridges:** JSON companion records archetype, origin, counts, bounding box.
- **Gap:** Spec is NOT embedded in GLB. Manifest doesn't include spec hash.

**Verdict:** PASS. Source/derived distinction is architecturally clear. Metadata gaps are real but don't create false claims — they create incomplete provenance.

### Fidelity law

- **Curves:** Hand-authored Catmull-Rom control points. Positions are heuristic (e.g., "keel deepest at 0.35L for Swift profile"). Not physics-derived.
- **Sections:** Hand-drawn normalized profiles (22 points). Fullness factor applies algebraic scaling, not parametric hull theory.
- **Materials:** Diffuse RGB only. Metallicness hardcoded (metal=0.6, non-metal=0.0). No textures.
- **Validation:** Mesh validated for NaN/Inf, degenerate triangles, index bounds, normal unit-length. Geometry is structurally sound but not physically faithful.
- **Disclosure:** `origin: "procedural"` in manifest. No curve-authorship or material-limitation metadata.

**Verdict:** PASS. The tool doesn't claim physical accuracy. "Procedural" is technically correct (generated from rules). But the word could imply more rigor than hand-authored heuristics provide. The gap is in metadata disclosure, not in false claims.

### Export law

- **What survives:** Vertex positions/normals, triangle indices, material colors, mesh group names, bounding box.
- **What is lost:** Input spec, curve definitions, station landmarks, section profiles, style law parameters, damage state, render conventions.
- **Manifest:** Records output stats but not input provenance.

**Verdict:** PASS. Export is lossy by design (GLB is a render format, not a source format). The gap is that the loss isn't explicitly documented in the manifest.

## Five pressure paths

### PP-1: Source vs derived — spec vs GLB authority

- **GLB carries:** `asset.generator = "asset-forge"`, geometry, materials, node names
- **GLB does NOT carry:** Input spec, generation parameters, curve definitions
- **Consumer risk:** User shares GLB without spec → recipient treats GLB as authoritative → no way to verify generation parameters
- **Manifest mitigates:** `origin: "procedural"` signals it's generated, but no spec hash

**Verdict:** Bounded gap. GLB is clearly generated output, not a scanned/imported model. But missing spec hash means provenance can't be verified. → ASSETFORGE-002

### PP-2: Fidelity — "procedural" authority inflation

- **What "procedural" could imply:** Systematic, validated, physics-based generation
- **What it actually means:** Deterministic generation from hand-authored rules
- **Gap:** No metadata field for `curveModel: "hand-authored"` or `fidelityLevel: "approximate"`

**Verdict:** Bounded gap. The tool never claims physics accuracy. But `origin: "procedural"` alone could mislead sophisticated consumers. → ASSETFORGE-003

### PP-3: Archetype mismatch — modified preset retains label

- **Scenario:** User loads ClassicRunner defaults, changes all dimensions to match Patrol, keeps `archetype: "ClassicRunner"`
- **Export:** Manifest says `archetype: "Classic Runner"` — misleading
- **No validation:** Spec generation doesn't check archetype ↔ parameter consistency

**Verdict:** Design caveat (DC-1). The archetype is a user-supplied label, not a verified claim. Low practical risk for internal use, higher risk if assets are distributed.

### PP-4: Export loss — damage/wear invisible

- **DamageState::Worn** affects sail geometry (fraying, patchiness) and wood (edge wear)
- **Baked into mesh:** Final tessellation reflects damage but manifest doesn't record it
- **Consumer sees:** Geometry with "rough edges" but no metadata explaining why

**Verdict:** Design caveat (DC-2). Damage is a generation parameter, not a rendering artifact. Should be in manifest for completeness.

### PP-5: Material fidelity — diffuse-only as PBR

- **GLB contains:** `pbrMetallicRoughness.baseColorFactor` (RGBA), `metallicFactor`, `roughnessFactor`
- **Reality:** Colors are flat RGB. Metallicness is hardcoded heuristic. No textures.
- **Consumer importing into engine:** Gets valid PBR fields but no texture quality. Asset renders but looks "flat."

**Verdict:** Acceptable design. GLB uses standard PBR fields correctly — just with minimal values. This is standard practice for simple procedural assets. No overclaim.

## Liar-path rejection tests (3)

### LP-1: "Physics-validated geometry" — claim naval architecture accuracy

**Hypothetical:** Add marketing language: "Generates ships based on real naval architecture principles."

**Why rejected:** Violates reject criteria #2 (stylistic generation reading as faithful reproduction). Curves are hand-authored at heuristic positions. There is no hull resistance calculation, no stability analysis, no hydrostatic validation.

### LP-2: "Self-contained GLB" — claim export carries full provenance

**Hypothetical:** Remove manifest companion file: "GLB contains everything needed to reproduce the asset."

**Why rejected:** Violates reject criteria #1 (exported assets reading as source). GLB strips the input spec, curve definitions, and style law. Without the spec, the asset is irreversible. The manifest is the provenance bridge.

### LP-3: "Canonical archetype" — enforce archetype as immutable label

**Hypothetical:** Prevent users from modifying specs that have an archetype label, treating presets as "official designs."

**Why rejected:** Would violate the repo's design intent — presets are defaults, not constraints. The fix for mislabeling is modification detection, not modification prevention.

## Design caveats (not blocking)

### DC-1: Archetype label not validated against parameters

User can modify all parameters but keep the original archetype label. Manifest reflects the label, not the actual parameters.

**Acceptable because:** Archetypes are user-facing convenience labels, not verified claims. The spec itself is the truth — the label is informational.

### DC-2: Damage/wear state not in manifest

DamageState affects geometry but isn't recorded in the manifest. Consumer can't determine wear level from output alone.

**Acceptable because:** Current scope is 6 preset archetypes with default damage. Future damage variation should add manifest fields.

### DC-3: Render conventions not in GLB

Axis conventions (+X forward, +Z up, waterline Z=0) are spec-level, not encoded in GLB.

**Acceptable because:** GLB doesn't have a standard for semantic axis labels. Convention must travel with the spec or documentation.

## Summary

| Check | Result |
|-------|--------|
| Source law (spec vs GLB) | PASS (clear distinction, missing spec hash) |
| Fidelity law (claims vs approximation) | PASS (no physics claims, "procedural" could imply more) |
| Export law (what survives vs lost) | PASS (lossy by design, loss not documented in metadata) |
| PP-1: Source authority | Bounded gap → ASSETFORGE-002 |
| PP-2: Fidelity inflation | Bounded gap → ASSETFORGE-003 |
| PP-3: Archetype mismatch | Design caveat (DC-1) |
| PP-4: Damage opacity | Design caveat (DC-2) |
| PP-5: Material fidelity | Acceptable |
| LP-1: Physics-validated | Correctly rejected |
| LP-2: Self-contained GLB | Correctly rejected |
| LP-3: Canonical archetype | Correctly rejected |

**Overall: PASS (clean).** The pipeline is well-engineered with strong mesh validation and deterministic generation. The truth gaps are in metadata disclosure (spec hash, curve authorship, damage state, material model) — not in false claims. The tool never says it's physics-based or engineering-grade. Follow-up packets improve provenance, not correctness.

**Follow-up packets:**
- ASSETFORGE-002: Add spec hash to manifest for provenance verification
- ASSETFORGE-003: Add `curveModel` and `materialModel` metadata fields to manifest
