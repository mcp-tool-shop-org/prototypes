---
title: Handbook
description: Guide to the Prototypes seed vault — 104 packages from MCP Tool Shop.
sidebar:
  order: 0
---

Welcome to the Prototypes handbook. This is the reference guide for the seed vault — 104 packages consolidated into a single monorepo during the April 2026 org reductions (175 → 51 repos).

## Pages

- **[Getting Started](/prototypes/handbook/getting-started/)** — Clone, install, and explore the monorepo
- **[The Seed Vault](/prototypes/handbook/seed-vault/)** — Passport schema, taxonomy, lifecycle, and the generator/validator/indexer pipeline
- **[Packages](/prototypes/handbook/packages/)** — The 104 packages organized by category

## Live data

- **Faceted browser:** [`/prototypes/seeds/`](/prototypes/seeds/) — filter by lifecycle, category, tags, or health signals
- **Machine-readable index:** [`llms.txt`](https://github.com/mcp-tool-shop-org/prototypes/blob/main/llms.txt) — agent-discoverable catalog at repo root
- **Per-seed passport:** `packages/<slug>/passport.json` — CodeMeta + RO-Crate + MCPD facets + patterns / failureModes / agentCapsule
- **Schema of truth:** [`schemas/passport.schema.json`](https://github.com/mcp-tool-shop-org/prototypes/blob/main/schemas/passport.schema.json)

## What is this repo?

Over the course of building MCP Tool Shop, dozens of experimental tools, desktop apps, game prototypes, and developer utilities were created. When the org was cut from 175 repos to 51 (two rounds, April 2026), every prototype that had proven a concept or taught a lesson was preserved here rather than deleted.

This is not a graveyard. It is a seed vault. Some of these packages were stepping stones to products that still ship. Others were experiments that shaped what not to build.

## Why keep them?

- **Revival** — see something that should be a product? Pull it out, give it a repo, and ship it. The [Seed Vault handbook](/prototypes/handbook/seed-vault/#graduate-a-seed) documents the graduation flow.
- **Patterns** — structured `patterns[]` and `failureModes[]` fields in each passport make reusable architectures queryable across the vault.
- **History** — understand how ideas evolved into the current product line.

[Back to landing page](/prototypes/)
