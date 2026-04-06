<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/jam-session-plugin/readme.png" alt="Jam Session Plugin" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/jam-session-plugin/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/jam-session-plugin/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/jam-session-plugin/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

AI piano player with a 100-song library, structured teaching, and jam sessions. Plays through your speakers — no external software required.

This plugin wraps the [AI Jam Session](https://github.com/mcp-tool-shop-org/ai_jam_session) MCP server, adding slash commands, agent personalities, and structured workflows for learning and jamming.

## Install

```bash
claude plugin add ai-jam-session
```

The MCP server (`@mcptoolshop/ai-jam-session`) is fetched automatically via npx. Requires Node.js 18+.

## What You Get

### Skills (slash commands)

| Command | Description |
|---------|-------------|
| `/ai-jam-session:teach <song>` | Start a structured teaching session |
| `/ai-jam-session:practice <song> [level]` | Get a personalized practice plan |
| `/ai-jam-session:explore [query]` | Browse the 100-song library by genre, difficulty, or keyword |
| `/ai-jam-session:jam <song or genre>` | Start a jam session — Claude creates its own interpretation |

### Agents

| Agent | Description |
|-------|-------------|
| `piano-teacher` | Patient, pedagogical teacher who meets students where they are |
| `jam-musician` | Laid-back jam band musician — groove-first, encourages experimentation |

### MCP Tools (15)

Browse, play, teach, jam, and manage songs. The plugin's skills orchestrate these tools automatically, but they're also available for direct use.

## Usage

Use slash commands:

```
/ai-jam-session:explore jazz
/ai-jam-session:teach moonlight-sonata-mvt1
/ai-jam-session:practice let-it-be beginner
/ai-jam-session:jam autumn-leaves as blues
/ai-jam-session:jam jazz
```

Or just talk naturally — the agents activate based on context:

```
I want to learn a beginner jazz song on piano.
Help me practice Fur Elise at half speed.
Let's jam on some blues.
```

## Song Library

100 built-in songs across 10 genres (classical, jazz, pop, blues, rock, R&B, latin, film, ragtime, new-age) at beginner, intermediate, and advanced levels.

## Requirements

- Node.js 18+
- Speakers (the piano plays through your system audio)

## Links

- MCP server: [@mcptoolshop/ai-jam-session](https://www.npmjs.com/package/@mcptoolshop/ai-jam-session)
- Source: [mcp-tool-shop-org/ai_jam_session](https://github.com/mcp-tool-shop-org/ai_jam_session)

## Security & Data Scope

Jam Session Plugin is a **Claude Code plugin** that wraps an MCP server.

- **Data accessed:** Plugin configuration, slash command arguments, agent context
- **Data NOT accessed:** No file system access beyond plugin config. No persistent storage. No user data collection
- **Network:** All network activity is handled by the underlying MCP server, not this plugin
- **No telemetry** is collected or sent

Full policy: [SECURITY.md](SECURITY.md)

---

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10/10 |
| B. Error Handling | 10/10 |
| C. Operator Docs | 10/10 |
| D. Shipping Hygiene | 10/10 |
| E. Identity (soft) | 10/10 |
| **Overall** | **50/50** |

---

## License

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
