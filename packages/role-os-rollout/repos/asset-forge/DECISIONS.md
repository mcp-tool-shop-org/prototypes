# asset-forge — Repo-Local Decisions

## 2026-03-24 — "Procedural" means deterministic, not physically faithful

**Decision:** The word "procedural" in this repo means "generated from rules deterministically." It does NOT mean physically simulated, naval-architecture-validated, or engineering-grade. All language must maintain this distinction.

**Why:** Curves are hand-authored Catmull-Rom control points at heuristic positions. Sections are hand-drawn profiles. The geometry looks right but is not derived from physics.

**Applies to:** Manifest metadata, README, marketing copy, any downstream consumer documentation.

---

## 2026-03-24 — GLB is derived output, spec is source

**Decision:** The SloopAssetSpec JSON is the source of truth. GLB is a one-way derived export. Export strips spec parameters, curve definitions, damage state, and render conventions. Spec must accompany GLB for provenance.

**Why:** GLB cannot be reversed to recover the spec. Without the spec, a consumer cannot verify what parameters generated the asset.

**Applies to:** Export pipeline, documentation, asset distribution guidelines.
