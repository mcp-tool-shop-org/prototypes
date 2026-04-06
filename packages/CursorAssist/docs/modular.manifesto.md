# MouseTrainer Modular Architecture Manifesto

> Constitutional rules for the MouseTrainer module graph.
> Treat violations as build failures.

---

## Module Inventory

| Module | Assembly | Purpose |
|--------|----------|---------|
| **Domain** | `MouseTrainer.Domain` | Shared primitives: events, input, run identity, RNG |
| **Simulation** | `MouseTrainer.Simulation` | Deterministic game loop, modes, levels, mutators, session |
| **Audio** | `MouseTrainer.Audio` | Cue system, asset manifest, verification |
| **App (MAUI)** | `MouseTrainer.MauiHost` | Platform host — wires everything together |

---

## Dependency Graph (Allowed References Only)

```
MouseTrainer.Domain        --> (nothing)
MouseTrainer.Simulation    --> MouseTrainer.Domain
MouseTrainer.Audio         --> MouseTrainer.Domain
MouseTrainer.MauiHost      --> Domain + Simulation + Audio
```

### Prohibited References

- `Audio` must **never** reference `Simulation`
- `Simulation` must **never** reference `Audio`
- `Domain` must **never** reference any sibling module
- No library module may reference `Microsoft.Maui.*` or any platform SDK
- No "mode" (`Simulation.Modes.*`) may reference another mode
- No "mutator" (`Simulation.Mutators.*`) may reference `Simulation.Modes.*` directly (mutators operate on `LevelBlueprint`, not mode internals)

---

## Namespace Conventions

Flat namespaces — no stutter (e.g., no `MouseTrainer.Audio.Audio`).

| Folder Path | Namespace |
|-------------|-----------|
| `Domain/Events/` | `MouseTrainer.Domain.Events` |
| `Domain/Input/` | `MouseTrainer.Domain.Input` |
| `Domain/Runs/` | `MouseTrainer.Domain.Runs` |
| `Domain/Utility/` | `MouseTrainer.Domain.Utility` |
| `Simulation/Core/` | `MouseTrainer.Simulation.Core` |
| `Simulation/Levels/` | `MouseTrainer.Simulation.Levels` |
| `Simulation/Modes/ReflexGates/` | `MouseTrainer.Simulation.Modes.ReflexGates` |
| `Simulation/Mutators/` | `MouseTrainer.Simulation.Mutators` |
| `Simulation/Session/` | `MouseTrainer.Simulation.Session` |
| `Simulation/Debug/` | `MouseTrainer.Simulation.Debug` |
| `Audio/Core/` | `MouseTrainer.Audio.Core` |
| `Audio/Assets/` | `MouseTrainer.Audio.Assets` |
| `MauiHost/` | `MouseTrainer.MauiHost` |

### Why `DeterministicRng` Lives in Domain

`AudioDirector.EmitOneShot` calls `DeterministicRng.Mix()` for deterministic
cue selection. Placing RNG in Simulation would force `Audio --> Simulation`,
violating the one-way graph. Domain is the correct home.

---

## Compiler Guardrails

Defined in `src/Directory.Build.props`:

- `<Nullable>enable</Nullable>` — all projects
- `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` — library projects only
- `<AnalysisLevel>latest-recommended</AnalysisLevel>` — all projects
- MAUI host opts out of warnings-as-errors (SDK-generated warnings)

---

## Blueprint Mutator System

Mutators are pure functions over `LevelBlueprint` — they compose via an ordered fold in `MutatorPipeline`. The system lives in `Simulation/Mutators/` with protocol-grade identity types in `Domain/Runs/`.

### Key Types

| Type | Module | Role |
|------|--------|------|
| `MutatorId` | Domain | Permanent string identifier (frozen once created) |
| `MutatorSpec` | Domain | Id + version + sorted parameter list |
| `MutatorParam` | Domain | Key-value pair (string key, float value) |
| `IBlueprintMutator` | Simulation | `LevelBlueprint Apply(LevelBlueprint)` interface |
| `MutatorPipeline` | Simulation | Resolves specs → mutators, applies as ordered fold |
| `MutatorRegistry` | Simulation | Factory registry: `(MutatorId, version) → Func<MutatorSpec, IBlueprintMutator>` |

### Registered Mutators (6)

| Id | Class | Category |
|----|-------|----------|
| `NarrowMargin` | `NarrowMarginMutator` | Scaling (aperture down) |
| `WideMargin` | `WideMarginMutator` | Scaling (aperture up) |
| `DifficultyCurve` | `DifficultyCurveMutator` | Reshaping (difficulty remap by index) |
| `RhythmLock` | `RhythmLockMutator` | Timing (phase quantization) |
| `GateJitter` | `GateJitterMutator` | Spatial (deterministic vertical offset) |
| `SegmentBias` | `SegmentBiasMutator` | Structural (per-segment difficulty acts) |

### Purity Constraint

Mutators may only read their own parameters and the input `LevelBlueprint`. They must NOT:
- Access RNG state
- Read RunId or seed
- Reference mode-specific types (only `LevelBlueprint` and `Gate`)
- Produce side effects

This ensures mutator parameters are frozen into the `RunId` hash and runs are fully reproducible.

---

## Run Identity System

The `Domain/Runs/` namespace contains protocol-grade types for deterministic run identity:

| Type | Role |
|------|------|
| `RunDescriptor` | Combines ModeId + seed + mutator specs → computes RunId |
| `RunId` | FNV-1a 64-bit hash — platform-stable, permanent |
| `ModeId` | String-based game mode identifier |
| `DifficultyTier` | Enum for difficulty classification |

Same `ModeId` + seed + mutator specs → same `RunId` on every platform. Parameters are canonically sorted by key before hashing.

---

## Enforcement Roadmap

### Complete

- [x] Module split with enforced project references (Phase 2A)
- [x] `Directory.Build.props` with nullable + warnings-as-errors
- [x] This manifesto (constitutional documentation)
- [x] RunDescriptor + LevelBlueprint generator pipeline (Phase 4AB)
- [x] Blueprint mutator system with registry + pipeline (Phase 4C1)
- [x] RhythmLock + GateJitter structural mutators (Phase 4C1b)
- [x] SegmentBias structural mutator (Phase 4C1c)
- [x] 214 tests: architecture boundaries, determinism replay, persistence, mutators, runs, levels

### Next (Phase 2C — ArchTests)

- [ ] `MouseTrainer.ArchTests` project using NetArchTest
- [ ] Rules codified as unit tests:
  - `Simulation.*` must not reference `Microsoft.Maui.*`
  - `Audio.*` must not reference `MouseTrainer.Simulation.*`
  - `Domain.*` must not reference any sibling
  - `Simulation.Modes.*` must not cross-reference other modes
- [ ] Run in CI — violation = red build

---

## Adding a New Game Mode

1. Create folder: `Simulation/Modes/NewMode/`
2. Namespace: `MouseTrainer.Simulation.Modes.NewMode`
3. Implement `IGameSimulation` (and optionally `ISimDebugOverlay`)
4. Only reference `MouseTrainer.Simulation.Core` and `MouseTrainer.Domain.*`
5. Wire in `MauiHost` — the host is the only composition root
6. Never reference other modes directly

---

## Adding a New Mutator

1. Create class in `Simulation/Mutators/`: implement `IBlueprintMutator`
2. Add static `MutatorId` in `Domain/Runs/MutatorId.cs` (permanent — never rename)
3. Two constructors: direct params + `MutatorSpec` (for registry resolution)
4. Register in `MauiHost/MainPage.xaml.cs` via `mutatorRegistry.Register()`
5. Add golden hash tests in `RunDescriptorTests.cs`
6. Add correctness + composition tests in `BlueprintMutatorTests.cs`
7. Update `CreateFullRegistry()` test helper

---

## Adding a New Module

Before creating any new assembly:

1. Draw the updated dependency graph
2. Verify no cycles are introduced
3. Add the module to this manifesto
4. Add arch test rules for the new module
5. Get team sign-off
