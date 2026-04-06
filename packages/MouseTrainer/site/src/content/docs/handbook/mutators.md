---
title: Blueprint Mutators
description: Composable transforms that reshape generated levels.
sidebar:
  order: 3
---

Six composable transforms reshape generated levels before play. They're applied as an ordered fold over `LevelBlueprint`.

## Available mutators

| Mutator | Key Params | Effect |
|---------|------------|--------|
| NarrowMargin | factor [0.1, 1.0] | Scales aperture heights down — tighter gaps |
| WideMargin | factor [1.0, 3.0] | Scales aperture heights up — more forgiving |
| DifficultyCurve | curve [-2.0, 2.0] | Power-curve re-interpolation of difficulty by gate index |
| RhythmLock | div {2, 3, 4, 6, 8} | Quantizes gate phases to N divisions — rhythmic patterns |
| GateJitter | str [0, 1] | Deterministic vertical offset via sin — spatial perturbation |
| SegmentBias | seg, amt, shape | Per-segment difficulty bias (crescendo, valley, wave) |

## Composition

Mutators are pure functions: `LevelBlueprint → LevelBlueprint`. They compose via pipeline and their parameters are frozen into the `RunId` hash for reproducibility.

```csharp
var pipeline = new MutatorPipeline(registry);
var specs = new[]
{
    MutatorSpec.Create(new MutatorId("NarrowMargin"), 1,
        new[] { new MutatorParam("factor", 0.7f) }),
    MutatorSpec.Create(new MutatorId("RhythmLock"), 1,
        new[] { new MutatorParam("div", 4f) }),
};
blueprint = pipeline.Apply(blueprint, specs);
```

## SegmentBias shapes

| Shape | Name | Effect |
|-------|------|--------|
| 0 | Crescendo | Easy start, hard finish |
| 1 | Valley | Hard middle, easy ends |
| 2 | Wave | Alternating easy/hard segments |

## DifficultyCurve exponent

The `curve` parameter maps to a power exponent via `pow(2, curve)`. Positive values back-load difficulty (easier early, harder late). Negative values front-load it. Zero is identity (no change).

## MutatorRegistry

The `MutatorRegistry` is the factory that resolves mutator IDs to concrete instances. Each mutator is registered with its ID, version, and a factory function:

```csharp
var registry = new MutatorRegistry();
registry.Register(new MutatorId("NarrowMargin"), 1,
    spec => new NarrowMarginMutator(spec));
registry.Register(new MutatorId("WideMargin"), 1,
    spec => new WideMarginMutator(spec));
```

## MutatorPipeline

The `MutatorPipeline` applies an ordered list of `MutatorSpec` to a `LevelBlueprint` using the registry for resolution. The pipeline is a simple fold: each mutator transforms the blueprint in sequence. Order matters -- applying NarrowMargin before RhythmLock produces a different level than the reverse.

## Identity integration

Every mutator spec (ID, version, and sorted parameters) is hashed into the `RunId` via FNV-1a. This means two runs with different mutator configurations always produce different RunIds, and identical configurations always produce the same RunId regardless of platform.
