<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/star-freight/readme.png" alt="Star Freight -- Trade. Decide. Survive." width="400">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/star-freight"><img src="https://img.shields.io/npm/v/@mcptoolshop/star-freight" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-star-freight/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/npm-star-freight/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License">
</p>

# @mcptoolshop/star-freight

> Space merchant RPG CLI -- zero-prerequisite npx install

```bash
npx @mcptoolshop/star-freight
```

Or install globally:

```bash
npm i -g @mcptoolshop/star-freight
star-freight
```

No Python, pip, or build tools required. Pre-built binaries are downloaded, SHA256-verified, and cached locally.

---

## The game

You were a military pilot. Then you were a disgrace. Now you are a captain with a bad ship, no standing, and a star system that was already moving before you got here.

**Star Freight** is a text-first tactics merchant RPG about hauling freight through a politically fractured star system. Five civilizations. One economy. Four truths that won't let you play the same life twice.

You dock at stations where the culture changes how you negotiate. You pick routes where the terrain changes how you fight. You hire crew who change what you can do, what you can access, and what you owe. You take contracts that look simple until the paperwork catches up, the shortage changes the price, or the cargo turns out to be evidence.

## Why it feels different

**Crew is binding law.** Thal isn't a +10% repair bonus. Thal is *why* you can dock at Keth stations, *why* your ship has an emergency repair ability, and *why* you noticed the medical cargo didn't match the season. Lose Thal, and three systems lose capability at once.

**Combat is a campaign event.** Victory writes salvage credits and faction heat. Retreat costs jettisoned cargo and a reputation as someone who runs. Defeat means seized cargo, injured crew, and a ship that limps to the nearest station at a premium.

**Culture is social logic.** The Keth don't just have different prices. They have a seasonal biological calendar that changes what gift-giving means and when pushing a deal is an insult. The Veshan challenge -- and refusing is worse than losing.

**Investigation emerges from life.** You notice the medical cargo doesn't match the season because you've been hauling it. The conspiracy doesn't announce itself. You stumble into it by doing the job.

## The world

Five civilizations share a star system called the Threshold.

**The Terran Compact** -- Bureaucratic human government. They disgraced you. Getting back in means permits, patience, and swallowing pride.

**The Keth Communion** -- Arthropod collective on a biological calendar. The best margins in the system if you understand the seasons. The fastest reputation collapse if you don't.

**The Veshan Principalities** -- Reptilian feudal houses obsessed with honor and debt. The Debt Ledger is not flavor. It's leverage.

**The Orryn Drift** -- Mobile broker civilization. They trade with everyone, know everything, and charge for both.

**The Sable Reach** -- Pirate factions, Ancestor tech salvagers, and people the Compact would rather forget. No law. No customs. No refunds.

## Three kinds of captain

**Relief captain.** Convoy discipline, trust-based access, public consequence. You keep people fed and get trapped by legitimacy.

**Gray runner.** Paper leverage, timing abuse, institutional risk. You make money by staying hard to read.

**Honor captain.** Direct confrontation, house politics, reputation volatility. You solve problems face-to-face.

These are not classes. They are what your choices turned you into.

## How this package works

This npm package uses [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher) to:

1. Download the pre-built Star Freight binary from [GitHub Releases](https://github.com/mcp-tool-shop-org/star-freight/releases)
2. Verify SHA256 checksums
3. Cache locally (`~/.cache/mcptoolshop/star-freight/`)
4. Run with your arguments

### Cache management

```bash
star-freight --print-cache-path
star-freight --clear-cache
```

### Platform support

| Platform | Binary |
|----------|--------|
| Linux x64 | `star-freight-<version>-linux-x64` |
| macOS ARM64 | `star-freight-<version>-darwin-arm64` |
| Windows x64 | `star-freight-<version>-win-x64.exe` |

## Security

**Threat model:** This package downloads pre-built binaries from GitHub Releases over HTTPS and verifies SHA256 checksums before execution. It does NOT collect telemetry, store credentials, make network requests beyond `github.com`, or write outside the user cache directory (`~/.cache/mcptoolshop/star-freight/`). The executed binary runs with caller permissions and writes game saves to the current working directory only. See [SECURITY.md](SECURITY.md) for the full policy.

## Source repository

The game source lives at [mcp-tool-shop-org/star-freight](https://github.com/mcp-tool-shop-org/star-freight).

## License

MIT

---

*Star Freight is a game about moving through systems of power without ever fully belonging to them.*

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
