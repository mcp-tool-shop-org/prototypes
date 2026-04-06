---
title: Beginners
description: First steps for new players and developers.
sidebar:
  order: 99
---

A practical introduction to MouseTrainer for players who want to improve their mouse precision and developers who want to understand or extend the codebase.

## What is MouseTrainer?

MouseTrainer is a deterministic mouse dexterity trainer built on .NET 10 MAUI for Windows. It generates side-scrolling gate challenges where you guide your cursor through oscillating apertures. Every run is fully deterministic: the same seed always produces the same level, the same scoring, and the same replay.

The application is entirely offline with no network access, no telemetry, and no user accounts. Your replay files and settings stay on your local machine.

## System requirements

- **OS**: Windows 10 or Windows 11
- **.NET**: .NET 10 SDK
- **IDE**: Visual Studio with the .NET MAUI workload (required for building the desktop host)
- **Hardware**: Any modern Windows PC with a mouse or trackpad

The library projects (Domain, Simulation, Audio) build with the standard `dotnet` CLI. Only the MauiHost project requires Visual Studio due to platform-specific MAUI build targets.

## Installation

### Play the app

1. Clone the repository: `git clone https://github.com/mcp-tool-shop-org/MouseTrainer.git`
2. Open the solution in Visual Studio
3. Set `MouseTrainer.MauiHost` as the startup project
4. Build and run (F5)

The app opens in sandbox mode. Click anywhere to start.

### Use the libraries

If you want to use the deterministic engine in your own project, install the NuGet packages:

```bash
dotnet add package MouseTrainer.Domain
dotnet add package MouseTrainer.Simulation
dotnet add package MouseTrainer.Audio
```

`MouseTrainer.Domain` is the leaf module with zero dependencies. `MouseTrainer.Simulation` adds the game loop, modes, mutators, and replay. `MouseTrainer.Audio` adds the event-driven sound cue system.

## Your first run

When you launch MouseTrainer, you see a dark neon-themed idle screen with a pulsing "START" prompt.

1. **Click anywhere** to enter sandbox mode. The system cursor hides and a neon cyan cursor appears.
2. **Move your mouse** around the 1920x1080 virtual playfield. A fading trail follows your cursor.
3. The HUD displays your cursor position (bottom-left) and the current simulation tick (bottom-right).

Sandbox mode runs the deterministic loop at 60 Hz but does not load a game level. It demonstrates the rendering pipeline: cursor trail, parallax grid, scanlines, and the neon palette.

To play a full ReflexGates session, you would wire a `ReflexGateSimulation` into the deterministic loop with a seed. The simulation generates 12 gates with increasing oscillation difficulty. Navigate through each gate before the auto-scroll catches you. Center hits award 100 points, edge hits award 50, and every 3 consecutive passes trigger a combo event.

## Key concepts

### Determinism

Every simulation primitive avoids non-deterministic APIs. The RNG is xorshift32, hashing is FNV-1a 64-bit, and the game loop runs at a fixed 60 Hz timestep with accumulator-based catch-up. Simulation time is derived from tick count (`tick * dt`), never from the wall clock. This guarantees identical behavior across machines and sessions.

### RunId

A `RunId` is an FNV-1a 64-bit hash computed from mode name, seed, difficulty tier, generator version, ruleset version, and all mutator specs (including sorted parameters). It serves as a protocol-grade identity: the same inputs always produce the same hash, and different inputs always produce a different hash. Once created, a RunId is frozen forever.

### Blueprint mutators

Mutators are pure functions that transform a `LevelBlueprint` before play. Six are included: NarrowMargin, WideMargin, DifficultyCurve, RhythmLock, GateJitter, and SegmentBias. They compose via pipeline and their parameters are frozen into the RunId. See the [Blueprint Mutators](/MouseTrainer/handbook/mutators/) page for details.

### Replay verification

Every session can be recorded as a binary `.mtr` file. The `ReplayVerifier` re-simulates tick-by-tick and compares the event stream hash, final score, and combo count against the recorded values. This provides anti-cheat guarantees without any server infrastructure. See the [Replay System](/MouseTrainer/handbook/replay/) page for format details.

## Project layout

MouseTrainer is organized as a four-module modular monolith:

| Module | Depends on | Role |
|--------|-----------|------|
| `MouseTrainer.Domain` | nothing | Shared primitives: RNG, hashing, events, input, run identity |
| `MouseTrainer.Simulation` | Domain | Deterministic loop, game modes, mutators, level generation, replay |
| `MouseTrainer.Audio` | Domain | Event-driven audio cues with deterministic variation |
| `MouseTrainer.MauiHost` | all three | MAUI desktop app, rendering, input handling, composition root |

Dependencies are strictly one-way. Domain is the leaf with zero references to siblings. Audio and Simulation never reference each other. Only MauiHost ties everything together.

The test suite contains 305 tests across 11 categories covering architecture boundaries, determinism regression, mutator correctness, replay serialization, and scoring.

## FAQ

**Can I add new game modes?**
Yes. Implement `IGameSimulation` (or `IGameSimulationWithBlueprint` for blueprint support), create a level generator, and register the mode in `LevelGeneratorRegistry`. The deterministic loop and replay system work with any simulation that follows the interface contract.

**Does it work on macOS or Linux?**
The library projects (Domain, Simulation, Audio) are cross-platform .NET. The MauiHost is Windows-only because it targets WinUI 3 via .NET MAUI. A future host could target other platforms.

**How do I change difficulty?**
Use blueprint mutators. Stack NarrowMargin to tighten gate apertures, DifficultyCurve to back-load or front-load difficulty, or SegmentBias to shape difficulty across acts. All mutator parameters are frozen into the RunId for reproducibility.

**Where are replays stored?**
Replay files (`.mtr`) are written to the local app data directory. They contain the full input trace, run identity, and verification hash. No data leaves your machine.
