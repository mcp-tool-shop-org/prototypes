<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/escape-the-valley/readme.png" width="400" alt="Escape the Valley">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/escape-the-valley"><img src="https://img.shields.io/npm/v/@mcptoolshop/escape-the-valley" alt="npm version"></a>
  <a href="https://pypi.org/project/escape-the-valley/"><img src="https://img.shields.io/pypi/v/escape-the-valley" alt="PyPI"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-escape-the-valley/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/escape-the-valley/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Oregon Trail-style survival game with AI narration and an optional XRPL ledger backpack.

**No Python required.** This package downloads a prebuilt binary and runs it locally.

## Install & Run

```bash
npx @mcptoolshop/escape-the-valley tui --seed 42
```

That's it. No Python, no pip, no virtual environments.

### Continue a saved game

```bash
npx @mcptoolshop/escape-the-valley tui --continue
```

Picks up right where you left off — the game auto-saves at every checkpoint.

## What Happens

1. First run downloads a platform-specific binary (~15 MB) from [GitHub Releases](https://github.com/mcp-tool-shop-org/escape-the-valley/releases)
2. Verifies SHA256 checksum
3. Caches locally (`~/.cache/mcptoolshop/escape-the-valley/`)
4. Runs with full arg passthrough

Subsequent runs launch instantly from cache.

## The Game

Lead a party of settlers through a procedurally generated wilderness. Manage food, water, wagon condition, and morale while navigating events, hazards, and hard choices. The valley is harsh but fair — a skilled player wins about 1 in 3 runs.

An optional **AI Game Master** (powered by Ollama) narrates your journey with three storytelling voices. An optional **XRPL Testnet ledger backpack** tracks every supply change as on-chain receipts.

### Camp Actions

| Action | What It Does |
|--------|-------------|
| **Travel** | Move toward the exit — costs food and water, risk of breakdown |
| **Rest** | Recover health and morale, chance to cure conditions |
| **Hunt** | Spend ammo for a chance at food (best in forests and plains) |
| **Repair** | Spend a spare part to fix the wagon — critical for survival |

Three **escape valves** exist for emergencies (side effects and cooldowns apply):

| Escape Valve | What It Does |
|--------------|-------------|
| **Hard Ration** | Halve food consumption at the cost of morale and health |
| **Desperate Repair** | Coin-flip wagon fix that can make things worse |
| **Abandon Cargo** | Drop supplies to save the wagon (last resort) |

### GM Profiles

The AI narrator shapes the tone, not the mechanics. All three profiles play the same game. Requires [Ollama](https://ollama.com/) running locally; falls back to built-in narration without it.

| Profile | Tone |
|---------|------|
| **Chronicler** | Grounded, practical, spare — reports what happened |
| **Fireside** | Serious campfire narrator with subtle uncanny moments (default) |
| **Lantern-Bearer** | Uncanny, liminal, atmospheric — the weird one |

## Commands

```bash
npx @mcptoolshop/escape-the-valley tui                          # start a new game
npx @mcptoolshop/escape-the-valley tui --seed 42                # seeded world gen
npx @mcptoolshop/escape-the-valley tui --continue               # resume saved game
npx @mcptoolshop/escape-the-valley tui --gm-profile chronicler  # choose GM voice
npx @mcptoolshop/escape-the-valley tui --gm-off                 # disable AI narration
npx @mcptoolshop/escape-the-valley tui --callouts minimal       # fewer warnings
npx @mcptoolshop/escape-the-valley ledger                       # print trail ledger
npx @mcptoolshop/escape-the-valley --help                       # see all commands
```

## Supported Platforms

- Linux x64
- macOS ARM64 (Apple Silicon)
- Windows x64

## Troubleshooting

```bash
npx @mcptoolshop/escape-the-valley --print-cache-path  # show cached binary location
npx @mcptoolshop/escape-the-valley --clear-cache       # force fresh re-download
```

**Pin to a specific version** if the latest has a regression:

```bash
npx @mcptoolshop/escape-the-valley@1.0.0 tui --seed 42
```

## Security

All binaries are verified against SHA256 checksums before execution. No telemetry. No network access beyond the initial download from GitHub.

Powered by [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher).

## Alternative: Install via Python

If you prefer Python:

```bash
pip install escape-the-valley
trail tui --seed 42
```

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
