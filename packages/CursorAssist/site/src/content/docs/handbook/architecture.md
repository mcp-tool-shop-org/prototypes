---
title: Architecture
description: Module boundaries, threading model, and design principles.
sidebar:
  order: 4
---

CursorAssist is a modular monolith with strictly enforced one-way dependencies.

## Module dependency graph

```
CursorAssist libraries:
  Canon            -> (nothing)         Schemas + DTOs (leaf)
  Trace            -> (nothing)         Input recording (leaf)
  Policy           -> Canon             Profile-to-config mapping
  Engine           -> Canon, Trace      Transform pipeline + analysis
    Core/                               Pipeline, InputSample, TransformContext
    Transforms/                         SoftDeadzone, Smoothing, PhaseComp, Intent, Magnetism
    Analysis/                           TremorAnalyzer, CalibrationSession
    Layout/                             UILayout for target/button mapping
    Metrics/                            IMetricsSink, Benchmark, Tracing, MotorProfile sinks

  Runtime.Core     -> Engine, Policy    Thread management, config swap
  Runtime.Windows  -> Runtime.Core      Win32 hooks, raw input

MouseTrainer libraries:
  Domain           -> (nothing)         RNG, events, run identity (leaf)
  Simulation       -> Domain            Game loop, mutators, levels
  Audio            -> Domain            Cue system, asset verification

Apps:
  CursorAssist.Pilot       -> all CursorAssist libs    Tray-based assistant
  MouseTrainer.MauiHost    -> all MouseTrainer libs     MAUI desktop game

CLI tools:
  CursorAssist.Benchmark.Cli   -> Engine, Policy       Replay benchmarking
  CursorAssist.Profile.Cli     -> Engine, Canon         Motor profiling
```

## Two products, one workspace

The repository contains two products sharing design principles but not code:

- **CursorAssist** -- real-time cursor assistance for people with motor impairments
- **MouseTrainer** -- dexterity training game for building the skills to need less assistance over time

## Threading model (Runtime)

The `EngineThread` in Runtime.Core manages the real-time processing loop:

- **OS Input Thread** enqueues `RawInputEvent` into a lock-free `ConcurrentQueue`
- **Engine Thread** runs the deterministic pipeline at 60 Hz with a fixed-timestep accumulator, reads input, writes `AssistedDelta` to an injection queue
- **Injection Thread** reads the injection queue and applies deltas via Win32 `SendInput`

Config swaps are atomic at frame boundaries. An echo guard (injection ring buffer with 50ms time window) prevents feedback loops between injected and captured input. Emergency stop drains all queues and resets pipeline state.

## Safety layers

- **RuntimeLimits** cap per-tick injection delta to prevent runaway cursor
- **ClampConfig** enforces parameter bounds at runtime, catching configs that bypass CanonValidator
- **Kill switch** (`IKillSwitch`) provides emergency stop via hotkey (Runtime.Windows implements `HotkeyKillSwitch`)

## Design principles

- **Determinism is constitutional.** Same input produces the same output, always. No `DateTime.Now`, no `Random`, no platform-dependent floats in the hot path. Every frame is hash-verified via FNV-1a.
- **DSP-grounded, not ad hoc.** EMA cutoff frequencies from closed-form formulas. Power-law frequency weighting. Velocity-attenuated phase compensation.
- **Modular with enforced boundaries.** One-way dependencies, no cycles. Canon and Trace are leaves. Apps are composition roots.
- **Protocol-grade identity.** FNV-1a hashing with canonical parameter serialization. xorshift32 RNG for reproducible game sessions.
- **Accessibility is the product.** CursorAssist exists to make computers usable for people with motor impairments.
