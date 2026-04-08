# Claude-SFX — Build Plan

**UX for agentic coding.** Procedural audio feedback for Claude Code, built on
pure synthesis — no audio assets, no licensing risk, no bloat.

---

## Phase 1 — Synth Engine + Demo (The Sound)

The product IS the sound. Nothing else matters until the palette feels right.

### Deliverables
1. **`src/synth.ts`** — Pure PCM buffer generation from math
   - Oscillators: sine, square, sawtooth, noise
   - Envelope generator (attack, decay, sustain, release)
   - FM synthesis (for texture/modulation)
   - Tremolo (amplitude modulation for warning modifier)
   - Frequency sweep (for sync verb — whooshes)
   - WAV buffer encoder (PCM → valid .wav in memory)

2. **`src/verbs.ts`** — The 6 core verb definitions as synthesis parameters
   - `intake` — soft rising sine, 400→600 Hz, 150ms
   - `transform` — FM-textured pulse, 500 Hz, 100ms
   - `commit` — sharp-attack stamp tone, 800 Hz, 80ms
   - `navigate` — sonar ping, 1000 Hz with fast decay, 200ms
   - `execute` — noise burst + tone, 600 Hz, 100ms
   - `sync` — sine sweep, 400↔800 Hz, 300ms (direction = push/pull)

3. **`src/player.ts`** — Cross-platform audio playback
   - Windows: PowerShell `SoundPlayer` or `[Console]::Beep` fallback
   - macOS: `afplay`
   - Linux: `aplay` / `paplay`
   - Writes temp .wav, plays it, cleans up

4. **`src/cli.ts`** — Minimal CLI entry point
   - `claude-sfx demo` — plays all 6 verbs in sequence (THE ear test)
   - `claude-sfx play <verb> [--status ok|err|warn]`

5. **`package.json`** — Scaffold with TypeScript, bin entry, zero prod dependencies

### Success criteria
- Run `claude-sfx demo` and hear 6 distinct, cohesive tones
- Each tone is recognizable and non-annoying
- Total package: zero external audio dependencies

---

## Phase 2 — Profiles + Modifiers (The System)

Turn raw verbs into a configurable sound system.

### Deliverables
1. **Profile schema** — JSON format defining synthesis parameters per verb
   - `profiles/minimal.json` — subtle sine tones (default)
   - `profiles/retro.json` — square wave 8-bit chirps

2. **Modifier system** — Status, scope, and direction alter the sound
   - `--status ok` → add quiet octave harmonic
   - `--status err` → pitch drop 30% + detuning (beat frequency)
   - `--status warn` → tremolo at 8 Hz
   - `--scope remote` → slightly longer reverb tail / wider stereo
   - `--direction up|down` → sweep direction for sync verb

3. **Long-running ambient** — Duration-aware sound
   - If `--duration` passed and > 700ms, start a low 150 Hz drone
   - On resolution: two-note ascending stinger
   - Implemented as: background process that plays loop, killed on completion

4. **`claude-sfx play` updated** — Full modifier support
   - `claude-sfx play execute --status err`
   - `claude-sfx play sync --direction up --scope remote`

5. **`claude-sfx preview <profile>`** — Audition an entire profile

### Success criteria
- `claude-sfx play navigate --status err` sounds meaningfully different from `navigate --status ok`
- Switching profiles changes the entire character without breaking coherence
- Retro profile feels fun but controlled (not meme sounds)

---

## Phase 3 — Anti-Annoyance + Config (The Restraint)

What separates a product from a toy.

### Deliverables
1. **Debounce engine** (`src/debounce.ts`)
   - 200ms window: rapid-fire same-verb events collapse to one sound
   - State tracked via temp file or lightweight lockfile (no daemon)

2. **Rate limiter**
   - Max 8 sounds per 10-second sliding window
   - Overflow events silently dropped (no error, no queue)

3. **Quiet hours**
   - Config: `{ "quietHours": { "start": "22:00", "end": "07:00" } }`
   - During quiet hours: all sounds suppressed

4. **Global config** (`~/.claude-sfx/config.json`)
   - Active profile selection
   - Volume (0.0–1.0, applied as gain to PCM)
   - Quiet hours
   - Per-verb enable/disable
   - Per-repo profile override (matched by cwd)

5. **CLI commands**
   - `claude-sfx mute` / `claude-sfx unmute` (instant toggle)
   - `claude-sfx config` (print current config)
   - `claude-sfx config set <key> <value>`
   - `claude-sfx volume <0-100>`

### Success criteria
- 20 rapid file reads → hear 1-2 sounds, not 20
- Sounds never exceed the loudness cap regardless of profile
- Mute/unmute is instant and survives session restart

---

## Phase 4 — Claude Code Hook Integration (The Wiring)

Connect the sound engine to real Claude Code events.

### Deliverables
1. **Hook mapping document** — Which Claude Code events map to which verbs
   ```
   Tool: Read, WebFetch           → intake
   Tool: Edit                     → transform
   Tool: Write                    → commit
   Tool: Grep, Glob              → navigate
   Tool: Bash                    → execute (exit code → status)
   Tool: Task (spawn)            → intake --scope remote
   Tool: Task (return)           → commit --scope remote
   Bash containing "git push"    → sync --direction up
   Bash containing "git pull"    → sync --direction down
   ```

2. **`claude-sfx init`** — Auto-generates Claude Code hooks config
   - Writes to `.claude/hooks.json` (or merges with existing)
   - Maps post-tool hooks to `claude-sfx play` commands
   - Non-destructive: preserves existing hooks

3. **`claude-sfx uninstall`** — Cleanly removes hooks

4. **Exit code detection** — For Bash tool, read exit code to set status
   - 0 → `--status ok`
   - non-zero → `--status err`

5. **Session sounds** — Start/end chimes
   - Tied to Claude Code session lifecycle if hooks support it
   - Fallback: manual `claude-sfx session-start` / `session-end`

### Success criteria
- Run `claude-sfx init` in a project, start Claude Code, do work — hear sounds
- Sounds match the action (reads sound like intake, errors sound like errors)
- `claude-sfx uninstall` leaves no trace

---

## Phase 5 — Polish, Packaging + Ship (The Product)

### Deliverables
1. **npm package** — Published as `claude-sfx` (or `@anthropic-community/claude-sfx`)
   - `npm install -g claude-sfx`
   - Bin entry works cross-platform
   - Zero prod dependencies

2. **README** — Clear, opinionated, well-designed
   - Quick start (3 commands)
   - Profile gallery (description of each sound palette)
   - Configuration reference
   - "Why audio feedback?" section (accessibility + flow)

3. **Landing page** — `@mcptoolshop/site-theme` treatment
   - Demo section with verb descriptions
   - Profile comparison
   - Installation walkthrough

4. **CI** — GitHub Actions (paths-gated per rules)
   - Lint + typecheck + unit tests
   - npm publish on release

5. **Multilingual README** — polyglot-mcp translation

6. **Community hooks** — Allow users to contribute profiles as JSON

### Success criteria
- `npm install -g claude-sfx && claude-sfx init && claude-sfx demo` works first try
- README communicates "serious tool with taste" not "joke plugin"
- Landing page is live
