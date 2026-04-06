---
title: Transform Pipeline
description: How the input processing chain works.
sidebar:
  order: 2
---

The CursorAssist Engine processes raw pointer input through a composable chain of transforms, each implementing `IInputTransform`.

## Pipeline order

```
Raw Input -> SoftDeadzone -> Smoothing -> PhaseCompensation -> DirectionalIntent -> TargetMagnetism -> Output
```

Each transform in the chain receives the output of the previous one and applies a specific correction:

| Transform | Purpose | Stateful? |
|-----------|---------|-----------|
| SoftDeadzone | Quadratic compression near the center -- no hard edges | Yes |
| Smoothing | Velocity-adaptive EMA with closed-form cutoff from tremor frequency | Yes |
| PhaseCompensation | Feed-forward lag correction, velocity-attenuated to prevent overshoot | No |
| DirectionalIntent | Cosine coherence detection for intended movement direction, with hysteresis | Yes |
| TargetMagnetism | Cursor attraction toward nearby UI targets with hysteresis and snap | Yes |

Stateful transforms implement `IStatefulTransform` (extends `IInputTransform`). Their `Reset()` method must return all mutable state to a deterministic initial condition so that replaying the same input stream after a reset produces identical output and the same FNV-1a hash. Stateless transforms like `PhaseCompensationTransform` implement `IInputTransform` directly.

## Transform details

### SoftDeadzone

Suppresses small tremor-scale deltas without introducing phase lag into larger intentional movements. Uses quadratic compression: `r' = r^2 / (r + D)` where `D` is the deadzone radius from `AssistiveConfig.DeadzoneRadiusVpx`. The formula is continuous and differentiable at r=0 with no hard edge.

### Smoothing

Velocity-adaptive first-order IIR low-pass (EMA) filter. At low velocity (tremor), alpha is low for strong suppression. At high velocity (intentional motion), alpha approaches 1 for near pass-through. The transition uses Hermite smoothstep interpolation.

When `SmoothingDualPoleEnabled` or `PrecisionModeEnabled` is true, a second EMA stage cascades at low velocity for -40 dB/decade rolloff (vs. -20 dB/decade single-pole). The dual-pole output blends to single-pole between `VelocityLow` and `VelocityHigh` so fast motion incurs no extra lag.

When `SmoothingAdaptiveFrequencyEnabled` is true, the transform estimates tremor frequency in real-time via a `TremorAnalyzer` (zero-crossing rate on high-pass filtered deltas) and dynamically adjusts MinAlpha using the closed-form law.

### PhaseCompensation

Purely feed-forward (stateless) velocity projection to offset EMA-induced phase lag. Uses velocity-dependent gain attenuation: `effectiveGain = gainS / (1 + velocity / 15)`. At low velocity, near-full compensation. At high velocity, attenuated to prevent overshoot during deceleration. Compensation vanishes at rest.

### DirectionalIntent

Detects sustained intentional movement via cosine similarity of consecutive velocity vectors. When smoothed coherence exceeds the engage threshold, adds a velocity-proportional displacement boost in the detected direction. Uses hysteresis (separate engage/disengage thresholds) to prevent flicker when coherence oscillates.

### TargetMagnetism

Lerps the cursor toward the nearest UI target center when within the activation radius. Uses quadratic proximity falloff so the pull strengthens as the cursor approaches the target. Below the snap radius, hard-snaps to center. Hysteresis prevents flicker at the engagement boundary, and target locking prevents jumping between nearby targets.

## Deterministic pipeline

The `DeterministicPipeline` wraps the transform chain in a fixed-timestep accumulator loop running at 60 Hz. Every tick produces an FNV-1a hash for replay verification. It provides two stepping modes:

- **`Step()`** -- host-clock-driven with accumulator and interpolation alpha, for real-time use
- **`FixedStep()`** -- one tick per call with no host clock, for benchmarks and replays

```csharp
var pipeline = new TransformPipeline()
    .Add(new SoftDeadzoneTransform())
    .Add(new SmoothingTransform())
    .Add(new PhaseCompensationTransform())
    .Add(new DirectionalIntentTransform())
    .Add(new TargetMagnetismTransform());

var engine = new DeterministicPipeline(pipeline, fixedHz: 60);

EngineFrameResult result = engine.FixedStep(in raw, context);
// result.FinalCursor     -> smoothed, filtered, compensated position
// result.DeterminismHash -> FNV-1a hash for replay verification
```

## Composability

Transforms are fully composable. You can add, remove, or reorder them. The pipeline applies them in sequence, passing each transform's output as the next transform's input.
