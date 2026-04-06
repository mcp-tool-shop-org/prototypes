---
title: Architecture
description: Modular monolith, engine heritage, and design canon.
sidebar:
  order: 4
---

Trace is a four-module modular monolith with enforced one-way dependencies.

## Module graph

```
MouseTrainer.Domain        → (nothing)     # Leaf: primitives, RNG, motion states
MouseTrainer.Simulation    → Domain         # Engine: loop, modes, mutators, replay
MouseTrainer.Audio         → Domain         # Cue system, asset verification
MouseTrainer.MauiHost      → all three      # Composition root, renderer
```

No cycles. No platform leakage into libraries. Domain is the leaf; MauiHost is the only composition root. Architecture boundary tests enforce this at CI.

## Engine heritage

Forked from DeterministicMouseTrainingEngine. Core systems:

- `IGameSimulation` — pluggable game mode interface (2 methods)
- `DeterministicLoop` — 60Hz fixed timestep with alpha interpolation
- `DeterministicRng` — xorshift32, seed-reproducible
- `GameEvent` pipeline — typed event stream
- Replay system — MTR v1 binary format, FNV-1a verification
- Mutator composition — `LevelBlueprint` pure-function transforms
- Virtual coordinate space — 1920x1080, letterbox scaling

## Session orchestration

The `SessionController` manages a three-state machine: Ready, Playing, and Results. It processes `GameEvent` emissions from the simulation to build per-gate results, tracks combo streaks, and produces an immutable `SessionResult` with a full `ScoreBreakdown`. No MAUI dependencies — pure orchestration logic inside the Simulation module.

## Design canon

Trace has 19 design documents covering every system:

| Category | Documents |
|----------|-----------|
| Product | product-boundary, tone-bible |
| Motion | motion-language-spec, motion-state-machine |
| Visual | visual-style-guide, renderer-integration-trace |
| Chaos | villains-and-trace-skills, chaos-behavior-state-machines, chaos-entity-animation-bible, renderer-integration-chaos, interaction-rendering-canon |
| Audio | sound-design-bible, procedural-audio-parameter-map, audio-engine-architecture, soundscape-moodboard, soundscape-canon |
| Engineering | modular.manifesto, sandbox-drift-field-v1, MAUI_AssetOpener_Snippet |

Every system has a written spec before implementation.
