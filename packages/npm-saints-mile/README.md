<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/saints-mile/readme.png" width="400" alt="Saint's Mile">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/npm-saints-mile/actions"><img src="https://github.com/mcp-tool-shop-org/npm-saints-mile/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/saints-mile"><img src="https://img.shields.io/npm/v/@mcptoolshop/saints-mile" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-saints-mile/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/npm-saints-mile/"><img src="https://img.shields.io/badge/docs-handbook-blue" alt="Handbook"></a>
</p>

A frontier JRPG for the adults who loved those games first. No Rust toolchain required.

## Install

```bash
npx @mcptoolshop/saints-mile
```

Or install globally:

```bash
npm install -g @mcptoolshop/saints-mile
saints-mile
```

Also available via cargo: `cargo install saints-mile`

## What This Is

- A **90s-style JRPG** with a 4-slot party, distinct roles, duo techniques, and turn-based combat
- A **frontier western** where reputation is a web, distance changes decisions, and the trail is the dungeon
- A **terminal-native experience** — runs in any terminal on earth via [ratatui](https://ratatui.rs/)

## The Story

The game spans almost four decades: from a nineteen-year-old deputy's runner who still thinks law and truth are related, to a hard young gunman carrying someone else's crime, to a fully grown outlaw crossing a dying basin with a party of damaged specialists, to an older man forced to decide whether a life can be redeemed by deeds, by truth, or not at all.

The surface conflict is rail, water, and land. The deeper conflict is who gets to write the story of what happened at Saint's Mile.

## Combat

Standoff tension opens every significant fight — hands hover, nerve is tested, initiative is earned. Then a full party-based JRPG battle system takes over: four active members from a roster of six, each with unique command sets, skill lines that deepen through story and bond, and duo techniques that reward party investment.

The western layer changes the mechanics, not just the flavor: ammo instead of MP, nerve instead of morale, grit instead of defense buffs, wounds that linger between fights.

## The Party

| Character | Role | Battle Identity |
|-----------|------|----------------|
| **Galen Rook** | Gunhand | Precision, called shots, field command. Evolves by age. |
| **Eli Winter** | Grifter | Nerve attacks, disruption, cheap tricks. Loyalty unlocks late. |
| **Dr. Ada Mercer** | Sawbones | Healing, wound management, weakness revelation. |
| **Rosa Varela** | Ranch Hand | Lasso crowd control, front-line tanking, positional pressure. |
| **Rev. Miriam Slate** | Preacher | Channeled buffs, nerve support, crowd management. |
| **Lucien "Fuse" Marr** | Dynamiter | Delayed AOE, environmental destruction, terrain reshaping. |

## How This Package Works

This npm package downloads the pre-built binary for your platform from GitHub Releases and caches it locally. One command to play — zero prerequisites beyond Node.js.

| Concern | Detail |
|---------|--------|
| **Network** | HTTPS only to `github.com` CDN |
| **Filesystem** | User cache only (`~/.cache/mcptoolshop/saints-mile/`) |
| **Verification** | SHA256 checksum on every download |
| **Telemetry** | None |
| **Platforms** | Windows (x64), macOS (arm64), Linux (x64) |

## Security

- Downloads binaries exclusively from `github.com` over HTTPS
- SHA256 checksum verification on every download
- Writes only to user-scoped cache — never touches system directories
- No telemetry, no secrets, no credentials stored
- No network access beyond the initial binary download

## Threat Model

Saint's Mile is a single-player offline game. It does not:
- Connect to the internet
- Collect telemetry or analytics
- Access files outside its own save directory
- Require any permissions beyond terminal I/O

Save files are stored in RON format in a user-accessible directory.

## License

MIT

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
