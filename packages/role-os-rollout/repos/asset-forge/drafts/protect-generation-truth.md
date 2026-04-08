# Workflow: Protect Generation Truth

**Repo:** asset-forge
**Seam:** Generation/export truth — the boundary where generated outputs could look more authoritative, faithful, or canonical than the pipeline can actually defend.

## What this workflow protects

The contract that generated assets are honestly labeled as procedural approximations (not physical simulations), that exported GLB is treated as derived output (not source), and that metadata discloses what is approximated vs exact.

## Automatic reject criteria (8)

A proposed change MUST be rejected if it:

1. **Makes exported assets read like source-of-truth assets** — removes the distinction between spec (source) and GLB (derived), or makes GLB appear self-contained when it strips generation metadata
2. **Makes stylistic generation read like faithful reproduction** — claims or implies physical accuracy, naval architecture validation, or simulation-based geometry when curves are hand-authored
3. **Makes lossy export read like full-fidelity transfer** — hides that GLB strips spec parameters, curve definitions, damage state, render conventions
4. **Makes metadata/provenance disappear at the export boundary** — removes or weakens manifest fields that connect output to its generation context
5. **Makes variants/presets collapse into "the asset"** — removes archetype labeling, or prevents consumers from knowing whether a spec was modified from its preset
6. **Claims deterministic means correct** — conflates reproducibility (same input → same output) with physical faithfulness or engineering accuracy
7. **Removes mesh validation** — the only export-time fidelity guarantee (no NaN, no degenerate, normals valid) must not be weakened or skipped
8. **Makes human-facing reassurance stronger while leaving machine-facing semantics unchanged** — e.g., marketing says "high-fidelity 3D models" when geometry is hand-authored approximation (org-wide reassurance drift rule)

## The key question this workflow answers

**Can asset-forge cause generated or exported outputs to look more authoritative, faithful, or canonical than the pipeline can actually defend?**

### Currently: yes, in bounded ways

- `origin: "procedural"` implies systematic/validated but curves are hand-authored
- Manifest doesn't disclose curve authorship, material limitations, or damage baking
- Modified presets retain archetype labels without modification flag
- GLB doesn't carry input spec or generation metadata

### After improvement, must say
- That curves are hand-authored control points (not physics-derived)
- That materials are diffuse-only (not full PBR)
- Whether the spec was modified from its archetype preset
- What damage/wear state was baked into geometry

### Must never imply
- That "procedural" means "physically validated"
- That GLB is a complete representation (it strips significant metadata)
- That archetype labels are verified (user can modify freely)
- That diffuse colors are PBR-ready

## When to re-prove

Re-prove this workflow when:
- New geometry features are added (new hull types, new overlays)
- Export format changes (new glTF extensions, metadata embedding)
- Material model changes (PBR, textures)
- Curve authorship model changes (physics-based, measured data)
- Archetype system changes
