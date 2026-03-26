---
title: For Beginners
description: New to the Prototypes Archive? Start here for a gentle introduction.
sidebar:
  order: 99
---

## What Is This Tool?

The Prototypes Archive is a collection of 10 early experiments from MCP Tool Shop that were published to npm and later deprecated. They've been gathered into a single repository so the code isn't lost and anyone can learn from the approaches that were tried.

This is **not** an active project — it's a museum. The code works (or worked at the time), but no bugs will be fixed and no features will be added. Think of it as a reference library.

## Who Is This For?

- **Developers** curious about how MCP Tool Shop tools evolved — many current products started as ideas in these prototypes
- **Learners** looking for real-world examples of TypeScript monorepos, CLI tools, physics engines, music notation, and name-clearance workflows
- **Contributors** to other MCP Tool Shop projects who want to understand the historical context behind design decisions

## Prerequisites

- **Node.js 20+** — Check with `node --version`. Download from [nodejs.org](https://nodejs.org/) if needed
- **pnpm 10+** — The monorepo uses pnpm workspaces. Enable it with `corepack enable` (ships with Node.js 20+), then pnpm is available automatically
- **Git** — To clone the repository
- **Basic terminal skills** — You'll run commands in a terminal

## Your First 5 Minutes

**Minute 1: Clone**
```bash
git clone https://github.com/mcp-tool-shop-org/prototypes.git
cd prototypes
```

**Minute 2: Install dependencies**
```bash
pnpm install
```

**Minute 3: Build everything**
```bash
pnpm build
```
This runs Turborepo across all 10 packages. Some may have build scripts, others won't — that's expected for archived code.

**Minute 4: Pick a package and explore**
```bash
ls packages/
cd packages/physics-svg
cat package.json
ls src/
```
Each package is self-contained with its own `package.json` and source directory.

**Minute 5: Run tests (if available)**
```bash
cd ../..     # back to repo root
pnpm test
```
Not all packages have tests. Those that do will run; others will be skipped by Turborepo.

## Common Mistakes

1. **Using npm instead of pnpm** — This is a pnpm workspace. Running `npm install` will not resolve workspace dependencies correctly. Use `pnpm install`
2. **Expecting active maintenance** — These are archived prototypes. If something doesn't build or a dependency is outdated, that's expected. The code is preserved as-is from the time of deprecation
3. **Trying to publish** — All packages are marked `"private": true` to prevent accidental publishing. The original npm packages have been deprecated
4. **Missing corepack** — If `pnpm` isn't found, run `corepack enable` first. This activates the pnpm version specified in the repo's `packageManager` field (pnpm 10.28.2)
5. **Looking for docs in each package** — Most prototypes had minimal documentation. The best overview is in the [Packages](../packages/) page of this handbook

## Next Steps

- Browse the [Packages](../packages/) page for descriptions of all 10 prototypes
- Read the [Getting Started](../getting-started/) guide for full setup details
- Explore the source code in `packages/` to see how each prototype was built
- Check the main [MCP Tool Shop site](https://mcp-tool-shop.github.io/) for the current, maintained tools

## Glossary

- **Monorepo** — A single Git repository that contains multiple packages or projects. This repo uses pnpm workspaces and Turborepo to manage 10 packages together
- **pnpm** — A fast, disk-space-efficient package manager for Node.js. Similar to npm but uses a content-addressable store to avoid duplicate downloads
- **Turborepo** — A build system for JavaScript/TypeScript monorepos that runs tasks in parallel and caches results
- **Deprecated** — A package that is no longer maintained and should not be used in new projects. The code still exists but won't receive updates
- **Workspace** — In pnpm, a way to link multiple packages in a monorepo so they can depend on each other without publishing to npm
- **MCP** — Model Context Protocol, a standard for AI assistants to use external tools. Several of these prototypes explored MCP-related concepts
- **@mcptoolshop** — The npm scope (namespace) under which these packages were originally published
