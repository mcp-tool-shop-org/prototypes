---
title: Game Modes
description: ReflexGates and the pluggable simulation interface.
sidebar:
  order: 3
---

## ReflexGates

The primary game mode. A side-scrolling gate challenge where oscillating apertures appear on vertical walls — navigate the cursor through each gate before the scroll catches you.

Key properties:

- Fixed 60Hz timestep with accumulator-based catch-up
- `xorshift32` RNG seeded per run for platform-stable generation
- FNV-1a 64-bit hashing for run identity — same seed + mode + mutators = same RunId everywhere
- Deterministic seed produces identical levels every time

## The simulation interface

`IGameSimulation` is a two-method contract. New game modes plug in without touching the engine core:

1. **Reset(uint sessionSeed)** — initialize or re-initialize the simulation with a deterministic seed
2. **FixedUpdate(long tick, float dt, in PointerInput input, List\<GameEvent\> events)** — advance the simulation by one fixed timestep, emitting events into the provided list

The `DeterministicLoop` drives the simulation at 60Hz using an accumulator pattern. It tracks host time, accumulates delta time, and calls `FixedUpdate` one or more times per frame to catch up (capped at `MaxStepsPerFrame`, default 5). After all fixed steps, it computes an alpha value for smooth rendering interpolation between simulation states.

## Level generation

Levels are generated through a pipeline:

1. `ILevelGenerator` produces a `LevelBlueprint` from a seed
2. The `MutatorPipeline` transforms the blueprint through an ordered fold of `IBlueprintMutator` instances
3. The final blueprint is used by the game mode simulation

The `LevelGeneratorRegistry` resolves generators by game mode, and the `MutatorRegistry` resolves mutators by `MutatorId`. Both are factory-based for extensibility.

## ReflexGates configuration

`ReflexGateConfig` controls all tuning knobs for a level. Default values:

| Parameter | Default | Description |
|-----------|---------|-------------|
| PlayfieldWidth / Height | 1920 x 1080 | Virtual coordinate space |
| GateCount | 12 | Number of gates per level |
| ScrollSpeed | 70 px/s | Auto-scroll rate (~83 seconds per clean run) |
| BaseApertureHeight | 200 | Starting gap height (shrinks to 100 by the last gate) |
| BaseAmplitude / MaxAmplitude | 40 / 350 | Oscillation range (gates 1-4 nearly stationary, 9-12 hard) |
| BaseFreqHz / MaxFreqHz | 0.15 / 1.2 | Oscillation frequency ramp |
| CenterScore / EdgeScore | 100 / 50 | Points for passing through the center vs. the edge of a gate |
| ComboThreshold | 3 | Consecutive passes before a ComboUp event fires |

## Scoring

When the cursor passes through a gate, the score is interpolated between `CenterScore` (100 for a dead-center pass) and `EdgeScore` (50 for a pass at the aperture edge). Missing a gate resets the combo streak to zero.

The `SessionController` tracks a `ScoreBreakdown` built from `ScoreDelta` records. Each delta is tagged with a `ScoreComponentId` (GateScore or MissPenalty) and the combo count at that moment. The breakdown enforces a conservation invariant: the sum of all component totals equals the session total.

## Session lifecycle

The `SessionController` is a state machine with three phases:

1. **Ready** — initialized with a seed and gate count, waiting to start
2. **Playing** — elapsed timer running, processing `GameEvent` emissions from the simulation
3. **Results** — level complete, final `SessionResult` available (immutable record with score, combo, gate results, verification hash)

## Replay verification

DMTE includes a full replay system. The `ReplayRecorder` captures quantized input samples every tick during live play. At session end, it produces an immutable `ReplayEnvelope` containing the full input trace, run identity, and verification hash.

The `ReplayVerifier` can replay an envelope through a fresh `IGameSimulation` instance, comparing the event stream hash, final score, and max combo against the envelope's claims. If any value diverges, the replay is invalid — proving the determinism guarantee holds.
