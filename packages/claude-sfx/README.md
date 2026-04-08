<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-sfx/readme.jpg" width="400" alt="Claude-SFX">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-sfx"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-sfx" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-sfx/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-sfx/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/claude-sfx"><img src="https://codecov.io/gh/mcp-tool-shop-org/claude-sfx/branch/main/graph/badge.svg" alt="codecov"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-sfx/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Procedural audio feedback for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Every tool call, file edit, search, git push, and agent dispatch gets a distinct sound — synthesized from math, not audio files.

## Quick Start

```bash
npm install -g @mcptoolshop/claude-sfx
cd your-project
claude-sfx init       # install hooks into .claude/settings.json
claude-sfx demo       # hear all 7 verbs
```

That's it. Claude Code will now play sounds as it works.

## Why Audio Feedback?

When an AI agent reads, writes, searches, and deploys on your behalf, you lose visibility. You're staring at text scrolling past. Audio feedback restores awareness:

- **Accessibility** — hear state changes, errors, and completions without watching the terminal
- **Flow** — know a test passed or a push landed without context-switching
- **Presence** — the agent feels like a collaborator, not a black box

## The 7 Verbs

Every Claude Code action maps to one of 7 core verbs. Modifiers (status, scope, direction) alter the sound without breaking coherence.

| Verb | Triggers | Sound |
|---|---|---|
| **intake** | `Read`, `WebFetch`, `WebSearch` | Soft rising sine — something coming in |
| **transform** | `Edit` | FM-textured pulse — reshaping |
| **commit** | `Write`, `NotebookEdit`, `git commit` | Sharp stamp tone — sealed |
| **navigate** | `Grep`, `Glob` | Sonar ping — scanning |
| **execute** | `Bash`, `npm test`, `tsc` | Noise burst + tone — mechanical action |
| **move** | `mv`, `cp`, subagent spawn | Wind whoosh — air displacement |
| **sync** | `git push`, `git pull` | Dramatic whoosh + tonal anchor |

### Modifiers

```bash
claude-sfx play navigate --status ok      # bright ping (octave harmonic)
claude-sfx play navigate --status err     # low detuned ping (dissonance)
claude-sfx play navigate --status warn    # tremolo ping
claude-sfx play sync --direction up       # rising whoosh (push)
claude-sfx play sync --direction down     # falling whoosh (pull)
claude-sfx play intake --scope remote     # longer tail (distance feel)
claude-sfx play commit --intensity 5      # full streak momentum
claude-sfx play execute --status err --escalation 4  # urgent repeated error
```

### Streak Awareness

Sounds evolve with momentum. Consecutive successful tool calls build a streak that adds harmonic richness — your productive session *sounds* productive.

| Streak | Intensity | Effect |
|---|---|---|
| 1 play | Level 1 | Clean base tone |
| 3+ plays | Level 2 | Subtle octave harmonic |
| 6+ plays | Level 3 | Harmonic + brighter frequency |
| 10+ plays | Level 4 | FM shimmer added |
| 15+ plays | Level 5 | Full richness — session is cooking |

Streaks reset after 30 seconds of idle or on any error.

### Error Escalation

Repeated errors get progressively more urgent — so you know something is stuck without reading the output.

| Consecutive Errors | Escalation | Effect |
|---|---|---|
| 1st error | Level 1 | Standard error tone (detuned, dropped pitch) |
| 2nd error | Level 2 | Deeper frequency drop + more detuning |
| 3rd error | Level 3 | Tremolo added (audible "wobble") |
| 4th error | Level 4 | Wide detuning, slower tremolo, longer decay |
| 5th+ error | Level 5 | Max urgency — deep, heavy, lingering |

Resets on any successful play.

### Completion Fanfare

Session end sounds are outcome-aware. A great session (80%+ success rate, 5+ plays) gets a triumphant ascending chord. A rough session gets a muted, subdued resolution. Short sessions get the standard chime.

### Smart Bash Detection

The hook handler inspects Bash commands to pick the right sound:

| Bash Command | Verb | Status |
|---|---|---|
| `git push` | sync (up) | from exit code |
| `git pull` | sync (down) | from exit code |
| `npm test`, `pytest` | execute | from exit code |
| `tsc`, `npm run build` | execute | from exit code |
| `mv`, `cp` | move | — |
| `rm` | move | warn |
| everything else | execute | from exit code |

## Profiles

Sound palettes that change the entire character with one flag.

| Profile | Character |
|---|---|
| **minimal** (default) | Sine-wave tones — subtle, professional, daily-driver |
| **retro** | Square-wave 8-bit chirps — fun but controlled |

```bash
claude-sfx demo --profile retro           # hear retro palette
claude-sfx preview minimal                # audition all sounds + modifiers
claude-sfx config set profile retro       # change default globally
claude-sfx config repo retro              # use retro in current directory only
```

### Custom Profiles

Copy `profiles/minimal.json`, edit the synthesis parameters, load it:

```bash
claude-sfx play navigate --profile ./my-profile.json
```

Every number in the JSON maps directly to the synth engine — waveform, frequency, duration, envelope (ADSR), FM depth, bandwidth, gain.

## Anti-Annoyance

What separates a product from a toy.

| Feature | Behavior |
|---|---|
| **Debounce** | Same verb within 200ms → one sound |
| **Rate limit** | Max 8 sounds per 10-second window |
| **Quiet hours** | All sounds suppressed during configured hours |
| **Mute** | Instant toggle, survives session restart |
| **Volume** | 0–100 gain control |
| **Per-verb disable** | Turn off specific verbs you don't want |

```bash
claude-sfx mute                            # instant silence
claude-sfx unmute
claude-sfx volume 40                       # quieter
claude-sfx config set quiet-start 22:00    # quiet after 10pm
claude-sfx config set quiet-end 07:00      # until 7am
claude-sfx disable navigate                # no more search pings
claude-sfx enable navigate                 # bring it back
```

## Ambient (Long-Running Operations)

For commands that take a while (builds, deploys, large test suites):

```bash
claude-sfx ambient-start     # low drone fades in
# ... operation runs ...
claude-sfx ambient-resolve   # drone stops, resolution stinger plays
claude-sfx ambient-stop      # stop drone silently (no stinger)
```

## Session Sounds

```bash
claude-sfx session-start     # two-note ascending chime (boot)
claude-sfx session-end       # two-note descending chime (closure)
```

## All Commands

```
Setup:
  init                            Install hooks into .claude/settings.json
  uninstall                       Remove hooks

Playback:
  play <verb> [options]           Play a sound (goes through guard)
  demo [--profile <name>]         Play all 7 verbs
  preview [profile]               Audition all sounds in a profile
  session-start / session-end     Chimes
  ambient-start / ambient-resolve / ambient-stop

Config:
  mute / unmute                   Toggle all sounds
  volume [0-100]                  Get or set volume
  config                          Print current config
  config set <key> <value>        Set a value
  config reset                    Reset to defaults
  config repo <profile|clear>     Per-directory profile override
  disable / enable <verb>         Toggle specific verbs
  export [dir] [--profile]        Export all sounds as .wav files
```

## How It Works

Zero audio files. Every sound is synthesized at runtime from math:

- **Oscillators** — sine, square, sawtooth, triangle, white noise
- **ADSR envelopes** — attack, decay, sustain, release
- **FM synthesis** — frequency modulation for texture
- **State-variable filter** — bandpass-filtered noise for whooshes
- **Frequency sweeps** — linear interpolation for movement
- **Loudness limiter** — soft-knee compression, hard ceiling

Sounds adapt over time through **streak awareness** (momentum builds harmonic layers), **error escalation** (repeated failures increase urgency), and **completion fanfare** (session outcome shapes the closing chord). The entire package is pure TypeScript with zero production dependencies. Sounds are generated as PCM buffers, encoded to WAV in memory, and played through the OS native audio player (PowerShell on Windows, afplay on macOS, aplay on Linux).

## Security & Privacy

**Data touched:** `~/.claude-sfx/config.json` (preferences), `.claude/settings.json` (hook registration). Audio buffers are generated in memory and never written to disk unless you run `export`.

**Data NOT touched:** source code, git history, network, credentials, environment variables. No telemetry is collected or sent. No audio files are downloaded — every sound is synthesized locally from math.

**Permissions:** filesystem read/write for config and hooks, OS audio player invocation. See [SECURITY.md](SECURITY.md) for the full policy.

## Requirements

- Node.js 18+
- Claude Code
- System audio output (speakers or headphones)

## License

[MIT](LICENSE)

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
