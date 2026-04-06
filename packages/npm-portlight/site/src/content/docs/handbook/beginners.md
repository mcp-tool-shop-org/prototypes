---
title: Beginner's Guide
description: Everything you need to know to start playing Portlight through the npm wrapper
sidebar:
  order: 99
---

New to Portlight? This guide walks you through everything from installation to your first profitable trade run.

## What is this package?

`@mcptoolshop/portlight` is an npm wrapper that lets you play the Portlight maritime strategy game without installing Python. When you run it for the first time, it downloads a pre-built binary for your platform from GitHub, verifies its SHA256 checksum, and caches it locally. Every subsequent run uses the cached binary with zero download overhead.

The wrapper itself is a thin launcher — it adds no game logic. All your commands are passed directly through to the Portlight binary.

## Prerequisites

- **Node.js 18 or later** — check with `node --version`
- **npm** — comes bundled with Node.js, check with `npm --version`
- **Internet connection** — only needed for the initial binary download (~15 MB)
- **No Python required** — the whole point of this wrapper

Supported platforms: Windows (x64), macOS (x64 and arm64), and Linux (x64).

## Installation

The fastest way to start is with `npx`, which downloads and runs the package without a permanent install:

```bash
npx @mcptoolshop/portlight new "Your Name" --type merchant
```

If you plan to play regularly, install it globally so you can use the `portlight` command directly:

```bash
npm install -g @mcptoolshop/portlight
portlight new "Your Name" --type merchant
```

The first run downloads the game binary and caches it. You will see progress messages during this one-time setup.

## First steps

Once you have created a captain, here is a sequence that will earn you your first profit:

1. **Check local prices** — run `portlight market` to see what goods are available at your starting port and what they cost.

2. **Buy cheap cargo** — if grain is cheap at your port, load up: `portlight buy grain 10`. Your gold and cargo space are limited at the start, so buy what you can afford.

3. **Find a destination** — run `portlight routes` to see which ports you can reach from here. Look for ports where your cargo sells for more.

4. **Set sail** — `portlight sail al_manar` (or whichever port you chose). This begins the voyage.

5. **Advance the voyage** — run `portlight advance` to progress through each day of travel. You may encounter weather, pirates, or inspections along the way.

6. **Sell at your destination** — once you arrive, run `portlight sell grain 10` to sell your cargo. If you picked a good route, you will have made a profit.

7. **Check your progress** — run `portlight milestones` to see career milestones and `portlight status` for your overall standing.

From here, you can buy new cargo at this port and trade back, explore further routes, or start pursuing contracts with `portlight contracts`.

## Key concepts

**The economy is reactive.** When you sell large amounts of a good at one port, the price drops. When you buy large quantities, the price rises. This means you cannot exploit the same route forever — you need to diversify.

**Voyages carry real risk.** Sailing between ports takes time and provisions. Storms can damage your hull, pirates can attack, and customs inspectors can confiscate contraband. Keep your ship repaired (`portlight repair`) and provisioned (`portlight provision`).

**Reputation matters.** You have four reputation axes: regional standing, commercial trust, customs heat, and underworld connections. Different captains lean toward different reputations, and your choices shape what opportunities become available.

**Contracts are the mid-game engine.** Once you have built some trust, contracts provide higher-margin work than open-market trading. Run `portlight contracts` to see what is available.

**Infrastructure scales your operation.** Warehouses let you store cargo between trips. Brokers find you better contracts. Licenses unlock premium trade access. Build these with `portlight infra`.

## Common commands

| Command | What it does |
|---------|-------------|
| `portlight market` | Show prices at your current port |
| `portlight buy <good> <qty>` | Buy cargo |
| `portlight sell <good> <qty>` | Sell cargo |
| `portlight cargo` | View what you are carrying |
| `portlight routes` | Show available sailing routes |
| `portlight sail <port>` | Begin a voyage |
| `portlight advance` | Progress through the current voyage |
| `portlight status` | Your captain's overall status |
| `portlight contracts` | Available commercial contracts |
| `portlight map` | ASCII world map |
| `portlight save` | Save your game |
| `portlight load` | Load a saved game |
| `portlight guide` | In-game command reference |

For the full command list, see the [Command Reference](/handbook/reference/).

## FAQ

**Do I need Python installed?**
No. This npm package downloads a standalone binary. Python is not required.

**Where is the binary stored?**
On Linux and macOS: `~/.cache/mcptoolshop/portlight/`. On Windows: `%LOCALAPPDATA%\mcptoolshop\portlight\`.

**How do I update to a new version?**
Run `npm install -g @mcptoolshop/portlight@latest`. The next time you play, the updated binary will be downloaded automatically.

**Can I play offline after the first download?**
Yes. Once the binary is cached, no internet connection is needed to play.

**What if the download fails or gets corrupted?**
Delete the cache directory for your platform (see paths above) and run the command again. The wrapper will re-download and re-verify the binary.

**Is there a graphical interface?**
Portlight includes a terminal UI mode. Run `portlight tui` to launch the interactive dashboard. It runs in your terminal — no separate GUI application is needed.
