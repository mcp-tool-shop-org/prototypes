<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/Trace/readme.png" alt="Trace" width="400"></p>

<p align="center"><strong>Deterministic cursor discipline game — precision, control, and composure under chaos.</strong></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://dotnet.microsoft.com/"><img src="https://img.shields.io/badge/.NET-10-purple.svg" alt=".NET 10"></a>
  <a href="https://mcp-tool-shop-org.github.io/Trace/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

Built on .NET 10 MAUI (Windows-first), with a fully deterministic fixed-timestep simulation, a five-state motion state machine, and a parametric visual identity driven entirely by simulation state.

Trace is not an aim trainer. Trace is not an arcade game. Mastery looks calm.

---

## Architecture

Four-module modular monolith. No cycles, no platform leakage into libraries.

```
MouseTrainer.Domain        --> (nothing)          Shared primitives, RNG, run identity, motion states
MouseTrainer.Simulation    --> Domain             Deterministic loop, modes, mutators, replay system
MouseTrainer.Audio         --> Domain             Cue system, asset verification
MouseTrainer.MauiHost      --> all three          Composition root, MAUI platform host, renderer
```

See [`docs/modular.manifesto.md`](docs/modular.manifesto.md) for the full dependency graph and constitutional rules.

---

## Motion State Machine

Trace inhabits exactly one of five motion states every frame:

| State | Identity | Visual |
|-------|----------|--------|
| **Alignment** | Neutral, stable, calm | Baseline cyan, minimal glow |
| **Commitment** | Decisive acceleration | Slight forward tint, warm edge |
| **Resistance** | Counterforce lean | Amber-shifted edge, increased glow |
| **Correction** | Micro-adjustments | Edge brightening, high precision |
| **Recovery** | Brief recoil | Desaturation fade (150ms) |

Transitions are enforced by a compile-time transition table. Forbidden transitions return null.

```
Main loop:     Alignment → Commitment → Resistance → Correction → Alignment
Recovery loop: Alignment → Recovery → Alignment
```

See [`docs/motion-state-machine.md`](docs/motion-state-machine.md) for the full FSM with entry/exit conditions.

---

## Chaos Archetypes (5 Villains)

| Archetype | Verb | Counter-Skill | Behavior |
|-----------|------|---------------|----------|
| **Red Orbs** | disrupt | Anticipation | Drift within region, bounce at bounds |
| **Crushers** | constrain | Commitment | Fixed cycle: inactive → telegraph → active |
| **Drift Fields** | destabilize | Grip stability | Constant directional force |
| **Flickers** | mislead | Filtering | Flash → afterimage → invisible |
| **Locks** | restrict | Adaptability | Axis/speed constraints with telegraph |

Chaos never reacts to Trace. Chaos is deterministic, indifferent, mechanical.

See [`docs/chaos-behavior-state-machines.md`](docs/chaos-behavior-state-machines.md) and [`docs/interaction-rendering-canon.md`](docs/interaction-rendering-canon.md).

---

## Rendering

Trace's rendering is a pure function of state. No animation timelines, no sprite sheets.

```
VisualState = RenderProfile[MotionState]
```

Color-by-state drives everything: fill, edge, glow strength, directional bias, desaturation. The renderer expresses Trace's identity with zero animation assets.

See [`docs/renderer-integration-trace.md`](docs/renderer-integration-trace.md) and [`docs/visual-style-guide.md`](docs/visual-style-guide.md).

---

## Engine Heritage

Forked from [DeterministicMouseTrainingEngine](https://github.com/mcp-tool-shop-org/DeterministicMouseTrainingEngine). Core systems:

- `IGameSimulation` — pluggable game mode interface (2 methods)
- `DeterministicLoop` — 60Hz fixed timestep + alpha interpolation
- `DeterministicRng` — xorshift32, seed-reproducible
- `GameEvent` pipeline — typed event stream
- Replay system — MTR v1 binary format, FNV-1a verification
- Mutator composition — `LevelBlueprint` pure-function transforms
- Virtual coordinate space — 1920×1080, letterbox scaling

---

## Project Structure

```
src/
  MouseTrainer.Domain/          Leaf module — events, input, runs, RNG, motion states
    Events/                     GameEvent, GameEventType
    Input/                      PointerInput
    Motion/                     MotionState, MotionTrigger, MotionTransitionTable
    Runs/                       RunDescriptor, RunId, MutatorId/Spec/Param, ModeId, DifficultyTier
    Scoring/                    ScoreComponentId
    Utility/                    DeterministicRng (xorshift32), Fnv1a, Leb128

  MouseTrainer.Simulation/      Deterministic simulation engine
    Core/                       DeterministicLoop, FrameResult, IGameSimulation
    Debug/                      ISimDebugOverlay
    Levels/                     LevelBlueprint, ILevelGenerator, LevelGeneratorRegistry
    Modes/ReflexGates/          Gate, ReflexGateSimulation, ReflexGateGenerator, ReflexGateConfig
    Mutators/                   IBlueprintMutator, MutatorPipeline, MutatorRegistry, 6 mutators
    Replay/                     ReplayRecorder, ReplaySerializer, InputTrace, ReplayVerifier
    Session/                    SessionController, ScoreBreakdown, SessionModels

  MouseTrainer.Audio/           Audio cue system
    Assets/                     AssetManifest, AssetVerifier, IAssetOpener
    Core/                       AudioDirector, AudioCue, AudioCueMap, IAudioSink

  MouseTrainer.MauiHost/        MAUI composition root (Windows)
                                GameRenderer, NeonPalette, TrailBuffer, ParticleSystem,
                                MotionAnalyzer, ScreenShake, GhostPlayback, SessionStore

tests/
  MouseTrainer.Tests/           348 tests across 12 categories
    Architecture/               Dependency boundary enforcement
    Determinism/                Replay regression, RNG, gate generation, session controller
    Levels/                     Generator extraction
    Mutators/                   Blueprint mutator correctness + composition
    Persistence/                Session store
    Replay/                     Serializer, recorder, verifier, quantization, event hashing
    Runs/                       RunDescriptor golden hashes, MutatorSpec identity
    Scoring/                    Score breakdown
    Utility/                    Leb128 encoding
    MotionAnalyzerTests.cs      Motion analysis from pointer input
    MotionStateTests.cs         State machine transitions + forbidden paths
    VersionTests.cs             Assembly version consistency

docs/                           19 design documents (see Design Canon below)
```

---

## Design Canon

| Document | Purpose |
|----------|---------|
| [`product-boundary.md`](docs/product-boundary.md) | What Trace is, what it isn't, who it's for |
| [`tone-bible.md`](docs/tone-bible.md) | Voice, UI, animation, and feedback tone rules |
| [`motion-language-spec.md`](docs/motion-language-spec.md) | Movement grammar, path language, force responses |
| [`motion-state-machine.md`](docs/motion-state-machine.md) | 5-state FSM with transitions and forbidden paths |
| [`visual-style-guide.md`](docs/visual-style-guide.md) | Trace form, color-by-state, world identity |
| [`renderer-integration-trace.md`](docs/renderer-integration-trace.md) | RenderProfile, ForceVector, StabilityScalar, glow/bias/desaturation |
| [`villains-and-trace-skills.md`](docs/villains-and-trace-skills.md) | 5 archetypes, 5 skills, consistency contract |
| [`chaos-entity-animation-bible.md`](docs/chaos-entity-animation-bible.md) | Per-archetype motion and animation specs |
| [`chaos-behavior-state-machines.md`](docs/chaos-behavior-state-machines.md) | Per-archetype FSMs (enum + transition ready) |
| [`renderer-integration-chaos.md`](docs/renderer-integration-chaos.md) | ChaosRenderProfile, per-archetype draw specs |
| [`interaction-rendering-canon.md`](docs/interaction-rendering-canon.md) | Trace-vs-Chaos interaction contract |
| [`sound-design-bible.md`](docs/sound-design-bible.md) | Audio metaphysics, Trace/Chaos sound identity, mastery = silence |
| [`procedural-audio-parameter-map.md`](docs/procedural-audio-parameter-map.md) | Simulation → audio parameter wiring |
| [`audio-engine-architecture.md`](docs/audio-engine-architecture.md) | DSP components, data flow, master bus |
| [`soundscape-moodboard.md`](docs/soundscape-moodboard.md) | Sensory guide to the world's sonic identity |
| [**`soundscape-canon.md`**](docs/soundscape-canon.md) | **Unified audio canon (consolidates all 4 audio docs)** |
| [`sandbox-drift-field-v1.md`](docs/sandbox-drift-field-v1.md) | First villain proof (DriftDelivery_B1) |
| [`modular.manifesto.md`](docs/modular.manifesto.md) | Dependency graph + constitutional rules |
| [`MAUI_AssetOpener_Snippet.md`](docs/MAUI_AssetOpener_Snippet.md) | Platform asset wiring snippet |

---

## Build & Test

```bash
# Build simulation library (0 warnings, TreatWarningsAsErrors)
dotnet build src/MouseTrainer.Simulation/

# Run all 348 tests
dotnet test tests/MouseTrainer.Tests/

# Run MAUI host (Windows — use Visual Studio, set startup to MauiHost)
```

---

## Key Design Principles

- **Determinism is constitutional.** Same seed → same simulation → same score, always. No `DateTime.Now`, no `Random`, no platform-dependent floats in the hot path.
- **Rendering is a pure function of state.** No animation timelines. MotionState + ForceVector + StabilityScalar → visual output.
- **Chaos is indifferent.** Obstacles never react to the player. They are systems, not enemies.
- **Mastery looks calm.** If high-skill play looks frantic, the system is lying.
- **Modular monolith.** Four assemblies with enforced one-way dependencies. Domain is the leaf; MauiHost is the only composition root.
- **Warnings are errors.** Library projects use `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`.

---

## Security & Data Scope

| Aspect | Detail |
|--------|--------|
| **Data touched** | Game state (in-memory), high scores (local only), simulation parameters |
| **Data NOT touched** | No telemetry, no analytics, no network calls, no cloud sync, no credentials |
| **Permissions** | Input: mouse/keyboard. Display: GPU rendering. No filesystem writes except user settings |
| **Network** | None — fully offline application |
| **Telemetry** | None collected or sent |

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10 |
| B. Error Handling | 10 |
| C. Operator Docs | 10 |
| D. Shipping Hygiene | 10 |
| E. Identity (soft) | 10 |
| **Overall** | **50/50** |

> Full audit: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## License

[MIT](LICENSE)

> Built by [MCP Tool Shop](https://mcp-tool-shop.github.io/)
