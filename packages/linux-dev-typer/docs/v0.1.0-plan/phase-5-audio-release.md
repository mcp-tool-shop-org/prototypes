# Phase 5 — Audio integration + v0.1.0 release (Commits 21–25)

> Goal: ship v0.1.0 on Linux with stable UX, docs, and a tagged release.

## Commit 21 — `feat(app): audio service interface + stub wiring`
- [ ] Add `IAudioService` in Core (or App abstractions)
- [ ] Wire calls in UI:
  - [ ] UI click on button presses
  - [ ] key click on typing (throttle)
  - [ ] ambient random/mute toggle scaffolding
- [ ] Commit (even if playback is initially no-op)

## Commit 22 — `feat(app): implement audio playback (choose backend)`
Pick one:
- Option A: `ManagedBass` / `OpenAL` wrapper
- Option B: `SDL2` audio
- Option C: `NAudio` alternatives (Linux support varies)
- Option D: external process `aplay` (not recommended for latency)

Checklist:
- [ ] Load WAVs from `Assets/sounds/...`
- [ ] Ambient picks random on startup when unmuted
- [ ] Ambient mute only affects ambient (not SFX)
- [ ] Volume sliders apply
- [ ] Commit

## Commit 23 — `a11y(app): reduced sensory mode`
- [ ] Add setting `ReducedSensory`
- [ ] When enabled:
  - [ ] cap ambient volume
  - [ ] cap key/click volume
  - [ ] optional: reduce key click frequency
- [ ] Commit

## Commit 24 — `docs: v0.1.0 verification checklist + runbook`
- [ ] Add `docs/v0.1.0-checklist.md` mirroring release gates:
  - [ ] build/run
  - [ ] persistence
  - [ ] audio behavior
  - [ ] accessibility basics
- [ ] Update README with install/run steps and known limitations
- [ ] Commit

## Commit 25 — `release: v0.1.0`
- [ ] Update `VERSION.txt` → `0.1.0`
- [ ] Finalize `CHANGELOG.md` 0.1.0 section
- [ ] `git tag v0.1.0`
- [ ] Build `Release` and run final smoke test
- [ ] Commit

---

## Phase 5 Exit Criteria (v0.1.0 Definition of Done)
- [ ] App builds and runs on Linux
- [ ] Code-only typing sessions with per-char feedback
- [ ] Persistent profile + settings + results
- [ ] Ambient random/mute + key/UI sounds (or clearly documented if deferred)
- [ ] Accessibility baseline: keyboard nav + focus visible + font sizing
- [ ] Tagged `v0.1.0` with changelog
