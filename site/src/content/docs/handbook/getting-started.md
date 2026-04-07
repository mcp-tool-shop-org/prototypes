---
title: Getting Started
description: How to clone, install, and explore the Prototypes seed vault.
sidebar:
  order: 1
---

The Prototypes repo is a pnpm + Turborepo monorepo. All 67 packages live under `packages/` and can be explored, built, or tested from the repo root.

## Prerequisites

- Node.js 20+
- pnpm 10+ (`corepack enable` to activate)
- .NET 8+ SDK (for C#/MAUI packages)

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

This runs `turbo build` across all packages that have a build script. C#/.NET packages need `dotnet build` run separately inside their directories.

## Explore a specific package

Each package is self-contained under `packages/<name>`:

```bash
cd packages/deltamind
ls
```

Most packages include their own `package.json` (or `.csproj`), `src/` directory, and tests.

## Run tests

```bash
pnpm test
```

Some packages may have outdated test configurations. These are archived prototypes and test infrastructure was not always complete at the time of consolidation.

## Project structure

```
prototypes/
  packages/
    voice-soundboard/        # Voice & Sound
    deltamind/                # Developer Tools
    Attestia-Desktop/         # Desktop Apps
    websketch-cli/            # WebSketch
    MouseTrainer/             # Mouse & Cursor
    linux-dev-typer/          # Typing & Input
    ConsensusOS/              # Games & Creative
    prov-engine-js/           # Crypto & Provenance
    llm-sync-drive/           # Infrastructure
    mcpt/                     # Original Archive
    ... (67 packages total)
  site/                       # Landing page + handbook
  package.json
  pnpm-workspace.yaml
  turbo.json
```

## Reviving a package

If a prototype looks like it should be a real product:

1. Copy the package directory out of the monorepo
2. Create a new repo in `mcp-tool-shop-org`
3. Push the scaffold commit
4. Run shipcheck and apply the full treatment
