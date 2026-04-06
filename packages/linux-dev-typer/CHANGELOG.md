# Changelog

## 1.0.4 — Audit + Quality Pass (2026-03-25)

### Added
- `--version` / `-V` CLI flag on desktop app entry point

### Fixed
- VERSION.txt synced with actual release version (was stuck at 1.0.0)
- `.gitignore` now excludes `coverage/`, `TestResults/`, `nupkg/`

## 1.0.0 — Close the Loop

Goals:
- Signals influence practice — only when the user opts in
- Guided Mode: single toggle, default OFF, bounded bias
- Micro-drills: 5-item focused sessions on top weakness
- Release-grade quality with 800+ tests

Non-goals:
- No auto-enabled AI adaptation
- No dark patterns in opt-in UX
- No signal leakage to rating, XP, or difficulty

### Phase 1 — Close the Loop Safely
- `feat`: SignalPolicy with feature-flagged Guided Mode (schema v12)
- `feat`: WeaknessBias (HeatmapBias + HeatmapCategoryBias) gated by SignalPolicy
- `test`: 24 WeaknessBias invariant tests (band, determinism, cap, gating)
- `feat`: Guided Mode toggle in sidebar (opt-in, default OFF, persisted)
- `feat`: Targeted micro-drills (5 items, auto-exit, heatmap-aware)
- `docs`: Signals trust model documentation
- `feat`: Signal storage hygiene (heatmap cap 200, confusion pairs cap 20, prune)
- `perf`: 5k CodeItem performance gate tests

### Phase 2 — Release-Grade Hardening
- `test`: Migration audit (v9-v12, v10-v12, v11-v12, v12-v12 idempotent)
- `test`: Golden end-to-end session tests (deterministic lifecycle)
- `a11y`: AutomationProperties on all v1.0 interactive elements
- `polish`: Onboarding hint for Guided Mode (shows when no weakness data)
- `feat`: Library health diagnostics panel
- `perf`: Serialization profiling (<10ms, <200KB maxed state)
- `docs`: v1.0.0 release notes

## 0.9.0 — Structured Practice & Learning Signals

Goals:
- The app knows what to practice next — and why
- Calibration content with full difficulty band coverage
- Session planner with Target / Review / Stretch mix
- Weakness detection with rolling windows
- Transparent, explainable selection

Non-goals:
- No rigid curriculum trees or locked lesson order
- No cloud accounts or telemetry
- No ML / black-box adaptation

### Phase 1: Calibration Content & Fixtures (complete)
- 168 calibration snippets across 5 languages (python, rust, javascript, csharp, go)
- Full difficulty band coverage: D1-D7, minimum 33 per language
- CalibrationAssetProvider loads JSON packs from Assets/calibration/
- ContentPipeline.IngestCalibration() with source/origin tagging
- Calibration excluded from GetSnippets() (practice), exposed via GetCalibrationSnippets() (planner)
- Sidecar metadata preserves authored difficulty through the pipeline
- SnippetFixtures for Phase 2 session planner tests
- 501 total tests (up from 460 pre-calibration)
  - CalibrationPackTests (52): structure, coverage, ID format, uniqueness
  - CalibrationIngestionTests (13): pipeline integration, isolation
  - CalibrationDerivationTests (17): derivation invariants, trend analysis

### Phase 2: Session Planner & Practice Mix (complete)
- SessionPlanner wraps SnippetSelector with Target(50%)/Review(30%)/Stretch(20%) mix
- SessionPlan record: category, target/actual difficulty, comfort zone, reason string
- Display-only metadata — never affects engine scoring, rating, or XP
- Handles: manual lock override, yo-yo stabilization, no-comfort bootstrapping
- Plan reason shown in difficulty sidebar and top bar category suffix
- PracticeProfile parameters flow through to comfort zone → planner decisions
- 565 total tests (up from 501 post-Phase 1)
  - SessionPlannerTests (19): core planner behavior
  - PlannerInvariantTests (16): display-only guarantees
  - PlannerEdgeCaseTests (17): unusual inputs, extremes
  - PlannerProfileTests (6): profile parameter integration
  - PlannerPerformanceTests (4): throughput benchmarks

### Phase 3: Weakness Detection & Skill Signals (complete)
- WeaknessWindow: rolling decay window with recency-weighted mistake tracking
- Recent mistakes (1.0× weight) naturally outweigh older mistakes (0.5× weight)
- Auto-prune: events older than 30 days removed, max 500 events retained
- WeaknessDetector: bridges rolling window with snippet selection boost
  - Falls back to cumulative MistakeProfile on cold start (empty window)
  - DescribeWeaknesses() produces human-readable context for planner reasons
  - GetWeaknessScores() produces structured entries for UI display
- SkillSignal + SkillSignalBuilder: aggregated skill snapshot for UI
  - Comfort zone, session plan, rolling weaknesses, yo-yo/lock state
  - Human-readable summary (e.g., "Comfort D4 — braces needs work")
- SessionPlanner reason enrichment: "Practicing at D4 — targeting braces weakness"
  - Weakness context only enriches reason strings, never target difficulty or category
- Rolling weakness scores displayed in sidebar below cumulative weaknesses
- Display-only guarantees: 19 invariant tests prove no engine impact
- 620 total tests (up from 565 post-Phase 2)
  - WeaknessWindowTests (13): recording, recency decay, pruning, recovery
  - WeaknessDetectorTests (23): fallback, decay, formatting, category exclusion
  - WeaknessInvariantTests (19): display-only guarantees across all engines

### Phase 4: UX Surfacing & Transparency (complete)
- SelectionExplanation model: structured "why this snippet?" with categorized factors
- ExplanationBuilder: assembles 2-5 factors from plan, snippet, weaknesses, focus mode
  - Mix category factor, difficulty match, weakness boost, focus practice, comfort zone
- ReasonFormatter: human-readable pick reasons with category icons
- Full explanation displayed on completion card behind Details toggle
  - "Why this snippet" section with "+" prefixed factors
- Sidebar skill signal display: italic summary + monospace rolling weakness scores
- All explanation and signal elements have AutomationProperties for screen readers
- Display-only guarantees: 12 invariant tests prove no engine reads explanation data
- Performance: 6 sustained-throughput benchmarks (10K builds, 1K full pipelines)
- 664 total tests (up from 620 post-Phase 3)
  - ReasonFormatterTests (11): format variations, category labels, icons
  - ExplanationBuilderTests (15): factors, influence flags, all combinations
  - ExplanationInvariantTests (12): immutability, engine isolation, format consistency
  - ExplanationPerformanceTests (6): sustained throughput benchmarks

### Phase 5: Per-Character Tracking & Release (complete)
- MistakeHeatmap: per-character hit/miss frequency tracking with rolling window
  - Confusion pair detection (what was typed instead of what was expected)
  - Recent error rate via sliding window of last N attempts
  - GetWeakest(), GetWeakestCategories(), GetWeakCharSet() queries
- WeaknessTracker: trajectory analysis comparing current state to daily snapshots
  - Trajectory classification: Improving / Worsening / Steady / New
  - MaybeSnapshot() captures at most once per day per language (90-entry cap)
  - Priority weakness selection (worsening > new > steady > improving)
- Session recording integration: RecordHeatmapData() and MaybeSnapshot() in completion flow
- Sidebar: "Per-character" sub-section with top 5 weak chars, error rates, confusion pairs
- Completion card: trajectory summary and directional indicators (v/^/-/* arrows)
- Schema v10 → v11: MistakeHeatmap + WeaknessSnapshots on PersistedState
- Display-only guarantees: 12 invariant tests prove no engine reads heatmap data
- Performance: 5 sustained-throughput benchmarks (100K records, 1K pipeline sessions)
- 733 total tests (up from 664 post-Phase 4)
  - MistakeHeatmapTests (17): recording, queries, rolling window
  - WeaknessTrackerTests (18): reports, trajectories, snapshots
  - HeatmapInvariantTests (12): engine isolation, input immutability
  - HeatmapPerformanceTests (5): sustained throughput
  - UXTransparencyTests (16): plan metadata, reason formatting, mismatch annotation
  - V09FeatureCompletenessTests (17): cross-phase feature verification

### Release Polish
- Result record stores PlanCategory and PlanReason (display-only metadata)
- ReasonFormatter with category icons used for plan preview
- Graceful mismatch annotation when actual difficulty differs from target
- Debug inspector (Ctrl+Shift+D): plan state, difficulty, weakness, heatmap
- CalibrationTag.IsCalibration() utility for future stats exclusion
- 749 total tests at release

## 0.8.2 — Parity + Migration Prep

### Canonical Pipeline
- All content (built-in, user packs, pasted, imported) now enters as `CodeItem` through `ContentPipeline`
- Sidecar metadata map preserves authored Snippet fields (Difficulty, Topics, Explain, Notes, Scaffold, Variants)
- `CompositeAssetProvider` and `ContentAssetProvider` removed from selection path
- Single `_pipeline.GetSnippets(lang)` call replaces multi-source merge

### Difficulty Derivation
- Replaced hardcoded `Difficulty=3` default with deterministic metrics-based derivation
- Three bands: line count (0-3pts), symbol density (0-3pts), max indent depth (0-3pts)
- Total 0-9 mapped to difficulty 1-7: `clamp(1 + score * 6 / 9, 1, 7)`
- Authored difficulty from sidecar metadata always takes precedence
- No ML, no adaptation, fully reproducible

### Testing
- 408 total tests (up from 354 in v0.8.1)
- CanonicalContentTests (25): difficulty band scoring, derivation invariants, score-to-difficulty mapping, content-addressed ID stability, built-in snippet roundtrip
- ParityGateTests (9): no hardcoded Difficulty=3, built-in canonicalization, deduplication, sidecar pattern, full range coverage, metrics persistence roundtrip

### Documentation
- `docs/v0.8.2-difficulty-derivation.md`: algorithm, band tables, mapping, precedence, invariants

## 0.8.1 — Content System Integration

### Content Library
- Integrated `DevOpTyper.Content` v1.0.0 shared library for content indexing
- Content-addressed IDs (SHA-256) ensure automatic deduplication
- Bridge pattern: `CodeItem` → `Snippet` conversion preserves all existing engine behavior
- Content library items get difficulty derived from code metrics (superseded in v0.8.2)

### Paste Code
- Paste code text directly from the sidebar to create new practice content
- Optional title and language hint (auto-detected if omitted)
- New snippet immediately available for practice after paste

### Import File
- Import a single file as practice content from the sidebar
- Auto-detected language based on file extension and content heuristics
- Extraction rules: files under 4000 chars kept whole; larger files split into logical blocks

### Import Folder
- Recursively scan a folder and index all files as practice content
- 2MB per-file guardrail — large files skipped automatically
- Manual only — no file watchers, deliberate user action

### Sidebar
- New "Library" section between Snippet Packs and Import/Export
- Shows total indexed items count and operation status messages
- Paste Code: title, language hint, and code text inputs with "Add" button
- Import: file path and folder path inputs with import buttons
- AutomationProperties on all new controls for accessibility

### Storage
- `library.index.json` stored alongside `state.json` in config directory
- `AppPaths.LibraryIndexFile()` for cross-platform path resolution
- Resilient loading: missing or corrupt index returns empty library (no crash)

### Selection
- `ContentAssetProvider` bridges content library items into the existing snippet pipeline
- Language list is the union of built-in, user pack, and content library languages
- `SnippetSelector.Pick()` unchanged — consumes merged snippet list as before

### Testing
- 354 total tests (up from 330 in v0.8.0)
- ContentIntegrationTests (24): ContentId determinism, Normalizer, MetricCalculator, index persistence (roundtrip, missing, corrupt, empty), InMemoryContentLibrary queries, DefaultExtractor, CodeItem→Snippet bridge, performance (1000-item roundtrip, 100 queries), LanguageDetector

### Documentation
- `docs/v0.8.1-content-system.md` — architecture, bridge pattern, storage paths, design decisions

## 0.8.0 — Pedagogy Without Hierarchy

### Scaffolds
- Optional `Scaffold` field on snippets: progressive learning context with layered depth
- Index 0: shallow hint (visible by default). Index 1+: deeper context behind "More context" button
- Observational language only — describes the pattern, never prescribes behavior
- Displayed on completion card with `^` prefix (depth/rising)
- ShowScaffolds toggle in sidebar to hide/show independently
- Anonymous by design — no author, no teaching level, no prerequisite chain

### Variants
- Optional `Variants` field on snippets: alternative implementations of the same logic
- Each entry is a self-contained code snippet showing a different valid approach
- All variants are structural equals — no ranking, no "preferred" indicator
- Displayed as monospace code cards with `=` prefix (equivalence) and subtle background
- ShowVariants toggle in sidebar to hide/show independently
- Anonymous by design — no author, no attribution

### Portable Bundle Format v3
- `.ldtpack` format version bumped to v3 (backward-compatible with v1 and v2)
- v1 bundles import cleanly — missing Notes, CommunityDifficulty, Scaffold, Variants default to null
- v2 bundles import cleanly — missing Scaffold, Variants default to null
- v3 exports include Scaffold and Variants when present; null fields omitted

### Pack Validation
- Scaffold sanitization: empty/whitespace entries filtered automatically (non-blocking)
- Variants sanitization: empty/whitespace entries filtered automatically (non-blocking)
- All-empty arrays normalized to null (same pattern as Notes)

### Sidebar
- New "Teaching" section between Community and Practice Profiles
- Two independent checkboxes: "Show scaffolds" and "Show variants"
- Both default to true; disabling has zero penalty
- AutomationProperties on all new controls including "More context" button

### Persistence
- Schema v10: ShowScaffolds and ShowVariants added to AppSettings
- Scaffold and Variants live on Snippet (in pack JSON), not in state.json
- Full backward compatibility: v1-v10 migration chain

### Philosophy
- Teaching = exposing structure, not directing behavior
- Scaffolds: depth without hierarchy (user-controlled progressive disclosure)
- Variants: breadth without ranking (multiple valid approaches as structural equals)
- Solo use remains first-class — all teaching features are optional and display-only
- Imported content is indistinguishable from locally-authored content

### Display Markers
- `*` — Explain (factual)
- `~` — Notes (community perspectives)
- `!` — Weak spots (session errors)
- `^` — Scaffold (progressive context)
- `=` — Variants (alternative implementations)

### Documentation
- `docs/v0.8.0-pedagogy-philosophy.md` — teaching through structure, not direction
- `docs/v0.8.0-scaffolds.md` — scaffold specification and authoring guide
- `docs/v0.8.0-variants.md` — variants specification and ethical boundaries
- Updated `docs/snippet-schema.md` with Scaffold and Variants fields

### Testing
- 330 total tests (up from 285 in v0.7.0)
- PedagogyFeatureTests (12): defaults, roundtrips, schema migration, feature completeness
- PortableBundle v3 tests (10): Scaffold/Variants roundtrip, v1/v2 compat, export, merge, perf
- SnippetSelector firewall tests (4): Scaffold/Variants never affect selection or weighting
- ProfileInvariants firewall (2): engines ignore Scaffold and Variants (reflection-enforced)
- PackValidator Scaffold/Variants tests (6): null, populated, empty entries, all-empty normalization
- Performance tests (2): 1000-snippet selection with pedagogy, 500-snippet bundle roundtrip

## 0.7.0 — Shared Craft, Quietly

### Community Notes
- Optional `Notes` field on snippets: tips, alternatives, perspectives from shared packs
- Distinct from `Explain` (factual) — Notes carry multiple viewpoints using `~` bullet prefix
- Displayed on completion card behind existing Details toggle
- ShowCommunityNotes toggle in sidebar to hide/show independently
- Anonymous by design — no author, no source, no metadata on any note

### Community Difficulty Signal
- Optional `CommunityDifficulty` field on snippets: what others found the actual difficulty to be
- Display-only — NEVER affects snippet selection, difficulty adjustment, rating, or any engine behavior
- Shown as "Community: X.X" on completion card when present
- ShowCommunitySignals toggle in sidebar to hide/show independently
- Firewall tests enforce isolation: SnippetSelector, DifficultyMemory, RatingEngine never read this field

### Portable Bundle Format v2
- `.ldtpack` format version bumped to v2 (backward-compatible with v1)
- v1 bundles import cleanly — missing Notes and CommunityDifficulty default to null
- v2 exports include Notes and CommunityDifficulty when present
- `DefaultIgnoreCondition.WhenWritingNull` keeps exports clean for packs without community data

### Pack Validation
- Notes sanitization: empty/whitespace entries filtered automatically (non-blocking)
- All-empty Notes arrays normalized to null
- Existing validation rules unchanged — Notes is optional

### Sidebar
- New "Community" section between Personalization and Practice Profiles
- Two independent checkboxes: "Show community notes" and "Show community signals"
- Both default to true; disabling has zero penalty
- AutomationProperties on all new controls; tab order verified

### Persistence
- Schema v9: ShowCommunityNotes and ShowCommunitySignals added to AppSettings
- Notes and CommunityDifficulty live on Snippet (in pack JSON), not in state.json
- Full backward compatibility: v1-v9 migration chain

### Philosophy
- Community = shared craft through `.ldtpack` artifacts, not identity
- No accounts, no servers, no leaderboards, no attribution, no feeds
- Solo use remains first-class — all community features are optional and display-only
- Imported content is indistinguishable from local content (no Source/Author/Origin fields)

### Documentation
- `docs/v0.7.0-community-philosophy.md` — community design principles
- `docs/v0.7.0-sharing.md` — what travels in packs, format versions, anonymous by design
- `docs/v0.7.0-collective-signals.md` — CommunityDifficulty ethical boundaries
- Updated `docs/snippet-schema.md` with Notes and CommunityDifficulty fields

### Testing
- 285 total tests (up from 250 in v0.6.0)
- CommunityFeatureTests (9): defaults, roundtrips, schema migration, community toggles
- PortableBundle v2 tests (14): Notes roundtrip, v1 compat, export/import, anonymity, performance
- SnippetSelector firewall tests (5): community fields never affect selection or weighting
- DifficultyMemory firewall (1): CommunityDifficulty never recorded (reflection-enforced)
- ProfileInvariants firewall (1): engines ignore CommunityDifficulty (reflection-enforced)
- PackValidator Notes tests (4): null, populated, empty entries, all-empty normalization
- Performance tests (2): 1000-snippet selection, 500-snippet bundle serialization

## 0.6.0 — Authorship, Extensibility, and User-Owned Evolution

### User Snippet Packs
- Drop `{language}.json` files into `~/.config/linux-dev-typer/packs/` to add your own snippets
- Same JSON format as built-in packs — validated with PackValidator before loading
- CompositeAssetProvider merges built-in and user packs transparently
- Enable/disable individual packs from the sidebar without deleting files
- Refresh button re-scans the packs directory for newly added files
- Invalid or malformed packs are skipped silently — other packs load normally

### Practice Profiles
- Named parameter sets that tune all engine constants (XP, rating, difficulty, trends, fatigue)
- "Default" profile always matches hardcoded v0.5.0 constants (read-only, never deleted)
- Create, switch, and delete profiles from the sidebar
- Profile editor: 7 key parameter sliders with live feedback
- Diff summary shows "Changes from Default" for the active profile
- Active profile badge displayed on completion card
- All values clamped to safe ranges — extreme values cannot crash engines or produce invalid results

### Import/Export
- Export user packs and custom profiles as a single `.ldtpack` file (human-readable JSON)
- Import merges into local state: new packs written to disk, new profiles added to state
- Existing packs and profiles never overwritten on import
- Imported snippets validated before writing; imported profiles clamped to safe ranges
- Only user-authored content travels — never practice history, state, or results

### Engine Refactoring
- All static engines (XpEngine, RatingEngine, TrendEngine, FatigueDetector, DifficultyMemory) accept optional `PracticeProfile?` parameter
- When `null`, engines use `PracticeProfile.Default` — zero behavioral change from v0.5.0
- Profile resolution cached per session (not re-resolved per keystroke)
- Default profile cached as singleton — zero allocation overhead

### Cross-Platform
- Shared `AppPaths` helper: single source of truth for config directory, state file, and packs directory
- `NormalizeLanguageKey()` strips path separators and normalizes casing on import
- Works on both Windows (`%APPDATA%`) and Linux (`~/.config`)

### Accessibility
- AutomationProperties.Name added to all new sidebar controls (profile dropdown, sliders, buttons)
- Tab order verified: Settings → Audio → Weaknesses → Difficulty → Profiles → Packs → Import/Export
- All new controls keyboard-operable with visible focus outlines

### Safety & Stability
- Extension failure isolation: user pack exceptions never affect built-in snippet loading
- Empty packs directory = zero overhead (no scanning if directory doesn't exist)
- Removing packs directory mid-session doesn't crash the app
- Profile clamping enforced at load time (SchemaMigrator) and import time

### Persistence
- Schema v8: PracticeProfiles dictionary and PackRegistry list added to PersistedState
- AppSettings.ActiveProfileName tracks the active profile
- Full backward compatibility: v1-v8 migration chain
- Profiles included in `.ldtpack` exports; merge without overwriting on import

### Documentation
- `docs/v0.6.0-authorship.md` — how to create user snippet packs
- `docs/v0.6.0-extensibility.md` — philosophy: extensions augment, never override
- `docs/v0.6.0-profiles.md` — practice profile parameter reference
- `docs/v0.6.0-boundaries.md` — permanent non-goals (what the tool will never be)
- Updated snippet-schema.md with user pack paths and examples

### Testing
- 250 total tests (up from 180 in v0.5.0)
- PracticeProfile (15): defaults, clamping (all fields, low/high), diff, singleton identity
- PackValidator (11): valid/invalid packs, boundary difficulty, duplicate IDs, multiple errors
- PortableBundle (7): roundtrip, merge, no-overwrite, skip Default, clamp imports, normalize keys
- ProfileInvariants (17): extreme min/max profiles across all engines — XP ≥ 0, rating ≥ 100, difficulty 1-7
- SchemaMigrator v8 (3): v7→v8 migration, profile clamping post-migration
- Engine profile tests (14): RatingEngine, TrendEngine, FatigueDetector, DifficultyMemory with custom profiles

## 0.5.0 — Continuity, Resilience, and Trust

### Continuity Beyond Versions
- MonthSummary: results beyond the 200-session cap are compressed into monthly aggregates (avg WPM, avg accuracy, total XP, languages used) so long-term users never lose history
- Session browser now shows monthly summary rows and lifetime totals ("Practiced since 2025-01: 342 sessions")
- Schema v7 migration retroactively builds monthly summaries from existing results

### Welcome Back
- 30+ day absence tier: preserves all records (may be the only data), only softens comfort zones
- Mini-recap from last session shown in welcome-back banner

### Gentle Guidance
- OrientationEngine: optional pre-session cues based on content (stale language, improving accuracy, unseen snippets)
- Cues reference what was practiced, never when or how often
- Orientation cues are sticky (persist until a new cue generates)

### Resilience to Plateaus
- Plateau detection: MetricTrend.Plateau when recent 10+ sessions show very low variance
- Plateau reassurance: "Steady performance over N sessions — consistency is mastery."
- Stability window: declining trend requires 3+ consecutive drops before surfacing
- Outlier exclusion: one bad session (accuracy < 60% AND WPM < 50% median) doesn't destroy your comfort zone

### Neutral Messaging
- All regression messages rewritten to be emotionally neutral
- "Accuracy has shifted — this is normal during practice."
- "Rough session. XP is reduced below 70% accuracy."
- Fatigue banner uses muted color (no longer accent)

### Simplified Fatigue
- Single-level fatigue: bool SuggestBreak replaces three-tier FatigueLevel enum
- One message: "You've been practicing for a while." No escalation, no judgment

### User Control
- Show performance cues toggle: suppress declining trends, sloppy warnings, fatigue
- Freeze personalization: stop learning new preferences
- Reset learned preferences: clear all personalization back to defaults

### Personalization Confidence
- Language confidence (0-1) gates suggestions: only surfaces at 70%+ confidence
- Stabilization: preference locks at 90%+ confidence, requires 5+ different-language sessions to break
- MinSessionsForSuggestions raised from 10 to 15

### Internal Rhythm Tracking
- PracticeRhythm tracks time-of-day patterns (Morning/Afternoon/Evening) internally
- Never surfaced to the user — the app responds to what you practice, not when
- No time-of-day references in any user-facing text

### Reduced Novelty
- Boss-pick (10% random high-difficulty) removed — difficulty always follows weighting
- Welcome-back banner simplified to message only (details in session browser)

### Persistence
- Schema v7: SessionSummaryByMonth added, retroactive migration from existing results
- Full backward compatibility: v1-v7 migration chain

### Testing
- 180 total tests (up from 144 in v0.4.0)
- OrientationEngine (8), PracticeRhythm (3), PersonalDefaults (6), TrendEngine plateau/stability (4), InsightEngine plateau/toggle (4), DifficultyMemory outlier (5), FatigueDetector rewrite (8), SchemaMigrator v7 (3)

## 0.4.0 — Agency, Reflection, and Depth

### Practice Intent
- PracticeIntent enum (None, Warmup, Explore, Drill, Challenge) — purely metadata, no scoring impact
- Optional intent picker in toolbar, resets each app launch
- Intent-aware insights: "Drill paid off", "Good warmup", "Challenge accepted"

### Session Notes
- Free-text note field on completion card (max 200 chars, optional)
- Notes saved to Result record and displayed in session browser

### Session Browser
- "History" button opens a searchable browser of all past sessions (up to 200)
- Each entry shows date, language, WPM, accuracy, XP, difficulty, intent, and note preview
- Filter/search across all fields
- Summary stats header: total sessions, avg WPM, best WPM, total XP

### Welcome Back
- Detects gaps of 24h+ and shows a dismissable banner with contextual greeting
- 7+ day absence: difficulty records aged, comfort zones softened automatically
- Banner auto-dismisses after first completed session

### User Control Over System Behavior
- Yo-yo lock "Override" button: dismiss the anti-yo-yo lock when you disagree
- PersonalDefaults suggestions surfaced with Apply/Dismiss (non-intrusive banner)
- Insight dismiss buttons: permanently hide specific insight types you don't want
- Fatigue banner dismiss button (session-only, not permanent)

### Calm Completion Card
- Progressive disclosure: core stats always visible, details behind "Details" toggle
- Reduced visual noise: "Complete" instead of "Complete!", text-only difficulty labels
- Always-visible: WPM, accuracy, errors, XP, note input, Next/Repeat

### DifficultyMemory Enhancements
- Inactivity aging: records older than 30 days removed on return
- Comfort zone softening after 7+ day absence
- Yo-yo dismissal tracks record count to distinguish old vs new patterns

### Persistence
- Schema v6: DismissedInsightTypes (HashSet) and YoYoDismissedAt (Dictionary) added
- Result archive expanded from 50 to 200 sessions
- Full backward compatibility: v1-v6 migration chain

### Testing
- 144 total tests (up from 115 in v0.3.0)
- WelcomeBackDetector tests (5): gap boundaries, returning detection
- SummaryStatsEngine tests (5): empty, single, multiple, filter, no-match
- PersonalDefaults tests (3): suggestion surfacing, dismissal cooldown
- DifficultyMemory aging/softening tests (5): age records, comfort zone reset
- InsightEngine intent + dismissal tests (7): all intent types, dismiss/non-dismiss
- SchemaMigrator v6 tests (2): migration and idempotency

## 0.3.0 — Intentional Practice Over Time

### Trend Tracking
- TrendEngine computes rolling WPM and accuracy trends per language
- MetricTrend classification: Improving / Stable / Declining
- Noise filter: trends only shown after 5+ sessions to avoid misleading signals
- Trend arrows and deltas displayed in Live Stats panel and completion card

### Adaptive Difficulty
- DifficultyMemory tracks per-language comfort zones (avg accuracy >= 85% with 3+ sessions)
- Automatic difficulty suggestions: comfort zone + 1 for gradual progression
- Anti-yo-yo detection: locks to comfort zone for 3 sessions if difficulty bouncing detected
- Gradual progression clamp: difficulty can only change by +/-1 between consecutive sessions
- Manual difficulty lock (1-7) in sidebar for deliberate practice at a fixed level
- Difficulty badge shown in session status bar

### Post-Session Insights
- InsightEngine generates 1-2 contextual insights after each session
- 8 priority-ordered rules: personal best, accuracy milestones, improving/declining trends,
  comfort zone nudge, repeat mastery, first session welcome, sloppy run warning
- Insights displayed in completion card (positive signals first, gentle nudges last)

### Fatigue Detection
- FatigueDetector analyzes sitting-based performance using 30-minute gap boundaries
- Three levels: Fresh / Warming / Fatigued based on session count, accuracy drop, WPM drop
- Gentle break suggestions shown as a banner in the completion card (never pushy)

### Practice Structure
- Repeat button: replay the same snippet with XP diminishing returns and repeat counter
- Focused Practice: targets top weakness category with +5 snippet selection boost
- Session grouping: sessions in a sitting share a GroupId with batch stats (3+ sessions)
- SessionMetadata record tracks intent, focus category, group, and repeat number per session

### Learned Preferences
- PersonalDefaults passively learns preferred language, font size, and keyboard theme
- Learns from usage patterns every 5 sessions; applies silently on fresh state

### Persistence
- Schema v5: DifficultyMemory and PersonalDefaults added to PersistedState
- SchemaMigrator extracted to Core for testability (v1 through v5 migration chain)
- Full backward compatibility: old state.json files migrate cleanly

### Testing
- 115 total tests (up from 62 in v0.2.0)
- TrendEngine tests (9): trends, language filter, noise filter, group filter
- DifficultyMemory tests (10): comfort zone, suggestions, yo-yo detection
- InsightEngine tests (10): all 8 rules + max cap + null safety
- FatigueDetector tests (10): all three levels, sitting boundary, accuracy/WPM drop
- SchemaMigrator tests (6): full migration chain, idempotency, data preservation
- SnippetSelector tests (4 new): suggested difficulty, +/-1 clamping

## 0.2.0 — Mastery, Feedback & Trust

### Mistake Intelligence
- Per-character mistake tracking with position-level deduplication
- Symbol category classifier (10 categories: CurlyBraces, Parentheses, Operators, etc.)
- Cross-session MistakeProfile aggregates weakness data across all sessions
- MistakeAggregator with TopWeakCategories ranking (excludes Alphanumeric/Whitespace)

### Adaptive Learning
- Snippet selection now boosts weight for snippets containing the player's weak symbol categories
- Up to +3 weight boost per distinct weak category found in snippet code
- XP diminishing returns for repeated snippets: decay formula 1/(1+0.3*repeats)
- Sloppy penalty: accuracy below 70% halves XP earned
- Completion bonus also subject to diminishing returns

### Hardcore Mode
- Error-lock mode: can't advance past an incorrect character until corrected
- Implemented as typed-string clamping in TypingSession (Core-level, not UI-level)
- Toggle in sidebar Settings panel

### Visual Feedback
- Caret indicator: next character to type highlighted with blue (Accent2) background
- Auto-scroll: prompt ScrollViewer keeps caret visible as user types through long snippets
- Per-session weak spots shown in completion card (top 3 categories with error counts)
- Overall weakness ranking displayed in sidebar (cumulative cross-session data)

### Persistence
- Schema v4: MistakeProfile added to PersistedState
- v3 to v4 migration in JsonFileStorage
- Result record extended with Difficulty and Mistakes fields

### Testing
- 62 total tests (up from 22 in v0.1.0)
- XpEngine tests (6): diminishing returns, sloppy penalty, CountRecentPlays
- TypingSession tests (9 new): mistake tracking, deduplication, hardcore mode
- SymbolClassifier tests (6): Theory-based char classification
- MistakeAggregator tests (4): aggregation, TopWeakCategories, MistakeProfile
- SnippetSelector tests (6 new): WeaknessBoost, adaptive selection, null safety

## 0.1.1

### Audio System
- Real audio playback via MiniAudioExNET (miniaudio backend, MIT licensed)
- 5 keyboard sound themes: AlpsCream, Mechanical, Membrane, SoftTouch, Topre (8 variations each)
- 4 ambient soundscape categories: Ocean (3), Rain (3), Wind (2), Zen (7) — 15 tracks total
- Polyphonic key SFX with PlayOneShot (pool of 8 concurrent sounds)
- Looping ambient with mute (volume = 0, preserves position)
- Random button shuffles ambient track across all soundscapes (syncs dropdown)
- Filesystem-based discovery: drop a folder, rebuild, done

### UI Controls
- Keyboard Sound dropdown (auto-populated from sfx/ subdirectories)
- Soundscape dropdown (auto-populated from ambient/ subdirectories)
- Per-channel volume sliders: Key, Ambient, UI (0-100%)
- Random button + Mute checkbox for ambient control
- Sidebar renamed to "Settings" with Audio section

### Bug Fixes
- Fix CaptureSettings() not persisting audio settings (AmbientMuted, volumes, etc.)
- Fix CaptureSettings() losing HighContrast, NormalizeLineEndings, IgnoreTrailingSpaces, StrictWhitespace on save
- Pass through non-UI settings from persisted state to prevent silent data loss

### Persistence
- Schema migration v2 to v3 (KeyboardSoundTheme, SelectedSoundscape added)
- Audio theme + soundscape selection persisted between sessions

### Infrastructure
- Add JAJ.Packages.MiniAudioEx v3.0.0 (native libs for linux-x64, win-x64, osx-arm64)
- SoundDiscoveryService for filesystem scanning
- AudioContext.Update() on 10ms DispatcherTimer
- Try/catch audio init with StubAudioService fallback
- Audio docs: architecture guide, cross-platform roadmap, test checklist

## 0.1.0

### Core Engine
- Per-character comparison with configurable preprocessing
- Line-ending normalization (default on)
- Whitespace rules: IgnoreTrailingSpaces, StrictWhitespace
- Result model with timestamp, language, snippet ID, WPM, accuracy, errors, XP
- Elo-inspired per-language rating adjustment (K=32)
- Level-based difficulty ramp (wider upward window at higher levels)
- Weighted snippet selection with deterministic seed support
- 22 unit tests (TypingSession, RatingEngine, SnippetSelector)

### UI & Feedback
- Per-character prompt feedback: correct (teal), errors (red + underline), untyped (muted)
- Completion card with WPM, accuracy, errors, XP, and snippet explanations
- "Next" button to advance (no auto-advance)
- Recent results history (last 5 in stats panel)
- Dynamic language discovery from assets/snippets/*.json
- Focus management: auto-focus on startup, New Test, Reset, sidebar close
- Font size slider (12-24) affects prompt and input

### Accessibility
- Keyboard-first UX with visible focus outlines
- Reduced sensory mode (caps audio volumes at 0.3)
- High-contrast dark theme (Brand.axaml)

### Persistence
- Profile (level, XP, per-language ratings) persisted to ~/.config/linux-dev-typer/state.json
- Settings (language, font size, sidebar, whitespace rules) persisted
- Recent results (last 50) persisted with schema migration (v1 to v2)

### Audio
- IAudioService interface defined (PlayKeyClick, PlayUiClick, ambient controls)
- StubAudioService (no-op) wired as placeholder; backend TBD for Linux

### Infrastructure
- .editorconfig with LF line endings
- CI workflow: build + test on ubuntu-latest
- xUnit test project in solution

## 0.0.1

- Initial Avalonia starter (Core + App)
- Exact-match typing session + basic XP leveling
- Collapsible right settings sidebar
- Snippet packs under assets/snippets
