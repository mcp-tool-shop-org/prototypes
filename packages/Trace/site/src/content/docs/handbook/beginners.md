---
title: Beginners
description: New to Trace? Start here for a complete introduction.
sidebar:
  order: 99
---

Trace is a deterministic cursor discipline game built on .NET 10 MAUI (Windows-first). You guide a cursor through chaos — five types of obstacles that test precision, commitment, filtering, grip stability, and adaptability. This page covers everything a newcomer needs to get oriented.

## What is Trace?

Trace is not an aim trainer and not an arcade game. It is a cursor discipline game where mastery looks calm, not frantic. You control a cursor through a simulation space filled with deterministic chaos obstacles. Every run with the same seed produces the exact same obstacle patterns, so improvement comes from reading systems and building composure under pressure.

The core game mode, Reflex Gates, presents an auto-scrolling corridor with oscillating gate apertures. Gates narrow and speed up as difficulty increases. Your score depends on how close to center you pass through each gate, and consecutive passes build a combo streak.

## Prerequisites

To build and run Trace, you need:

- **.NET 10 SDK** — download from [dotnet.microsoft.com](https://dotnet.microsoft.com/)
- **Visual Studio 2022** (17.x or later) with the .NET MAUI workload installed
- **Windows 10/11** — the MAUI host targets Windows first
- **GPU** — any DirectX-capable GPU for rendering (no heavy requirements)

No network connection, cloud account, or external service is needed. Trace runs fully offline.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/mcp-tool-shop-org/Trace.git
   cd Trace
   ```

2. Build the simulation library (zero warnings enforced):

   ```bash
   dotnet build src/MouseTrainer.Simulation/
   ```

3. Run all tests to verify your environment:

   ```bash
   dotnet test tests/MouseTrainer.Tests/
   ```

4. Open `MouseTrainer.Deterministic.sln` in Visual Studio, set the startup project to `MouseTrainer.MauiHost`, and press F5.

## Configuration

Trace's simulation is configured through `DeterministicConfig`:

| Setting | Default | Purpose |
|---------|---------|---------|
| `FixedHz` | 60 | Fixed timestep frequency (ticks per second) |
| `MaxStepsPerFrame` | 5 | Maximum simulation steps per render frame (prevents spiral of death) |
| `SessionSeed` | `0xC0FFEE` | Starting RNG seed — change this for different obstacle layouts |

The Reflex Gates mode has its own `ReflexGateConfig` controlling gate count, spacing, aperture sizes, scroll speed, oscillation parameters, and scoring thresholds. All values are deterministic — the same config and seed always produce the same run.

## Architecture overview

Trace is a four-module modular monolith with enforced one-way dependencies:

```
MouseTrainer.Domain        → (nothing)     # Leaf: events, input, motion states, RNG
MouseTrainer.Simulation    → Domain         # Engine: loop, modes, mutators, replay
MouseTrainer.Audio         → Domain         # Cue system, asset verification
MouseTrainer.MauiHost      → all three      # Composition root, MAUI platform host, renderer
```

Domain is the leaf module with zero dependencies. MauiHost is the only composition root — no platform code leaks into the libraries. Architecture boundary tests in CI enforce this structure.

The simulation runs on a deterministic fixed-timestep loop at 60Hz. The host provides real clock time; the `DeterministicLoop` advances the simulation in fixed ticks only, with an alpha value for render interpolation between ticks. All randomness uses `DeterministicRng` (xorshift32), which is seed-reproducible and never touches `System.Random` or `DateTime.Now`.

## Usage guide

When you launch Trace, you enter a virtual 1920x1080 coordinate space with letterbox scaling. Here is how the core systems work:

**Motion states** — Trace inhabits exactly one of five states every frame: Alignment (calm), Commitment (acceleration), Resistance (counterforce), Correction (micro-adjustments), and Recovery (recoil). Transitions follow a strict state machine enforced at compile time.

**Chaos archetypes** — Five obstacle types appear in the simulation. Red Orbs drift and disrupt. Crushers cycle through telegraph and active phases. Drift Fields apply constant directional force. Flickers flash and vanish. Locks restrict axis or speed. Each tests a different player skill, and none of them react to your position.

**Mutators** — Six built-in mutators modify level blueprints through pure-function transforms: DifficultyCurve, GateJitter, NarrowMargin, RhythmLock, SegmentBias, and WideMargin. Mutators compose through the `MutatorPipeline` and never modify their input — they always return a new blueprint.

**Replay system** — Every session can be recorded and replayed in the MTR v1 binary format. Replays include the full `RunDescriptor` (mode, seed, difficulty, mutators), compressed input traces, and FNV-1a verification hashes. This means you can verify that a replay is authentic and matches the score it claims.

**Scoring** — Gate passes score based on center proximity. Consecutive passes build a combo streak. The `SessionController` orchestrates the Ready, Playing, and Results state machine and builds an immutable `SessionResult` with a full `ScoreBreakdown`.

## FAQ

**Is Trace an aim trainer?**
No. Trace tests cursor discipline — composure, reading, and controlled movement under chaos. It is not about flick speed or reaction time.

**Can I run Trace on macOS or Linux?**
Not currently. The MAUI host targets Windows. The simulation and audio libraries are cross-platform .NET, so a non-MAUI host could be built for other platforms, but no official host exists yet.

**What makes it deterministic?**
Three things: a fixed-timestep loop (no frame-rate-dependent physics), a seed-reproducible RNG (xorshift32 instead of `System.Random`), and no use of `DateTime.Now` or platform-dependent floats in the simulation hot path. Same seed and config always produce the same run.

**How do replays work?**
The `ReplayRecorder` captures quantized input samples during a session. The `ReplaySerializer` writes them to a binary `.mtr` file with a FNV-1a checksum. The `ReplayVerifier` can re-simulate the run from the recorded inputs and confirm the event stream hash matches, proving the replay is authentic.

**Where is my data stored?**
Game state lives in memory. High scores persist locally through `SessionStore`. No telemetry, analytics, network calls, or cloud sync exist anywhere in the codebase.

**How do I contribute?**
Fork the repo, make changes, and open a pull request. Run `dotnet test tests/MouseTrainer.Tests/` before submitting — all tests must pass. The project enforces `TreatWarningsAsErrors` on library projects, so no warnings are allowed.
