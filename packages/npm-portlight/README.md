<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/portlight/readme.png" width="600" alt="Portlight">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/npm-portlight/actions"><img src="https://github.com/mcp-tool-shop-org/npm-portlight/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/portlight"><img src="https://img.shields.io/npm/v/@mcptoolshop/portlight" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-portlight/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/npm-portlight/"><img src="https://img.shields.io/badge/docs-handbook-blue" alt="Handbook"></a>
</p>

Trade-first maritime strategy game. Build a merchant career across five regions through route arbitrage, contracts, infrastructure, finance, and reputation — all from the terminal. No Python required.

## Install

```bash
npx @mcptoolshop/portlight new "Captain Hawk" --type merchant
```

Or install globally:

```bash
npm install -g @mcptoolshop/portlight
portlight new "Captain Hawk" --type merchant
```

The underlying game is also available via pip (`pip install portlight`) if you prefer Python.

## Why Portlight

Most trading games flatten trade into a number that goes up. Portlight treats trade as a commercial discipline:

- **Prices react to your trades.** Dump grain at a port and the price crashes. Every sale shifts the local market.
- **Ports have real economic identities.** Porto Novo produces grain cheaply. Silk Haven exports silk at volume. These are structural, not random.
- **Voyages carry risk.** Storms, pirates, inspections, seasonal danger. Your provisions, hull, and crew matter.
- **Contracts require proof.** Deliver the right goods to the right port before the deadline. Provenance is tracked.
- **Infrastructure changes how you trade.** Warehouses stage cargo. Brokers improve contracts. Licenses unlock premium access.
- **Reputation opens and closes doors.** Commercial trust, customs heat, regional standing, and underworld connections — four axes that shape what you can do and where.
- **The game reads what you built.** Your trade history, infrastructure, reputation, and routes form a career profile. Four distinct victory paths based on what kind of merchant you actually became.

## The World

Five regions. Twenty ports. Forty-three routes. A living economy.

| Region | Ports | Character |
|--------|-------|-----------|
| **Mediterranean** | Porto Novo, Al-Manar, Silva Bay, Corsair's Rest | Grain, timber, spice markets. Safe starting waters. |
| **North Atlantic** | Ironhaven, Stormwall, Thornport | Iron, weapons, military trade. Strict inspections. |
| **West Africa** | Sun Harbor, Palm Cove, Iron Point, Pearl Shallows | Cotton, rum, pearls. Cheapest provisions. |
| **East Indies** | Jade Port, Monsoon Reach, Silk Haven, Crosswind Isle, Dragon's Gate, Spice Narrows | Silk, spice, porcelain, tea. Highest margins. Monsoon risk. |
| **South Seas** | Ember Isle, Typhoon Anchorage, Coral Throne | Pearls, medicines. Remote endgame waters. |

134 named NPCs across every port. Four pirate factions controlling different waters. Seasonal weather that shifts danger and demand. A culture layer with festivals, superstitions, and crew morale.

## Nine Captains

| Captain | Home | Edge | Trade-off |
|---------|------|------|-----------|
| **Merchant** | Porto Novo | Better prices, trust grows fast | Heat penalties doubled |
| **Smuggler** | Corsair's Rest | Black market, contraband trade | Higher heat, more inspections |
| **Navigator** | Monsoon Reach | Faster ships, longer range | Weaker initial standing |
| **Privateer** | Ironhaven | Naval combat, boarding advantage | Poor merchant reputation |
| **Corsair** | Corsair's Rest | Balanced combat + trade | Master of none |
| **Scholar** | Jade Port | Information advantage, better contracts | Low capital, fragile |
| **Merchant Prince** | Porto Novo | High starting capital, premium access | Higher fees, pirate target |
| **Dockhand** | Crosswind Isle | Cheapest crew, scrappy | Lowest starting capital |
| **Bounty Hunter** | Stormwall | Combat mastery, faction standing | Poor prices, distrusted |

## Quick Start

```bash
npx @mcptoolshop/portlight new "Captain Hawk" --type merchant
npx @mcptoolshop/portlight market
npx @mcptoolshop/portlight buy grain 10
npx @mcptoolshop/portlight routes
npx @mcptoolshop/portlight sail al_manar
npx @mcptoolshop/portlight advance
npx @mcptoolshop/portlight sell grain 10
npx @mcptoolshop/portlight milestones
```

## Systems

**Economy** — Scarcity-driven pricing across 20 ports, 18 goods, 43 routes. Flood penalties punish dumping. Regional demand modifiers mean every port has clear import/export identity.

**Voyages** — Multi-day travel with weather, pirate encounters, inspections. Provisions burn daily. Hull takes damage. Seasonal danger zones change which routes are safe.

**Contracts** — Six families gated by trust and standing. Procurement, shortage relief, luxury discreet, return freight, circuit, and faction commissions. Real deadlines, real consequences.

**Reputation** — Four axes: regional standing, commercial trust, customs heat, and underworld connections. Different captains play different moral economies.

**Combat** — Personal combat (stance triangle) with 7 melee weapons, 7 ranged weapons, regional fighting styles. Naval combat with boarding and cannons.

**Pirate Factions** — Crimson Tide, Iron Wolves, Deep Reef Brotherhood, Monsoon Syndicate. Each with territory, named captains, and attitude toward you.

**Infrastructure** — Warehouses, broker offices, licenses. Real upkeep. Each changes trade timing, scale, or access.

**Finance** — Insurance and credit. Leverage with teeth.

**Companions** — Five officer roles with personality, morale, and departure triggers.

**Career** — 27 milestones. 13 profile tags. Four victory paths: Lawful Trade House, Shadow Network, Oceanic Reach, Commercial Empire.

## Victory Paths

- **Lawful Trade House** — High trust, premium contracts, clean reputation, infrastructure breadth.
- **Shadow Network** — Luxury margins under scrutiny, heat management, resilient operations.
- **Oceanic Reach** — East Indies access, distant infrastructure, route mastery.
- **Commercial Empire** — Infrastructure everywhere, diversified revenue, financial leverage.

## How This Package Works

This npm package downloads the pre-built Portlight binary for your platform from GitHub Releases and caches it locally. No Python installation required.

| Concern | Detail |
|---------|--------|
| **Network** | HTTPS only to `github.com` CDN |
| **Filesystem** | User cache only (`~/.cache/mcptoolshop/portlight/` on Linux/macOS, `%LOCALAPPDATA%\mcptoolshop\portlight\` on Windows) |
| **Verification** | SHA256 checksum on every download |
| **Telemetry** | None |
| **Platforms** | Windows (x64), macOS (x64/arm64), Linux (x64) |

## Security

- Downloads binaries exclusively from `github.com` over HTTPS
- SHA256 checksum verification on every download
- Writes only to user-scoped cache — never touches system directories
- No telemetry, no secrets, no credentials stored
- No network access beyond the initial binary download

See [SECURITY.md](SECURITY.md) for the full policy.

## License

MIT

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
