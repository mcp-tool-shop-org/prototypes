# linux-dev-typer — Roadmap

> Last updated: 2026-02-14

---

## Current State

**Version:** 1.0.0 (released, 13 tags from v0.1.0 through v1.0.0)
**Status:** Production-ready, shipping, NuGet published, CI/CD complete

| Dimension | Grade | Notes |
|-----------|-------|-------|
| Architecture | A | Clean Core/App split, zero UI deps in Core, abstraction-based extensibility |
| Testing | A+ | 817 tests: unit, invariant, integration, migration, performance gates, golden e2e |
| NuGet Packaging | A | LinuxDevTyper.Core published v1.0.0, Trusted Publishing, full metadata |
| CI/CD | A | Build + test on push (paths-filtered), publish on release, Trusted Publishing |
| Documentation | A | 40+ docs, CHANGELOG (694 lines), V1 release gate checklist, feature specs |
| Versioning | A | 13 semver tags, proper release history |
| Accessibility | A | Keyboard-first, high-contrast, reduced sensory mode, screen reader labels |

### What's Shipped (v1.0.0)
- Elo-inspired per-language rating system
- Adaptive difficulty with fatigue detection
- Weakness heatmaps with rolling 30-day decay
- Session planning (Target 50% / Review 30% / Stretch 20%)
- 168-snippet calibration system across 5 languages
- Guided Mode (opt-in, bounded bias, micro-drills)
- Portable bundles (.ldtpack), community notes, scaffolds, variants
- Export/import, audio system (5 keyboard themes + 4 ambient categories)
- Schema migration chain v1 → v12

---

## Phase 1 — Maintenance & Governance

> Goal: Fill remaining operational gaps for a shipped product.

- [ ] Create `CONTRIBUTING.md` with contributor setup guide
- [ ] Create `SECURITY.md` with vulnerability reporting policy
- [ ] Add `Directory.Build.props` NuGet pack baseline (IncludeSymbols, snupkg, Deterministic)
- [ ] Create `LICENSE` file (currently missing — MIT declared in csproj but no file)

---

## Phase 2 — Content Expansion (v1.1)

> Goal: More languages, more calibration coverage.

- [ ] Add calibration packs for Ruby, Kotlin, TypeScript
- [ ] Expand existing calibration packs (deeper D5-D7 coverage)
- [ ] Improve DevOpTyper.Content.Cli discoverability and documentation
- [ ] Ship configuration template presets (beginner, intermediate, hardcore)

---

## Phase 3 — Practice Evolution (v1.2)

> Goal: Richer practice modes without violating the philosophy.

- [ ] Timed sessions (1min, 3min, 5min fixed-duration practice)
- [ ] Snippet playlists (curated sequences for topic-focused practice)
- [ ] Difficulty preview (show estimated difficulty before starting)
- [ ] Export statistics (CSV/PDF report generation)

---

## Phase 4 — Cross-Platform Polish (v1.3)

> Goal: First-class experience on all three platforms.

- [ ] Create self-contained installers for Linux (AppImage/Flatpak)
- [ ] Create self-contained installer for macOS (.dmg)
- [ ] Create self-contained installer for Windows (MSIX or portable)
- [ ] Validate MiniAudioEx on all three platforms in CI

---

## Phase 5 — Advanced Features (v2.0)

> Goal: Major version with new capabilities.

- [ ] Multi-language sessions with unified rating
- [ ] Typing replay with hesitation analysis
- [ ] Custom theme editor
- [ ] Community snippet repository (optional, privacy-respecting, content-addressed)
- [ ] SignalPolicy expansion (enable more Guided Mode features)

---

## Non-Goals (Load-Bearing Boundaries)

- No cloud, no accounts, no telemetry
- No social features, no leaderboards
- No gamification pressure (streaks, daily goals)
- No AI code generation
- No plugin system (data-only extensions via .ldtpack)
- No IDE integration
- No rigid curricula
