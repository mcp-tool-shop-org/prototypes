# Brand Rules — asset-forge

## Tone

Honest procedural generator. The tool generates 3D ships from specs using deterministic rules. It does not simulate physics, validate against naval architecture, or produce engineering-grade geometry. It makes ships that look right, not ships that are right.

## Domain language

| Term | Meaning | Must not be confused with |
|------|---------|--------------------------|
| Procedural | Generated deterministically from spec parameters | "Physically simulated" or "validated" |
| Spec | Declarative JSON input defining dimensions, profile, style | "Engineering blueprint" or "measured data" |
| Archetype | Named preset with default parameters | "Canonical design" (user can modify) |
| Style law | Clamping/enforcement rules applied to spec before generation | "Physical constraints" |
| GLB | Exported binary glTF mesh — geometry + materials, NOT source | "Source of truth" or "reversible representation" |
| Manifest | JSON companion with geometry stats and archetype label | "Full provenance record" |

## Enforcement bans

- "physically accurate" / "simulation-based" / "naval architecture" (curves are hand-authored heuristics)
- "high-fidelity" / "production-quality materials" (diffuse RGB only)
- "canonical source" when describing GLB output (spec is the source, GLB is derived)
- "validated geometry" (mesh is validated for NaN/degenerate, not for physical correctness)

### Contamination risks

1. **Authority inflation** — "procedural" reading as "validated" when curves are hand-authored
2. **Export-as-source** — GLB treated as canonical when it's a lossy derived artifact
3. **Archetype mislabeling** — modified specs wearing original preset names
4. **Material oversell** — diffuse-only colors treated as PBR-ready
5. **Baked-state opacity** — damage/wear baked into geometry without manifest disclosure
