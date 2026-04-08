# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.3.0] - 2026-03-30

### Added
- **Density-aware ducking** (`mix.ts`) — rolling 3s window classifies event density as sparse/medium/bursty. Gain and release are scaled per density level. High-priority verbs (commit, sync) duck less; low-priority (navigate) ducks more during bursts.
- **Repetition guard** — same verb firing 2+ times in 3s triggers variant rotation, gain reduction (×0.95→×0.85), and release shortening. Prevents search/grep spam from becoming a chirp wall.
- **Remote low-pass softening** — one-pole RC filter (6dB/octave rolloff at 2500 Hz) applied to all remote-scope sounds. Mimics distance by absorbing high frequencies, complementing the existing envelope/gain changes.
- **Per-verb ducking priorities** — commit/sync are "high" (protected from heavy ducking), navigate is "low" (maximally ducked during bursts), others are "normal"
- **Gain floor** at 0.40 prevents sounds from disappearing under worst-case stacking (bursty + many repeats + low priority)
- `applyLowPass(buffer, cutoffHz)` in synth.ts — reusable one-pole LP filter
- `MixAdvice` type and `getMixAdvice()` in mix.ts — pure function returning ducking adjustments
- `mixGain` and `mixRelease` fields in `PlayOptions` for density/repetition adjustments
- 59 new tests (262 total)

## [1.2.1] - 2026-03-30

### Fixed
- **Windows audio playback** — use ffplay (ffmpeg) instead of PowerShell SoundPlayer, which silently failed on short audio clips. Falls back to PowerShell if ffplay is not installed.
- **Gain levels too low** — boosted all verb master gains from 0.16–0.20 to 0.50–0.60 so sounds are actually audible through system speakers

## [1.2.0] - 2026-03-30

### Changed
- **Complete sound redesign** — all verbs revoiced into A major pentatonic scale system
- **Multi-note motifs** replace single-tone beeps: each verb now has a 2–3 note melodic identity
- **3 variants per verb** with constrained micro-jitter (±5 cents pitch, ±6% duration, ±4ms onset) to reduce listener fatigue
- **Timbre separation** — intake uses sine/triangle blend, transform gets FM shimmer, commit has triangle/sine dyad + sparkle, navigate uses triangle radar chirp, execute sits in lower register with noise transient
- **Musical modifiers** — status:err drops the final note one scale degree instead of arbitrary pitch multiplication; status:warn uses gentler 5.5 Hz tremolo; status:ok adds a quiet perfect fifth
- **Intensity progression** (1–5) builds through harmonics → brighter intervals → FM shimmer → richer tail, NOT through loudness
- **Escalation progression** (1–5) darkens through lower register → detune → tremolo → heavy weight
- **Session sounds** now share the A major pentatonic grammar: start (A4→C#5), end (C#5→A4), fanfare (A4→C#5→E5)
- **Profile schema** updated: `MotifVerbConfig` with variant arrays replaces `ToneVerbConfig`; whoosh verbs gain `anchorVariants`
- Retro profile updated to match new architecture with square-wave motifs

### Added
- `variantIndex` option in PlayOptions for deterministic testing
- `SCALE` constants and `scaleStepDown`/`findClosestScaleDegree` scale helpers exported from profiles
- Waveform blending (`blendWaveform`/`blendAmount`) on motif notes and chime tones
- `NoiseTransient` type for filtered percussive onsets (execute verb)
- `WhooshAnchorVariant` type for tonal anchors under whoosh verbs (move, sync)

## [1.1.2] - 2026-03-29

### Fixed
- Windows `\r` in hook command paths — `where claude-sfx` output now properly stripped of carriage returns, fixing hooks that silently failed on Windows

## [1.1.1] - 2026-03-25

### Added
- Quiet hours input validation — `setQuietHours()` now validates HH:MM format and throws `SfxError` with hint for malformed input
- `isValidTimeFormat()` exported for programmatic use
- 5 new tests for time validation (197 total)

## [1.1.0] - 2026-03-19

### Added
- **Streak awareness** — consecutive successful plays build intensity (1-5), adding harmonic layers, frequency lift, FM shimmer, and gain boost as momentum builds
- **Error escalation** — consecutive errors progressively increase urgency (1-5), with deeper frequency drops, wider detuning, tremolo, and longer decay
- **Completion fanfare** — session end sound is outcome-aware: triumphant ascending chord for great sessions (80%+ success), muted resolution for rough ones, standard chime for normal
- New `--intensity` and `--escalation` flags for `play` command
- `demo` command now showcases intensity levels 1-5 and error escalation 1-5
- `export` command now includes intensity variants, escalation variants, fanfare, and muted end WAVs
- New `streak.ts` module for tracking session momentum and error runs
- 40 new tests (192 total)

### Fixed
- Ambient drone now self-terminates after 30 minutes (prevents orphaned loops)
- Stale ambient PID/WAV files cleaned up on detection
- Hook and player timeout reduced from 5s to 3s (sounds are 80-320ms)
- npm audit now blocks CI on known vulnerabilities (removed `|| true`)
- CI coverage thresholds enforced (80% lines/functions/statements, 70% branches)
- SCORECARD.md filled with actual audit gate results

## [1.0.0] - 2026-02-27

### Added
- Structured error handling with `SfxError` class (code/message/hint/cause/retryable)
- `--version` / `-V` flag
- `--debug` flag for stack traces on errors
- CI workflow with type checking, tests, coverage, and dependency audit
- Codecov integration
- SECURITY.md, CHANGELOG.md, SCORECARD.md (Shipcheck compliance)
- Threat model section in README
- `verify` script (build + test in one command)

## [0.1.2] - 2026-02-27

### Fixed
- Republished with correct npm scope and metadata

## [0.1.1] - 2026-02-27

### Changed
- Scoped package to `@mcptoolshop/claude-sfx`
- Updated brand logo to centralized brand repo

## [0.1.0] - 2026-02-27

### Added
- 7 core verbs: intake, transform, commit, navigate, execute, move, sync
- Procedural audio synthesis engine (sine, square, sawtooth, triangle, noise)
- ADSR envelopes, FM synthesis, state-variable filter, frequency sweeps
- Loudness limiter with soft-knee compression
- Anti-annoyance: debounce, rate limiting, quiet hours, mute, per-verb disable
- Sound profiles: minimal (default) and retro
- Custom profile support via JSON files
- Ambient drone system for long-running operations
- Session start/end chimes
- Hook handler for Claude Code integration
- WAV export for all sounds
- Zero production dependencies
