---
title: Beginner's Guide
description: First-time player walkthrough — controls, saves, early combat, and tips for getting the most out of Saint's Mile
sidebar:
  order: 99
---

New to Saint's Mile? This guide covers everything you need to know before your first session.

## 1. Installation

The fastest way to play is through npm — no Rust toolchain needed:

```bash
npx @mcptoolshop/saints-mile
```

The first run downloads the game binary for your platform (Windows x64, macOS arm64, or Linux x64) and caches it locally. Every run after that starts instantly.

For repeated sessions, install globally so the `saints-mile` command is always available:

```bash
npm install -g @mcptoolshop/saints-mile
saints-mile
```

If you already have Rust installed, you can also build from source with `cargo install saints-mile`.

**Requirements:** Node.js 18 or later. A terminal that supports Unicode (most modern terminals do).

## 2. Controls and Navigation

Saint's Mile is a terminal-native game built with [ratatui](https://ratatui.rs/). All interaction happens through the keyboard.

**General navigation:**
- **Arrow keys** or **WASD** — move through menus and the world
- **Enter / Space** — confirm selection
- **Escape / Backspace** — cancel or go back
- **Tab** — cycle between panels when multiple are visible

**In dialogue:**
- **Enter** — advance text
- **Number keys** — select dialogue choices directly
- **Arrow keys + Enter** — navigate choices and confirm

**In combat:**
- **Arrow keys** — select commands, targets, and skills
- **Enter** — confirm action
- **Escape** — cancel and return to command selection

The game is designed for deliberate, menu-driven play — there are no real-time inputs or reaction-speed requirements.

## 3. Saving and Loading

Saint's Mile uses RON (Rusty Object Notation) save files stored in a user-accessible directory on your system. The game autosaves at key story checkpoints.

**Manual saves** are available at camp and in towns. Look for rest points or campfire scenes.

**Save file location** varies by platform:
- **Windows:** `%APPDATA%\saints-mile\saves\`
- **macOS:** `~/Library/Application Support/saints-mile/saves/`
- **Linux:** `~/.local/share/saints-mile/saves/`

Save files are plain text, so you can back them up or inspect them. The game does not access files outside its own save directory.

## 4. Understanding Combat

Combat in Saint's Mile is a party-based, turn-based JRPG system with frontier flavor. Here are the basics:

**The standoff** opens every significant human encounter. You choose a posture before combat begins:
- **Early Draw** — act first but with lower accuracy; rattles enemy nerve
- **Steady Hand** — balanced accuracy and turn order
- **Bait** — risky but rewards you with tactical advantage if the enemy draws first

Not every fight has a standoff. Ambushes and animal encounters skip it.

**Key resources to manage:**
- **HP** — standard health. When it hits zero, a character is downed.
- **Nerve** — a second health bar representing composure. When nerve breaks, a character panics and loses their turn. Enemies can break too.
- **Ammo** — finite per encounter. Forces you to vary your approach instead of spamming your best attack.
- **Wounds** — persist between fights. The sawbones (Dr. Ada Mercer) is essential for keeping the party functional.

**Party composition matters.** You field 4 of 6 party members at a time. Each has a distinct role — there is no generic "fighter" slot. Swapping members at camp changes your tactical options.

## 5. Early Game Tips

**Explore Cedar Wake.** Chapter 1 is intentionally slow. The town is where you learn the game's rhythm — talk to NPCs, visit the boarding house, try the shooting post. Molly Breck and Marshal Voss are worth paying attention to.

**Use the shooting post.** Voss teaches you Steady Aim here. It is one of Galen's most important early skills and the game teaches it through play, not a tutorial popup.

**Watch your ammo.** Unlike traditional JRPGs where MP regenerates at inns, ammo is finite per encounter. Mix in basic attacks and skills that do not consume ammo to conserve rounds for when you need them.

**Pay attention to skills as they unlock.** Skill unlocks in Saint's Mile are narrative, not numeric. You do not level up and pick from a tree — skills appear when the story justifies them. Trail Eye develops through exploration. Dead Drop appears as a response to trauma.

**The triage choice at the relay is permanent.** At the end of Chapter 2, you face a three-way choice that shapes the rest of the game. There is no right answer, but the consequences are real and lasting.

## 6. Common Questions

**How long is the game?**
The opening arc (Prologue through Chapter 2) runs approximately 5 hours. The full campaign spans 16 chapters across four life phases, covering nearly 40 years of Galen Rook's life.

**Is there permadeath?**
No. Downed party members recover after combat. However, wounds linger between fights, and story choices can permanently change character availability and abilities.

**Can I respec or change my build?**
There is no respec system. Skills unlock through narrative gates — story events, not experience points. This means every player's Galen develops the same core kit, but the party you field and the duo techniques you invest in are your strategic choices.

**What are duo techniques?**
Combined abilities unlocked through bonds between party members. For example, pairing Galen with Eli unlocks "Loaded Deck" (Eli rattles the target, Galen lands a guaranteed Called Shot). These reward consistent party investment.

**Does the game have multiple endings?**
The final chapter offers a legacy-shaping choice that determines what survives in public memory. The game tracks your decisions throughout, and the ending reflects the cumulative weight of those choices.

**Is there online or multiplayer?**
No. Saint's Mile is a single-player offline game. It does not connect to the internet, collect telemetry, or require any permissions beyond terminal I/O.

## 7. Where to Go Next

Once you are comfortable with the basics:

- [Combat System](/npm-saints-mile/handbook/combat/) — deep dive into standoffs, turn economy, and duo techniques
- [The Party](/npm-saints-mile/handbook/party/) — learn each character's role, skill lines, and story arc
- [Opening Arc](/npm-saints-mile/handbook/opening-arc/) — detailed walkthrough of the Prologue through Chapter 2
- [Chapter Guide](/npm-saints-mile/handbook/chapters/) — the full 16-chapter campaign structure

For technical details about the npm wrapper, see [Reference](/npm-saints-mile/handbook/reference/).
