---
title: Beginners
description: New to DMTE? Start here for a guided introduction.
sidebar:
  order: 99
---

New to the Deterministic Mouse Training Engine? This page walks you through what DMTE is, how to get it running, and what to explore first.

## 1. What is DMTE?

DMTE is a mouse precision trainer that runs as a Windows desktop application. You guide your cursor through a scrolling corridor of oscillating gates, earning points for accuracy. The twist: every run is fully deterministic. Given the same seed and settings, the level layout, gate positions, oscillation patterns, and scoring are identical every time on every machine. This makes DMTE useful for benchmarking mouse skill, comparing runs across machines, and verifying replay integrity.

The engine is built on .NET 10 MAUI and runs at a fixed 60Hz simulation tick rate. There are no network calls, no telemetry, and no cloud dependencies.

## 2. Prerequisites

Before you begin, make sure you have:

- **.NET 10 SDK** installed ([download from Microsoft](https://dotnet.microsoft.com/download))
- **Windows 10** (build 19041 or later) or **Windows 11**
- **Visual Studio 2022+** recommended for running the MAUI host project (VS Code works for the library projects)

Verify your .NET installation:

```bash
dotnet --version
```

## 3. Building and running

Clone the repository and build the simulation library:

```bash
git clone https://github.com/mcp-tool-shop-org/DeterministicMouseTrainingEngine.git
cd DeterministicMouseTrainingEngine
dotnet build src/MouseTrainer.Simulation/
```

The library projects enforce `TreatWarningsAsErrors`, so a clean build means zero issues.

To run the full test suite (296 tests):

```bash
dotnet test tests/MouseTrainer.Tests/
```

To launch the game, open the solution (`MouseTrainer.Deterministic.sln`) in Visual Studio, set `MouseTrainer.MauiHost` as the startup project, and press F5.

## 4. How the game works

In the default **ReflexGates** mode, a virtual 1920x1080 playfield scrolls horizontally at 70 pixels per second. Twelve gates are spaced along the corridor, each with an oscillating aperture (the gap you must pass through). Early gates oscillate gently; later gates move faster with narrower gaps.

When the scroll reaches a gate:
- **Pass** — your cursor is inside the aperture. Score is interpolated from 100 (dead center) to 50 (edge). Your combo streak increases.
- **Miss** — your cursor is outside. Combo resets to zero. No points.

Every 3 consecutive passes trigger a **ComboUp** event. After all 12 gates, the level completes and your final result (score, max combo, elapsed time, per-gate breakdown) is recorded.

## 5. Key concepts

### Determinism

The simulation uses a seeded `xorshift32` RNG and avoids all sources of non-determinism (`DateTime.Now`, `System.Random`, platform-dependent floats). The `DeterministicLoop` advances the simulation in fixed timesteps only, accumulating host time and stepping in 1/60th-second increments. This guarantees that the same seed produces identical gate layouts and oscillation patterns on any machine.

### Run identity

Every run is described by a `RunDescriptor` containing the mode, seed, difficulty, generator version, ruleset version, and mutator pipeline. All of these fields are hashed together using FNV-1a 64-bit to produce a `RunId`. Two runs with the same descriptor will always have the same `RunId`, regardless of platform.

### Blueprint mutators

Before a level begins, the generated gate layout (a `LevelBlueprint`) can be transformed by a pipeline of mutators. Mutators are pure functions that reshape the blueprint. For example, `NarrowMargin` shrinks all apertures, while `RhythmLock` quantizes oscillation phases into rhythmic patterns. The mutator parameters are frozen into the `RunId` hash, so changing any parameter changes the run identity.

### Replay verification

DMTE records quantized cursor input every tick. At session end, the `ReplayRecorder` produces a `ReplayEnvelope` containing the input trace and a verification hash. The `ReplayVerifier` can replay the envelope through a fresh simulation and confirm that score, combo, and event stream hash all match. If they diverge, the replay is invalid.

## 6. Project layout

The codebase is a four-module modular monolith:

| Module | Depends on | Role |
|--------|-----------|------|
| **MouseTrainer.Domain** | nothing | Shared primitives: events, input, runs, scoring, RNG, hashing |
| **MouseTrainer.Simulation** | Domain | Deterministic loop, game modes, mutators, replay, session |
| **MouseTrainer.Audio** | Domain | Audio cue system and asset verification |
| **MouseTrainer.MauiHost** | all three | MAUI composition root — wires everything together for Windows |

Domain is the leaf module with zero dependencies. MauiHost is the only composition root. Simulation and Audio depend on Domain but never on each other. Architecture tests enforce these boundaries at build time.

## 7. Next steps

- **Explore mutators** — Read the [Blueprint Mutators](/DeterministicMouseTrainingEngine/handbook/mutators/) page and experiment with combining NarrowMargin + DifficultyCurve for a punishing late-game ramp.
- **Read the architecture** — The [Architecture](/DeterministicMouseTrainingEngine/handbook/architecture/) page covers the modular monolith design and the constitutional rules that keep dependencies clean.
- **Study the simulation interface** — The [Game Modes](/DeterministicMouseTrainingEngine/handbook/game-modes/) page explains `IGameSimulation` and how to add new modes. The two-method contract (`Reset` + `FixedUpdate`) is the only integration surface.
- **Run the tests** — The 296 tests across six categories serve as living documentation. The determinism tests replay saved runs and verify golden hashes. The architecture tests enforce module boundaries.
- **Read the manifesto** — `docs/modular.manifesto.md` contains the full dependency graph and constitutional rules that govern the codebase.
