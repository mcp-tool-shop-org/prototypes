---
title: Getting Started
description: Install MouseTrainer packages and build from source.
sidebar:
  order: 1
---

MouseTrainer is a deterministic mouse dexterity trainer built on .NET 10 MAUI with a fixed-timestep simulation.

## Prerequisites

- .NET 10 SDK
- Windows 10/11
- Visual Studio with .NET MAUI workload (for the MauiHost app)

## Install from NuGet

```bash
# Core primitives (RNG, hashing, run identity)
dotnet add package MouseTrainer.Domain

# Simulation engine (game loop, modes, mutators, replay)
dotnet add package MouseTrainer.Simulation

# Audio cue system (event-driven sound)
dotnet add package MouseTrainer.Audio
```

## Build from source

```bash
git clone https://github.com/mcp-tool-shop-org/MouseTrainer.git
cd MouseTrainer

# Build all library projects
dotnet build src/MouseTrainer.Domain/
dotnet build src/MouseTrainer.Simulation/
dotnet build src/MouseTrainer.Audio/

# Run all tests (305 tests across 11 categories)
dotnet test tests/MouseTrainer.Tests/
```

The MAUI host project requires Visual Studio with the .NET MAUI workload installed. CLI `dotnet build` may fail on MauiHost due to MrtCore PRI generation targets — use Visual Studio for full builds.

## Quick start code

```csharp
using MouseTrainer.Domain.Runs;
using MouseTrainer.Domain.Utility;
using MouseTrainer.Simulation.Core;
using MouseTrainer.Simulation.Modes.ReflexGates;

// Create a deterministic run
var run = RunDescriptor.Create(
    mode: new ModeId("ReflexGates"),
    seed: 42,
    difficulty: DifficultyTier.Standard);

// Generate a level from the seed
var config = new ReflexGateConfig();
var generator = new ReflexGateGenerator(config);
var blueprint = generator.Generate(run.Seed);

// Wire up the simulation and deterministic loop
var sim = new ReflexGateSimulation(config);
sim.Reset(blueprint);

var loop = new DeterministicLoop(sim,
    new DeterministicConfig { FixedHz = 60, SessionSeed = run.Seed });

// Each frame: step the loop with host time and pointer input
// var result = loop.Step(pointerInput, hostNowTicks, ticksPerSecond);
// result.Events contains GameEvent[] for audio, scoring, and UI
```
