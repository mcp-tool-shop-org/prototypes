---
title: Reference
description: NuGet packages, architecture, and security scope.
sidebar:
  order: 6
---

## NuGet packages

| Package | Depends on | Description |
|---------|-----------|-------------|
| MouseTrainer.Domain | (nothing) | Deterministic xorshift32 RNG, FNV-1a hashing, LEB128, game events, run identity |
| MouseTrainer.Simulation | Domain | Fixed 60 Hz game loop, composable mutators, level generation, replay |
| MouseTrainer.Audio | Domain | Event-driven audio cues with deterministic volume/pitch jitter |

## Architecture

Four-module modular monolith with enforced one-way dependencies:

```
MouseTrainer.Domain        → (nothing)     Shared primitives (leaf)
MouseTrainer.Simulation    → Domain        Deterministic engine
MouseTrainer.Audio         → Domain        Cue system
MouseTrainer.MauiHost      → all three     Composition root
```

### Constitutional rules

- Audio must never reference Simulation
- Simulation must never reference Audio
- Domain must never reference any sibling module
- No library module may reference `Microsoft.Maui.*`
- No mode may cross-reference another mode
- Mutators operate on `LevelBlueprint` only — never mode internals

## Test coverage

305 tests across 11 categories:

| Category | Coverage |
|----------|----------|
| Architecture | Dependency boundary enforcement |
| Determinism | Replay regression, RNG, session controller |
| Infrastructure | Build and project structure validation |
| Levels | Generator extraction |
| Mutators | Blueprint mutator correctness and composition |
| Persistence | Session store read/write |
| Replay | Serializer, recorder, verifier, quantization |
| Runs | RunDescriptor golden hashes and identity |
| Scoring | Score breakdown correctness |
| Utility | LEB128 encoding |

## Security and data scope

| Aspect | Detail |
|--------|--------|
| Data touched | Local replay files (`.mtr`), user settings, bundled audio assets |
| Data NOT touched | No network, no telemetry, no analytics, no cloud sync |
| Permissions | Read/write local app data directory only |

See [SECURITY.md](https://github.com/mcp-tool-shop-org/MouseTrainer/blob/main/SECURITY.md) for vulnerability reporting.
