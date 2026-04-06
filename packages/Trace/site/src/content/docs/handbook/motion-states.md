---
title: Motion States
description: The five-state machine that drives Trace.
sidebar:
  order: 2
---

Trace inhabits exactly one of five motion states every frame. Transitions are enforced by a compile-time transition table — forbidden transitions return null.

## The five states

| State | Identity | Visual |
|-------|----------|--------|
| **Alignment** | Neutral, stable, calm | Baseline cyan, minimal glow |
| **Commitment** | Decisive acceleration | Slight forward tint, warm edge |
| **Resistance** | Counterforce lean | Amber-shifted edge, increased glow |
| **Correction** | Micro-adjustments | Edge brightening, high precision |
| **Recovery** | Brief recoil | Desaturation fade (150ms) |

## Transition paths

The main loop follows a predictable sequence:

```
Alignment → Commitment → Resistance → Correction → Alignment
```

The recovery loop handles error states:

```
Alignment → Recovery → Alignment
```

Forbidden transitions (e.g., Commitment → Recovery) are enforced at compile time. The transition table is the single source of truth for state flow.

## Triggers

Each transition is caused by a specific `MotionTrigger`:

| Trigger | Cause | Transition |
|---------|-------|------------|
| Commit | Player initiates a deliberate path | Alignment → Commitment |
| EncounterForce | External force (Drift Field, push) | Commitment → Resistance |
| Stabilize | Force stabilizes | Resistance → Correction |
| Refine | Path refined, stability restored | Correction → Alignment |
| Slip | Minor collision, timing slip, jitter | Alignment → Recovery |
| Regain | Stability regained after recovery | Recovery → Alignment |

## Rendering from state

Every visual property is derived from the current motion state. There are no animation timelines or sprite sheets:

```
VisualState = RenderProfile[MotionState]
```

Color, edge style, glow strength, directional bias, and desaturation are all pure functions of the current state. This means the renderer expresses Trace's identity with zero animation assets.
