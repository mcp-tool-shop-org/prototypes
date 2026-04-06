# Artifact Blueprint: zip-meta-map

> Generated 2026-03-03T15:23:46 by artifact v0.0.0 (ollama driver)

## Pick

**Tier:** Creator
**Format:** C7_theme_palette — Theme palette — colors, fonts, spacing tokens
**Alternates:** C9_template_pack (Template pack — reusable document/issue templates)
**Signature Move:** card_back_pattern

## Constraints

- monospace-only
- uses-two-opposing-forces

## Hooks (grounded in TruthAtoms)

- **name_hook** — `repo_tagline:26879373eee5`
  "Generate machine-readable metadata manifests for ZIP archives and project directories"
  Source: `pyproject.toml:8`
- **invariant_hook** — `invariant:1e4f3f2268b3`
  "chunker.py    # deterministic text chunking"
  Source: `README.md:187`

## Must-Include Checklist

- [ ] Curator decision system; local Ollama model; deterministic fallback mechanism
- [ ] Repo-specific context based on artifact's unique features
- [ ] Deterministic hash from the repo name and date

## Freshness (the details that prove this is real)

**Weird true detail:** zip-meta-map generates a deterministic metadata layer that answers three questions for AI agents
**Recent change:** Promoted to v1.0.0 — production-ready release
**Sharp edge:** - **No telemetry.** No network calls except to local Ollama.

## Ban List (do not use)

- ~~D3_debug_tree~~
- ~~uses-real-invariant~~

## Org Curation Context

**Org bans applied:**
- D3_debug_tree
- uses-real-invariant
- black-and-white
- signal-proof
**Org gaps (soft bias):**
- prefer Exec tier (at 4%, target ~10%)
- 13 unique formats used across 24 decisions

## Curator Notes

**Veto:** Avoid using D3_debug_tree and constraints like uses-real-invariant or signal-proof as they are overused.
**Twist:** The selected format C7_theme_palette leverages the repo's unique feature of generating deterministic metadata for ZIP archives and project directories
**Pick rationale:** C7_theme_palette is chosen because it aligns well with the repo's goal to provide a guided, LLM-friendly metadata bundle and uses monospace-only constraint to emphasize code clarity.

---

# Outline Skeleton

*Atom-seeded prompt slots — fill in each checkbox, do not re-decide.*

## Title
- [ ] Name this artifact (incorporate repo identity: "zip-meta-map")
- [ ] Apply signature move: **card_back_pattern**

## Opening Hook
- [ ] Lead with weird true detail: "zip-meta-map generates a deterministic metadata layer that answers three questions for AI agents:" (README.md:25)
- [ ] Ground in repo identity: "Generate machine-readable metadata manifests for ZIP archives and project directories" (pyproject.toml:8)

## Design Intent
- [ ] Visual identity from: "zip-meta-map" (pyproject.toml:6)
- [ ] Anti-goal constraint: "| **Data NOT touched** | No telemetry, no analytics, no network calls, no code execution from archives |" (README.md:225)

## Specifications
- [ ] Dimensions, formats, color constraints

## Variations
- [ ] Required variants (dark/light, sizes, contexts)

## Closing
- [ ] Reinforce sharp edge: "safety.py     # risk flag detection + warning generation" (README.md:189)
- [ ] End with core promise: the repo's fundamental value

---

## Provenance

- artifact v0.0.0
- decision_packet: `.artifact/decision_packet.json` (sha256: `81ae90e64661bda4...`)
- truth_bundle: 33 atoms (sha256: `59a65f723ce0c8aa...`)
- web_brief: `.artifact/web/brief.json` (sha256: `d246e2af5165ca4a...`)
- Driver: ollama (model: qwen2.5:14b, host: http://127.0.0.1:11434)
- Quality gates: all passed
