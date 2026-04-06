<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/MouseTrainer/readme.png" alt="MouseTrainer logo" width="400"></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/MouseTrainer/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/MouseTrainer/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/.NET-10-512BD4" alt=".NET 10">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/MouseTrainer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Deterministic mouse dexterity trainer -- precision, control, and flow.**

Built on .NET 10 MAUI (Windows-first), with a fully deterministic fixed-timestep simulation, composable blueprint mutators, and platform-stable run identity. Same seed produces the same level, the same score, and the same replay -- everywhere, every time.

---

## Why MouseTrainer?

- **Deterministic to the bit.** xorshift32 RNG, FNV-1a 64-bit hashing, fixed 60 Hz timestep with accumulator catch-up. No `DateTime.Now`, no `System.Random`, no platform-dependent floats in the hot path.
- **Composable difficulty.** Six blueprint mutators reshape generated levels before play. Stack them, tune their parameters, and the combination is frozen into the `RunId` hash for perfect reproducibility.
- **Replay verification.** Every session records quantized input samples, serialized in a compact binary format (`.mtr`). Replay verification re-simulates tick-by-tick and checks the event stream hash, score, and combo against the original.
- **Modular monolith.** Four assemblies with enforced one-way dependencies. Domain is the leaf with zero dependencies; MauiHost is the only composition root. No cycles, no platform leakage into libraries.
- **Protocol-grade identity.** `RunId` is an FNV-1a 64-bit hash over mode + seed + difficulty + mutator specs with canonically sorted parameters. Once created, frozen forever.

---

## NuGet Packages

| Package | Description |
|---|---|
| **MouseTrainer.Domain** | Deterministic xorshift32 RNG, FNV-1a 64-bit hashing, LEB128 varint encoding, game event system, and run identity primitives. Zero dependencies. |
| **MouseTrainer.Simulation** | Fixed 60 Hz deterministic game loop with accumulator, composable blueprint mutators, level generation pipeline, replay recording/verification, and session management. Depends on Domain. |
| **MouseTrainer.Audio** | Event-driven audio cue system with deterministic volume/pitch jitter via xorshift32, rate limiting, asset manifest verification, and one-shot or looped playback. Depends on Domain. |

---

## Installation

### From NuGet

```bash
# Core primitives (RNG, hashing, run identity)
dotnet add package MouseTrainer.Domain

# Simulation engine (game loop, modes, mutators, replay)
dotnet add package MouseTrainer.Simulation

# Audio cue system (event-driven sound)
dotnet add package MouseTrainer.Audio
```

### From Source

```bash
git clone https://github.com/mcp-tool-shop-org/MouseTrainer.git
cd MouseTrainer

# Build all library projects
dotnet build src/MouseTrainer.Domain/
dotnet build src/MouseTrainer.Simulation/
dotnet build src/MouseTrainer.Audio/

# Run all tests (305 tests across 11 categories)
dotnet test tests/MouseTrainer.Tests/

# Run MAUI host (Windows -- use Visual Studio, set startup to MauiHost)
```

> **Note:** The MAUI host project requires Visual Studio with the .NET MAUI workload installed. CLI `dotnet build` may fail on MauiHost due to MrtCore PRI generation targets -- use Visual Studio for full builds.

---

## Quick Start

```csharp
using MouseTrainer.Domain.Runs;
using MouseTrainer.Domain.Utility;
using MouseTrainer.Simulation.Core;
using MouseTrainer.Simulation.Modes.ReflexGates;
using MouseTrainer.Simulation.Mutators;
using MouseTrainer.Simulation.Levels;

// 1. Create a run descriptor (deterministic identity)
var run = RunDescriptor.Create(
    mode: new ModeId("ReflexGates"),
    seed: 42,
    difficulty: DifficultyTier.Standard);

// 2. Generate a level blueprint from the seed
var config = new ReflexGateConfig();
var generator = new ReflexGateGenerator(config);
var blueprint = generator.Generate(run.Seed);

// 3. Optionally reshape the level with composable mutators
var registry = new MutatorRegistry();
registry.Register(new MutatorId("NarrowMargin"), 1, spec => new NarrowMarginMutator(spec));
registry.Register(new MutatorId("RhythmLock"), 1, spec => new RhythmLockMutator(spec));

var pipeline = new MutatorPipeline(registry);
var specs = new[]
{
    MutatorSpec.Create(new MutatorId("NarrowMargin"), 1,
        new[] { new MutatorParam("factor", 0.7f) }),
    MutatorSpec.Create(new MutatorId("RhythmLock"), 1,
        new[] { new MutatorParam("div", 4f) }),
};
blueprint = pipeline.Apply(blueprint, specs);

// 4. Wire up the simulation and deterministic loop
var sim = new ReflexGateSimulation(config);
sim.Reset(blueprint);

var loop = new DeterministicLoop(sim, new DeterministicConfig
{
    FixedHz = 60,
    SessionSeed = run.Seed,
});

// 5. Each frame: step the loop with host time and pointer input
// var result = loop.Step(pointerInput, hostNowTicks, ticksPerSecond);
// result.Events contains GameEvent[] for audio, scoring, and UI
```

---

## Game Modes

### ReflexGates

Side-scrolling gate challenge. Oscillating apertures on vertical walls -- navigate the cursor through each gate before the scroll catches you. Deterministic seed produces an identical level every time.

| Property | Value |
|---|---|
| Playfield | 1920 x 1080 virtual pixels |
| Gate count | 12 (default) |
| Scroll speed | 70 px/s (~83 seconds per clean run) |
| Scoring | 100 pts (center) to 50 pts (edge), combo every 3 gates |
| Oscillation | Per-gate amplitude ramp (40--350 px) and frequency ramp (0.15--1.2 Hz) |
| RNG | xorshift32 seeded per run for platform-stable generation |
| Identity | FNV-1a 64-bit hash of mode + seed + mutators = same `RunId` everywhere |

---

## Blueprint Mutators

Six composable transforms that reshape generated levels before play. Applied as an ordered fold over `LevelBlueprint`:

| Mutator | Key Params | Effect |
|---|---|---|
| **NarrowMargin** | `factor` in [0.1, 1.0] | Scales aperture heights down -- tighter gaps |
| **WideMargin** | `factor` in [1.0, 3.0] | Scales aperture heights up -- more forgiving |
| **DifficultyCurve** | `curve` in [-2.0, 2.0] | Power-curve re-interpolation of difficulty by gate index |
| **RhythmLock** | `div` in {2, 3, 4, 6, 8} | Quantizes gate phases to N divisions -- rhythmic patterns |
| **GateJitter** | `str` in [0, 1] | Deterministic vertical offset via sin(WallX, Phase) -- spatial perturbation |
| **SegmentBias** | `seg`, `amt`, `shape` | Divides gates into acts with per-segment difficulty bias |

Mutators are pure functions: `LevelBlueprint -> LevelBlueprint`. They compose via pipeline (`specs.Aggregate`), are factory-resolved from `MutatorRegistry`, and their parameters are frozen into the `RunId` hash for reproducibility.

### SegmentBias Shapes

- **Crescendo** (shape=0): Easy start, hard finish. `d = 2t - 1`
- **Valley** (shape=1): Hard middle, easy ends. `d = 8t(1-t) - 1`
- **Wave** (shape=2): Alternating easy/hard segments. `d = (-1)^k`

### DifficultyCurve Exponent

The `curve` parameter maps to a power exponent via `pow(2, curve)`. Positive values back-load difficulty (easier early, harder late). Negative values front-load it. Zero is identity (no change).

---

## Replay System

Every session can be recorded and verified for anti-cheat and leaderboard integrity.

| Component | Role |
|---|---|
| `ReplayRecorder` | Captures per-tick quantized input samples during live play |
| `InputTrace` | Run-length encoded input stream for compact storage |
| `ReplaySerializer` | Binary `.mtr` format: magic header, LEB128 varints, FNV-1a checksum |
| `ReplayVerifier` | Re-simulates tick-by-tick; verifies event hash + score + combo match |
| `EventStreamHasher` | Rolling FNV-1a hash over the simulation event stream |

Wire format: `[MTRP magic][Header][RunDescriptor section][InputTrace section][Verification][Checksum]`

---

## Audio System

Event-driven audio with deterministic cue selection. The `AudioDirector` maps simulation events to sound effects with bounded variation -- all deterministic via `DeterministicRng.Mix()`.

| Feature | Detail |
|---|---|
| Cue selection | Deterministic choice among candidate assets per event type |
| Volume | `0.6 + 0.4 * intensity`, clamped to [0, 1] |
| Pitch jitter | [0.97, 1.03] via xorshift32, clamped to [0.9, 1.1] |
| Rate limiting | HitWall events throttled to once every 6 ticks (~100 ms at 60 Hz) |
| Playback modes | One-shot (hits, gates, combos) and looped (drag, ambient) |
| Asset verification | `AssetVerifier` checks all 13 required audio files at startup |

---

## Architecture

Four-module modular monolith. No cycles, no platform leakage into libraries.

```
MouseTrainer.Domain        --> (nothing)          Shared primitives, RNG, run identity
MouseTrainer.Simulation    --> Domain             Deterministic loop, modes, mutators, levels, replay
MouseTrainer.Audio         --> Domain             Cue system, asset verification
MouseTrainer.MauiHost      --> all three          Composition root, MAUI platform host
```

### Prohibited References (Constitutional)

- `Audio` must never reference `Simulation`
- `Simulation` must never reference `Audio`
- `Domain` must never reference any sibling module
- No library module may reference `Microsoft.Maui.*` or any platform SDK
- No mode may cross-reference another mode
- Mutators operate on `LevelBlueprint` only -- never mode internals

See [`docs/modular.manifesto.md`](docs/modular.manifesto.md) for the full dependency graph and constitutional rules.

---

## Design Principles

- **Determinism is constitutional.** Same seed produces the same simulation produces the same score, always. No `DateTime.Now`, no `Random`, no platform-dependent floats in the hot path.
- **Fixed-timestep simulation.** 60 Hz with accumulator-based catch-up. Rendering interpolates between ticks via alpha. Simulation time is derived from tick count (`tick * dt`), not wall clock, to avoid float drift.
- **Protocol-grade identity.** `MutatorId`, `ModeId`, `RunId` are permanent -- once created, frozen forever. FNV-1a hashing with canonical parameter serialization ensures the same inputs always produce the same identity.
- **Modular monolith, not microservices.** Four assemblies with enforced one-way dependencies. Domain is the leaf; MauiHost is the only composition root.
- **Warnings are errors.** Library projects use `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`. MAUI host opts out (SDK-generated warnings). Nullable reference types enabled everywhere.
- **Purity in mutators.** Blueprint mutators are pure functions with no RNG access, no side effects, and no references to mode-specific types. They read only their parameters and the input blueprint.

---

## Project Structure

```
src/
  Directory.Build.props         Shared build settings (nullable, warnings-as-errors, analysis level)

  MouseTrainer.Domain/          Leaf module -- events, input, runs, RNG
    Events/                     GameEvent, GameEventType
    Input/                      PointerInput
    Runs/                       RunDescriptor, RunId, MutatorId/Spec/Param, ModeId, DifficultyTier
    Utility/                    DeterministicRng (xorshift32), Fnv1a (64-bit), Leb128 (varint)

  MouseTrainer.Simulation/      Deterministic simulation engine
    Core/                       DeterministicLoop, DeterministicConfig, FrameResult, IGameSimulation
    Debug/                      ISimDebugOverlay
    Levels/                     LevelBlueprint, ILevelGenerator, LevelGeneratorRegistry
    Modes/ReflexGates/          Gate, ReflexGateSimulation, ReflexGateGenerator, ReflexGateConfig
    Mutators/                   IBlueprintMutator, MutatorPipeline, MutatorRegistry, 6 mutators
    Replay/                     ReplayRecorder, ReplayVerifier, ReplaySerializer, InputTrace, EventStreamHasher
    Session/                    SessionController, SessionModels, ScoreBreakdown

  MouseTrainer.Audio/           Audio cue system
    Assets/                     AssetManifest (13 required files), AssetVerifier, IAssetOpener
    Core/                       AudioDirector, AudioCue, AudioCueMap, IAudioSink

  MouseTrainer.MauiHost/        MAUI composition root (Windows)
    GameRenderer.cs             MAUI canvas rendering with neon palette
    GhostPlayback.cs            Replay ghost overlay
    ParticleSystem.cs           Hit/miss particle effects
    ScreenShake.cs              Camera shake on wall hits
    TrailBuffer.cs              Cursor trail rendering
    SessionStore.cs             Local session persistence
    NeonPalette.cs              Color theme

tests/
  MouseTrainer.Tests/           305 tests across 11 categories
    Architecture/               Dependency boundary enforcement
    Determinism/                Replay regression, RNG, session controller
    Infrastructure/             Build and project structure validation
    Levels/                     Generator extraction
    Mutators/                   Blueprint mutator correctness + composition
    Persistence/                Session store
    Replay/                     Serializer, recorder, verifier, quantization, event stream hasher, input trace
    Runs/                       RunDescriptor golden hashes + identity
    Scoring/                    Score breakdown
    Utility/                    LEB128 encoding

tools/
  MouseTrainer.AudioGen/        Audio asset generation tooling

docs/
  modular.manifesto.md          Dependency graph + constitutional rules
  product-boundary.md           Product scope and boundary definition
  MAUI_AssetOpener_Snippet.md   Platform asset wiring snippet
```

---

## Security & Data Scope

| Aspect | Detail |
|--------|--------|
| **Data touched** | Local replay files (`.mtr`). User settings in app data directory. Bundled audio assets |
| **Data NOT touched** | No network. No telemetry. No analytics. No cloud sync. No user accounts |
| **Permissions** | Read/write: local app data directory only |
| **Network** | None — fully offline desktop application |
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
