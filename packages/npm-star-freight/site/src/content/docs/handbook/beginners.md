---
title: Beginner's Guide
description: Everything you need to know to start playing Star Freight for the first time.
sidebar:
  order: 99
---

## What is this tool?

Star Freight is a text-based space merchant RPG that runs in your terminal. You play a disgraced captain hauling freight through a politically fractured star system called the Threshold, where five alien civilizations share one economy and nothing stays simple for long.

The `@mcptoolshop/star-freight` npm package is not the game engine itself -- it is a zero-prerequisite launcher. It downloads the real game binary from GitHub, verifies its integrity, caches it locally, and runs it. You do not need Python, pip, or any build tools. One command gets you playing.

## Who is this for?

- **Terminal gamers** who want a deep merchant/tactics RPG without installing a game engine
- **Node.js users** who want a one-command install via npm or npx
- **Fans of text-first RPGs** like Dwarf Fortress, Cataclysm, or classic trading games
- **Anyone curious about emergent narrative** -- the game generates story from systems, not scripts

You do NOT need to be a programmer. If you can open a terminal and type a command, you can play.

## Prerequisites

Before running Star Freight, you need:

| Requirement | Minimum | How to check |
|------------|---------|-------------|
| Node.js | v18.0.0 or later | `node --version` |
| npm | Comes with Node.js | `npm --version` |
| Internet | First run only | The binary is cached after download |
| Disk space | ~50 MB | For the cached binary |

Install Node.js from [nodejs.org](https://nodejs.org/) if you do not have it. The LTS version is recommended.

## Your first 5 minutes

**Step 1: Launch the game.**

```bash
npx @mcptoolshop/star-freight
```

The first run downloads the binary (about 50 MB). Subsequent runs start instantly from cache.

**Step 2: Create a captain.**

The game will walk you through character creation. You pick a name and starting conditions. Do not overthink it -- your captain's identity emerges from your choices, not from a creation screen.

**Step 3: Look at the star map.**

Before accepting any contract, get oriented. Check which stations are nearby, what goods they trade, and which lanes connect them. The lane identity (Inspected, Convoy, Contested, Hazard, Gray) determines the risk of each route.

**Step 4: Take a short contract.**

Pick a contract with a nearby destination and low-risk cargo. Your first run is about learning the rhythm: accept contract, load cargo, travel lane, dock at station, deliver, get paid.

**Step 5: Pay attention to your crew.**

Your crew members are not stat bonuses. They determine which stations you can access, which abilities you have, and what you notice during travel. Read what they bring to your ship -- this matters more than cargo prices early on.

## Common mistakes

**Running from different directories.** Save files are stored in the directory where you run the game. If you launch from a different folder next time, your saves will not be there. Pick one directory and always launch from it.

**Ignoring Keth seasons.** The Keth Communion operates on a biological calendar. What is profitable one season can be an insult the next. If your margins at Keth stations collapse suddenly, check the season.

**Treating crew as disposable.** Losing a crew member does not just reduce a stat. It can lock you out of entire civilizations, remove ship abilities, and eliminate your ability to notice things during runs. Protect your crew.

**Taking Gray lanes too early.** Gray (unpoliced) lanes have no customs scrutiny, which is tempting. But they also have no protection. Early-game ships with small crews are not equipped to survive what Gray lanes throw at you.

**Ignoring the Debt Ledger.** In Veshan space, debts are not flavor text. They are leverage that other captains and houses will use against you. Track what you owe and to whom.

**Expecting to reload.** Every outcome in Star Freight persists. Combat results, reputation changes, crew injuries, lost cargo -- all permanent. Play carefully, not recklessly.

## Next steps

Once you have completed a few contracts and understand the basic loop:

- **Explore different civilizations.** Each of the five civilizations has unique trade goods, social rules, and negotiation mechanics. Diversify your routes.
- **Watch your reputation.** Your actions accumulate into a captain posture (Relief, Gray, or Honor). This is not a choice you make -- it is what your choices turn you into. See [The World](/npm-star-freight/handbook/the-world/) for details.
- **Read the reference.** The [Reference](/npm-star-freight/handbook/reference/) page documents all launcher commands and the `--version` flag.
- **Try a different playstyle.** A Relief captain who runs convoys sees a completely different game than a Gray runner smuggling contraband. Replay is where the depth shows up.
- **Check the source.** The game source lives at [mcp-tool-shop-org/star-freight](https://github.com/mcp-tool-shop-org/star-freight) if you want to see how it works or contribute.

## Glossary

| Term | Definition |
|------|-----------|
| **Binary** | The compiled Star Freight game executable. Downloaded and cached by the npm launcher. |
| **Cache** | The local directory where the launcher stores downloaded binaries. Located at `~/.cache/mcptoolshop/star-freight/` (Linux/macOS) or `%LOCALAPPDATA%\mcptoolshop\star-freight\` (Windows). |
| **Captain posture** | The emergent identity (Relief, Gray, or Honor) that your decisions create over time. Not a class -- a consequence. |
| **Checksum** | A SHA256 hash used to verify that the downloaded binary has not been tampered with. |
| **Civilization** | One of the five factions in the Threshold: Terran Compact, Keth Communion, Veshan Principalities, Orryn Drift, Sable Reach. |
| **Convoy lane** | A protected relief route that is schedule-bound and inspected. Safe but restrictive. |
| **Debt Ledger** | The Veshan system of tracking debts as political leverage. Affects negotiations and standing. |
| **Gray lane** | An unpoliced route with no customs scrutiny but maximum danger. |
| **Lane identity** | The classification of a travel route: Inspected, Convoy, Contested, Hazard, or Gray. |
| **Launcher** | The npm package (`@mcptoolshop/star-freight`) that downloads and runs the game binary. |
| **npm-launcher** | The shared library (`@mcptoolshop/npm-launcher`) that handles download, verification, and caching for all MCP Tool Shop launchers. |
| **npx** | An npm command that runs a package without permanently installing it. |
| **Sable Reach** | The lawless outer zone of the Threshold, home to pirates and salvagers. |
| **Threshold** | The star system where Star Freight takes place. Shared by five civilizations. |
| **Wrapper version** | The version of the npm package (e.g., 1.0.5), which is independent of the game binary version (e.g., 1.0.3). |
