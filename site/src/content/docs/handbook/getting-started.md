---
title: Getting Started
description: How to clone, install, and explore the Prototypes Archive.
sidebar:
  order: 1
---

The Prototypes Archive is a standard pnpm + Turborepo monorepo. All 10 packages live under `packages/` and can be explored, built, or tested from the repo root.

## Prerequisites

- Node.js 20+
- pnpm 10+ (`corepack enable` to activate)

## Clone and install

```bash
git clone https://github.com/mcp-tool-shop-org/prototypes.git
cd prototypes
pnpm install
```

## Build all packages

```bash
pnpm build
```

This runs `turbo build` across all packages that have a build script.

## Explore a specific package

Each package is self-contained under `packages/<name>`:

```bash
cd packages/physics-svg
ls
```

Most packages include their own `package.json`, `src/` directory, and (where applicable) tests.

## Run tests

```bash
pnpm test
```

Note that some packages may have outdated or missing test configurations. These are archived prototypes and test infrastructure was not always complete at the time of deprecation.

## Project structure

```
prototypes/
  packages/
    mcpt/
    pathway/
    physics-svg/
    ai-music-sheets/
    websketch-demo/
    clearance-opinion-engine/
    nameops/
    mcpt-link-fresh/
    vector-caliper/
    mcpt-publishing-assets/
  package.json
  pnpm-workspace.yaml
  turbo.json
  tsconfig.base.json
```
