---
title: Reference
description: Design principles, project structure, and links.
sidebar:
  order: 5
---

## Design principles

- **Determinism is constitutional.** Same seed → same simulation → same score. No `DateTime.Now`, no `Random`, no platform-dependent floats.
- **Rendering is a pure function of state.** No animation timelines. MotionState + ForceVector + StabilityScalar → visual output.
- **Chaos is indifferent.** Obstacles never react to the player.
- **Mastery looks calm.** If high-skill play looks frantic, the system is lying.
- **Modular monolith.** Four assemblies with enforced one-way dependencies.
- **Warnings are errors.** `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` on library projects.

## Test categories

| Category | What it tests |
|----------|--------------|
| Architecture | Dependency boundary enforcement |
| Determinism | Replay regression, RNG, gate generation, session controller |
| Levels | Generator extraction |
| MotionAnalyzer | Motion analysis from pointer input |
| MotionStates | State machine transitions + forbidden paths |
| Mutators | Blueprint mutator correctness + composition |
| Persistence | Session store |
| Replay | Serializer, recorder, verifier, quantization, event hashing |
| Runs | RunDescriptor golden hashes, MutatorSpec identity |
| Scoring | Score breakdown |
| Utility | Leb128 encoding |
| Version | Assembly version consistency |

## Build commands

| Command | Description |
|---------|-------------|
| `dotnet build src/MouseTrainer.Simulation/` | Build simulation library |
| `dotnet test tests/MouseTrainer.Tests/` | Run all 348 tests |

## Links

- [GitHub Repository](https://github.com/mcp-tool-shop-org/Trace)
- [DeterministicMouseTrainingEngine](https://github.com/mcp-tool-shop-org/DeterministicMouseTrainingEngine) — engine heritage
