---
title: The Seed Vault
description: How the passport schema, taxonomy, lifecycle states, and automation pipeline actually work.
sidebar:
  order: 2
---

The Prototypes repo isn't just a monorepo — it's a **seed vault**. Every package carries a structured `passport.json` that composes three standards and adds three novel fields. Everything downstream (the [faceted browser](/prototypes/seeds/), the README tables, `llms.txt`, the landing page counts) is generated from those passports.

## Where everything lives on GitHub

| Artifact | Path | What it is |
|----------|------|------------|
| **Passport schema** | [`schemas/passport.schema.json`](https://github.com/mcp-tool-shop-org/prototypes/blob/main/schemas/passport.schema.json) | JSON Schema draft-07 — the single source of truth for passport shape |
| **Taxonomy** | [`taxonomy.json`](https://github.com/mcp-tool-shop-org/prototypes/blob/main/taxonomy.json) | Canonical categories, tag registry, pattern categories |
| **llms.txt** | [`llms.txt`](https://github.com/mcp-tool-shop-org/prototypes/blob/main/llms.txt) | Answer.AI-style agent-discoverable index, generated per commit |
| **Per-seed passport** | [`packages/<slug>/passport.json`](https://github.com/mcp-tool-shop-org/prototypes/tree/main/packages) | Metadata for a specific seed |
| **Scripts** | [`scripts/seed-*.mjs`](https://github.com/mcp-tool-shop-org/prototypes/tree/main/scripts) | `new`, `validate`, `index`, `doctor`, `backfill` |
| **CI** | [`.github/workflows/seed-validate.yml`](https://github.com/mcp-tool-shop-org/prototypes/blob/main/.github/workflows/seed-validate.yml) | Paths-gated validation on passport/schema/taxonomy changes |

## What a passport contains

```jsonc
{
  "conformsTo": ["codemeta:3.0", "ro-crate:1.1", "mcp-prototypes:passport:1"],
  "id": "seed:deltamind:0.1.0",          // namespace:slug:version
  "swhid": null,                          // Software Heritage ID, filled by Wave 3
  "name": "deltamind",
  "title": "Store what changed",
  "description": "...",
  "version": "0.1.0",
  "license": "MIT",
  "codeRepository": "https://github.com/mcp-tool-shop-org/prototypes/tree/main/packages/deltamind",

  "lifecycle": { "state": "dormant", "stateSince": "2026-04-08", "maturity": "prototype" },
  "taxonomy":  { "category": "developer-tools", "tags": ["typescript", "cli"] },
  "technical": { "kind": "library", "programmingLanguages": ["TypeScript"] },

  "health": {                             // auto-computed by seed:index
    "lineCount": 4820, "lastCommitAt": "2026-04-08T...",
    "commitRecencyDays": 12, "hasTests": true,
    "hasReadme": true, "hasLicense": true, "buildable": null
  },

  "patterns": [                           // novel — structured, registry-constrained
    { "name": "state-as-memory", "category": "data-model",
      "summary": "Typed deltas reconciled into queryable state instead of summarized transcripts." }
  ],
  "failureModes": [],                     // novel — negative knowledge as first-class data
  "agentCapsule": {                       // novel — 10-second LLM payload
    "insight": "Store what changed, not what was said.",
    "excerpt": null
  },
  "priorArt": [],

  "ingest": {
    "method": "ollama-backfill", "model": "hermes3:8b",
    "confidence": 0.9, "manualReview": true, "ingestedAt": "2026-04-20T..."
  }
}
```

### The three borrowed standards

- **[CodeMeta 3.0](https://codemeta.github.io/)** core — `name`, `title`, `description`, `version`, `license`, `datePublished`, `codeRepository`, `author`, `keywords`. Zenodo and Figshare auto-ingest this shape, so graduated seeds stay citable.
- **[RO-Crate 1.1](https://www.researchobject.org/ro-crate/1.1/)** profile — `conformsTo` declaration makes the vault itself an RO-Crate; any seed's `lineage.relatedSeeds` is a graph edge.
- **[MCPD-inspired faceted metadata](https://www.genesys-pgr.org/documentation/basics)** (Multi-Crop Passport Descriptors, the genebank standard) — separated `lifecycle` / `taxonomy` / `technical` / `lineage` / `health` facets prevent one flat schema from bloating.

### The three novel fields

These aren't in any public catalog spec we could find (Software Heritage, Backstage, Cortex, Port.io, HuggingFace model cards, ASCL):

- **`patterns[]`** — structured pattern extraction. Each entry has `name` + `category` (from 24-entry registry in `taxonomy.json:patternCategories`) + `summary`. Queryable: "show me every seed that touched supply-chain tricks".
- **`failureModes[]`** — `tried` / `didntWorkBecause` / `pivoted?`. A prototype's most valuable payload is often what broke.
- **`agentCapsule`** — `{insight, excerpt}`. A 10-second LLM-readable core-trick summary plus an optional ≤400-char code snippet. Dramatically improves agent discoverability.

## Lifecycle states

```
sapling ──► active ──► graduated      (leaves the vault; passport stub stays behind)
             │
             ├─► dormant ─► resurrection_candidate ─► active
             │                      │
             │                      └─► archived
             └─► archived
```

| State | Meaning |
|-------|---------|
| `sapling` | Freshly scaffolded, not yet developed. |
| `active` | Someone is actively working on it inside the vault. |
| `dormant` | Parked — no current work, but worth preserving. **All 104 backfilled seeds default here.** |
| `resurrection_candidate` | Flagged for possible revival. Must be resolved within ~6 months or the validator warns. |
| `graduated` | Extracted into its own repo. `lifecycle.graduatedTo` must point to the new repo URL (validator enforces). Run [shipcheck](https://github.com/mcp-tool-shop-org/shipcheck) before the state change. |
| `archived` | Kept for reference, no future work expected. |

## Working with the vault

### Add a new seed

```bash
pnpm seed:new my-idea --category developer-tools --kind cli \
  --title "My Idea" --description "What it does, 30-800 chars."
```

Scaffolds `packages/my-idea/` with a valid-by-construction passport. Fill `discovery.oneLiner`, add tags, then validate.

### Validate

```bash
pnpm seed:validate
```

AJV checks the schema; extra passes check folder-name ↔ passport.name match, tag registry, pattern category registry, duplicate IDs, lifecycle rules, and lineage cross-references. CI runs the same gate on any PR touching `packages/**/passport.json`, `schemas/**`, `taxonomy.json`, or `scripts/seed-*.mjs`.

### Regenerate derived artifacts

```bash
pnpm seed:index
```

Recomputes `health.*` from git + filesystem, rewrites `site/src/data/seeds.json`, regenerates README category tables between `<!-- GENERATED:seeds-by-category -->` markers, and rebuilds `llms.txt` at the repo root.

### See the review queue

```bash
pnpm seed:doctor
```

Reports missing passports, low-confidence LLM-backfilled entries (`ingest.confidence < 0.7`), passports still flagged `manualReview: true`, TODO one-liners, and broken lineage references.

### Graduate a seed

1. Create a new repo under `mcp-tool-shop-org`, push the package contents there.
2. Run [shipcheck](https://github.com/mcp-tool-shop-org/shipcheck) on the new repo; fix gates A-D.
3. In the seed's passport: set `lifecycle.state = "graduated"`, `lifecycle.graduatedTo = "<new-repo-url>"`, update `lifecycle.stateSince`.
4. `pnpm seed:validate` confirms the graduation is well-formed.
5. The seed folder can stay as a stub or be removed — the passport carries the forwarding address either way.

## Wave 2 review workflow

All 104 LLM-backfilled passports are flagged `ingest.manualReview = true`. To work through the queue:

1. `pnpm seed:doctor` — lists what needs attention
2. Open a seed's `passport.json` and cross-reference its source (`packages/<slug>/`)
3. Verify or edit: `title`, `discovery.oneLiner`, `description`, `taxonomy.category`, `taxonomy.tags`, `patterns[]`
4. When satisfied: set `ingest.manualReview = false`
5. `pnpm seed:index` to refresh derived artifacts
6. Commit

Known residue from the hermes3:8b backfill: ~10% of oneLiners are tautological or leak fragments from the source README. Cheaper to hand-edit during review than re-run.

## For agents consuming this catalog

The [`llms.txt`](https://github.com/mcp-tool-shop-org/prototypes/blob/main/llms.txt) at repo root follows the [Answer.AI spec](https://llmstxt.org/) — one line per seed, grouped by category, with deep links to `packages/<slug>/`. For structured queries use `site/src/data/seeds.json` (the full passport collection) or the raw `packages/<slug>/passport.json` per seed. The `agentCapsule.insight` field is specifically shaped to be the 10-second version — read those first.
