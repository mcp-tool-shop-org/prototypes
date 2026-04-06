# MouseTrainer.MauiHost

Composition root for the MouseTrainer application. This is the only project that references all three library modules (Domain, Simulation, Audio) and the only place platform-specific code lives.

## Responsibilities

1. **Asset verification** — validates packaged audio assets at startup (MSIX-safe)
2. **Deterministic loop** — drives the fixed 60 Hz simulation via `DeterministicLoop`
3. **Audio cue layer** — routes game events through `AudioDirector` → `MauiAudioSink`
4. **Mutator registry** — wires all 6 blueprint mutators into `MutatorPipeline`
5. **Session management** — Ready → Playing → Results state machine with persistence
6. **Rendering** — custom `GraphicsView` with neon-palette game renderer, particle effects, screen shake, cursor trail

## Registered Mutators

```csharp
mutatorRegistry.Register(MutatorId.NarrowMargin,    1, spec => new NarrowMarginMutator(spec));
mutatorRegistry.Register(MutatorId.WideMargin,      1, spec => new WideMarginMutator(spec));
mutatorRegistry.Register(MutatorId.DifficultyCurve, 1, spec => new DifficultyCurveMutator(spec));
mutatorRegistry.Register(MutatorId.RhythmLock,      1, spec => new RhythmLockMutator(spec));
mutatorRegistry.Register(MutatorId.GateJitter,      1, spec => new GateJitterMutator(spec));
mutatorRegistry.Register(MutatorId.SegmentBias,     1, spec => new SegmentBiasMutator(spec));
```

## Run

- **Windows**: Set startup project to `MouseTrainer.MauiHost` in Visual Studio, build x64, run.
- CLI `dotnet build` may hit MSB4062 (MrtCore.PriGen.targets) — use VS for full MAUI builds.

## Virtual Coordinate Space

The game runs in a 1920×1080 virtual coordinate space. Device coordinates are mapped via letterbox scaling with aspect-ratio preservation. All simulation and rendering operates in virtual coordinates.
