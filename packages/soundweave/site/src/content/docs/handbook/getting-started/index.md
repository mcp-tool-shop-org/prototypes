---
title: Getting Started
description: Set up SoundWeave and start composing adaptive game music
sidebar:
  order: 0
---

This section covers everything you need to get SoundWeave running and start creating adaptive soundtracks for games.

## Prerequisites

- **Node.js 22** or later
- **pnpm 10** or later (for monorepo development)
- A modern browser (Chrome, Firefox, or Edge) for the Studio app

## Quick Install (npm packages)

If you want to use SoundWeave packages in your own project, install from npm:

```bash
npm install @soundweave/schema @soundweave/clip-engine @soundweave/runtime-pack
```

All 16 packages are published individually under the `@soundweave` scope. Pick only what your project needs:

| Package | Use when you need |
|---------|------------------|
| `@soundweave/schema` | Types, Zod validation, parse/validate |
| `@soundweave/clip-engine` | Clip composition, transforms, cue scheduling |
| `@soundweave/music-theory` | Scales, chords, motifs, intensity |
| `@soundweave/sample-lab` | Audio import, trim, slice, kit/instrument building |
| `@soundweave/scene-mapper` | Trigger evaluation and scene resolution |
| `@soundweave/runtime-pack` | Export/import runtime packs for game engines |
| `@soundweave/automation` | Lanes, macros, envelopes, capture |
| `@soundweave/library` | Templates, snapshots, branches, favorites, compare |
| `@soundweave/audio-engine` | Sample playback and voice management |
| `@soundweave/playback-engine` | Mixing, effects, rendering |
| `@soundweave/instrument-rack` | Synth and drum voice presets |
| `@soundweave/score-map` | World scoring, motifs, profiles, cue families |
| `@soundweave/asset-index` | Pack integrity indexing and auditing |
| `@soundweave/review` | Summaries and audit helpers |
| `@soundweave/ui` | Shared UI components |
| `@soundweave/test-kit` | Fixtures and test utilities |

## Running the Monorepo

Clone and build the full monorepo to develop locally or run the Studio:

```bash
git clone https://github.com/mcp-tool-shop-org/soundweave.git
cd soundweave
pnpm install
pnpm build
pnpm test        # 663 tests across all packages
pnpm dev         # Start the Studio dev server
```

The Studio opens in your browser at `http://localhost:3000`. All packages are built with Turborepo for fast incremental builds.

## Verify Your Setup

After building, run the full verification suite:

```bash
pnpm verify      # lint + typecheck + test + build
```

If all steps pass, your environment is ready.

## Next Steps

- **[Beginner's Guide](/soundweave/handbook/getting-started/beginners/)** -- Walk through SoundWeave from zero: concepts, setup, first project, and common pitfalls
- **[Building a Cue from Scratch](/soundweave/handbook/workflows/building-a-cue/)** -- End-to-end tutorial from score profile to runtime export
- **[API Reference](/soundweave/handbook/getting-started/reference/)** -- Package-by-package function reference
