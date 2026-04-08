---
title: All Commands
description: Complete command reference for claude-sfx.
sidebar:
  order: 4
---

## Setup

| Command | Description |
|---------|-------------|
| `init` | Install hooks into `.claude/settings.json` |
| `uninstall` | Remove hooks |

## Playback

| Command | Description |
|---------|-------------|
| `play <verb> [options]` | Play a sound (goes through guard) |
| `demo [--profile <name>]` | Play all 7 verbs |
| `preview [profile]` | Audition all sounds in a profile |
| `session-start` | Two-note ascending chime (boot) |
| `session-end` | Two-note descending chime (closure) |
| `ambient-start` | Low drone fades in (long-running ops) |
| `ambient-resolve` | Drone stops, resolution stinger plays |
| `ambient-stop` | Stop drone silently (no stinger) |

## Configuration

| Command | Description |
|---------|-------------|
| `mute` / `unmute` | Toggle all sounds |
| `volume [0-100]` | Get or set volume |
| `config` | Print current config |
| `config set <key> <value>` | Set a value |
| `config reset` | Reset to defaults |
| `config repo <profile\|clear>` | Per-directory profile override |
| `disable` / `enable <verb>` | Toggle specific verbs |
| `export [dir] [--profile]` | Export all sounds as .wav files |

## How it works

Zero audio files. Every sound is synthesized at runtime from math:

- **Oscillators** — sine, square, sawtooth, triangle, white noise
- **ADSR envelopes** — attack, decay, sustain, release
- **FM synthesis** — frequency modulation for texture
- **State-variable filter** — bandpass-filtered noise for whooshes
- **Frequency sweeps** — linear interpolation for movement
- **Loudness limiter** — soft-knee compression, hard ceiling

The entire package is ~2,800 lines of TypeScript with zero production dependencies.
