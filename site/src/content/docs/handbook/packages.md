---
title: Packages
description: Where to find the live, generated package index.
sidebar:
  order: 3
---

The list of packages isn't hand-maintained — it's generated from each seed's `passport.json`. Three places all derive from the same source:

- **[Faceted browser](/prototypes/seeds/)** — filter by lifecycle, category, kind, tags, or health signals (has tests / README / LICENSE / fresh commits). Best for exploring.
- **[README tables](https://github.com/mcp-tool-shop-org/prototypes/blob/main/README.md#packages-by-category)** — generated between `<!-- GENERATED:seeds-by-category -->` markers by `pnpm seed:index`. Best for reading on GitHub.
- **[`llms.txt`](https://github.com/mcp-tool-shop-org/prototypes/blob/main/llms.txt)** — one-line-per-seed index at repo root, grouped by category. Best for agents.

For the structured metadata schema, lifecycle model, and how the generator/validator/indexer work, see **[The Seed Vault](/prototypes/handbook/seed-vault/)**.
