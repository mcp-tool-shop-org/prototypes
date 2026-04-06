---
title: Getting Started
description: Build, test, and run Trace.
sidebar:
  order: 1
---

Trace is a .NET 10 MAUI application (Windows-first). The simulation library is testable independently.

## Build

Build the simulation library (0 warnings, TreatWarningsAsErrors):

```bash
dotnet build src/MouseTrainer.Simulation/
```

## Test

Run all 348 tests across 12 categories:

```bash
dotnet test tests/MouseTrainer.Tests/
```

Test categories include architecture boundary enforcement, determinism regression, replay verification, mutator correctness, scoring, motion state transitions, and golden-hash identity tests.

## Run

Open the solution in Visual Studio 2022, set the startup project to `MouseTrainer.MauiHost`, and press F5. The MAUI host is the composition root that wires together simulation, audio, and rendering.

## What to expect

Trace inhabits a virtual 1920x1080 coordinate space with letterbox scaling. You control a cursor through chaos — five types of obstacles that test precision, commitment, filtering, grip stability, and adaptability.

The game is not an aim trainer or arcade game. High-skill play looks calm, not frantic.

## Next steps

- Understand the [motion state machine](/Trace/handbook/motion-states/)
- Meet the [chaos archetypes](/Trace/handbook/chaos-archetypes/)
- Explore the [architecture](/Trace/handbook/architecture/)
