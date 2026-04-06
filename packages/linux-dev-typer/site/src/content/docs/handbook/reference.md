---
title: Reference
description: NuGet package, test suite, persistence, audio, accessibility, and security scope.
sidebar:
  order: 5
---

## NuGet package

The core engine ships as a standalone NuGet package: **LinuxDevTyper.Core**. It contains all typing, rating, trend, difficulty, weakness, and guided-mode logic with zero UI dependencies. You can embed it in your own .NET application, build a different frontend, or use it for automated typing analysis.

The package targets .NET 8 and has no external dependencies beyond the BCL.

## Test suite

The project includes **817 xUnit tests** organized across multiple test classes:

| Test area | What it covers |
|-----------|---------------|
| `RatingEngineTests` | Elo adjustment math, edge cases, profile-tuned constants. |
| `TrendEngineTests` | Window splitting, trend classification, plateau detection, consecutive decline filtering. |
| `FatigueDetectorTests` | Sitting boundary detection, break triggers, accuracy drop calculation. |
| `InsightEngineTests` | Priority ordering, dismissal, intent-awareness, milestone detection. |
| `SnippetSelectorTests` | Difficulty matching, weakness boost, focus categories, edge pools. |
| `SessionPlannerTests` | Mix distribution, yo-yo lock, manual lock, comfort zone establishment. |
| `PlannerInvariantTests` | Structural invariants that must hold across all planner states. |
| `PlannerEdgeCaseTests` | Empty pools, single-snippet pools, extreme ratings. |
| `PlannerProfileTests` | Profile-tuned planner behavior. |
| `PlannerPerformanceTests` | Selection latency under large snippet pools. |
| `MistakeAggregatorTests` | Category aggregation, top-weakness extraction. |
| `SymbolClassifierTests` | Character-to-category mapping for all 10 categories. |
| `WeaknessDetectorTests` | Rolling window, fallback to lifetime profile, cold start. |
| `WeaknessWindowTests` | Time decay, event recording, category extraction. |
| `WeaknessInvariantTests` | Structural guarantees on weakness data. |
| `DifficultyMemoryTests` | Comfort zone, yo-yo detection, outlier filtering, difficulty aging. |
| `SchemaMigratorTests` | Every migration path from v1 through v12. |
| `MigrationAuditTests` | Cross-version migration with data preservation verification. |
| `PackValidatorTests` | Pack format validation, invalid pack rejection. |
| `PortableBundleTests` | Import/export, merge behavior, format versioning. |
| `ContentIntegrationTests` | End-to-end content pipeline from ingestion to selection. |
| `CalibrationPackTests` | Built-in snippet integrity and difficulty derivation. |
| `PracticeProfileTests` | Parameter clamping, diff comparison, default immutability. |
| `XpEngineTests` | XP calculation, repeat decay, sloppy penalty. |
| `SummaryStatsEngineTests` | Monthly summary aggregation. |
| `ExplanationBuilderTests` | Selection reason formatting. |
| `ReasonFormatterTests` | Weakness context appending. |

Run the full suite:

```bash
dotnet test src/LinuxDevTyper.Core.Tests/ -c Release
```

## Persistence

All user data is stored in a single `state.json` file. The current schema is **version 12**, with automatic migration from any previous version.

### State structure

| Field | Type | Purpose |
|-------|------|---------|
| `SchemaVersion` | int | Current: 12. Triggers migration on load. |
| `Profile` | Profile | User identity and per-language ratings. |
| `Settings` | AppSettings | UI preferences, audio settings, feature flags. |
| `RecentResults` | List\<Result\> | Last 200 session results. Older results roll into monthly summaries. |
| `MistakeProfile` | MistakeProfile | Cumulative per-category mistake counts (lifetime). |
| `MistakeHeatmap` | MistakeHeatmap | Per-character hit/miss tracking for fine-grained analysis. |
| `WeaknessWindow` | WeaknessWindow | Time-decayed rolling mistake data. |
| `WeaknessSnapshots` | List | Daily snapshots of weakness state, capped at 90 entries. |
| `DifficultyMemory` | DifficultyMemory | Per-language, per-difficulty performance records and yo-yo state. |
| `PersonalDefaults` | PersonalDefaults | User's preferred starting configuration. |
| `SessionSummaryByMonth` | Dictionary | Aggregated stats for months whose sessions rolled off the 200-cap. |
| `PracticeProfiles` | Dictionary | Named practice profiles with tuning overrides. |
| `PackRegistry` | List\<PackMetadata\> | Discovered user packs with enabled/disabled state. |

The 200-result cap keeps the file small. When results roll off, they are summarized into `SessionSummaryByMonth` so historical stats are preserved without unbounded growth.

### Schema migration

The `SchemaMigrator` applies incremental migrations from any previous version to v12. Each migration step is idempotent. The migration audit test suite verifies every path from v1 through v12 preserves data integrity.

## Audio system

### Keyboard sound themes

Five keyboard themes ship with the app, each containing a set of WAV samples for keypress feedback:

1. **AlpsCream** — vintage Alps-style switches.
2. **Mechanical** — classic mechanical keyboard.
3. **Membrane** — soft membrane keyboard.
4. **SoftTouch** — quiet, dampened keys.
5. **Topre** — electrostatic capacitive switches.

### Ambient soundscapes

Four ambient categories provide background atmosphere:

1. **Ocean** — waves and coastal sounds.
2. **Rain** — rainfall and gentle thunder.
3. **Wind** — breezy outdoor ambience.
4. **Zen** — calm, meditative tones.

Volume controls, mute toggle, and a shuffle button for random ambient selection are available in the settings sidebar. Audio is powered by MiniAudio through the `MiniAudioService`. A `StubAudioService` is available for headless/test environments.

## Accessibility

- **Keyboard-first navigation** — every function is reachable without a mouse.
- **Reduced sensory mode** — disable ambient sounds and minimize visual effects.
- **High contrast support** — respects system high-contrast settings via Avalonia's theme system.
- **No time pressure** — there is no countdown timer or penalty for typing slowly. WPM is tracked but never gates access to content.

## Security scope

Linux Dev Typer is a fully offline desktop application with a minimal security surface:

- **No network access** — the app makes zero HTTP requests. No telemetry, no analytics, no update checks.
- **No accounts** — no registration, no login, no authentication.
- **Local-only persistence** — `state.json` lives in the user's config directory. No cloud sync.
- **No shell execution** — the app never spawns child processes or executes shell commands.
- **User-scoped file access** — reads and writes only within `~/.config/linux-dev-typer/` and the application directory.
- **Import validation** — all imported content (packs, bundles, files) is validated before entering the engine. Invalid data is rejected, not silently accepted.
