---
title: Chaos Archetypes
description: Five villains — deterministic, indifferent, mechanical.
sidebar:
  order: 3
---

Chaos never reacts to Trace. Every obstacle is a deterministic system, not an enemy. They test five different skills.

## The five archetypes

| Archetype | Verb | Counter-Skill | Behavior |
|-----------|------|---------------|----------|
| **Red Orbs** | Disrupt | Anticipation | Drift within a region, bounce at bounds |
| **Crushers** | Constrain | Commitment | Fixed cycle: inactive → telegraph → active |
| **Drift Fields** | Destabilize | Grip stability | Constant directional force |
| **Flickers** | Mislead | Filtering | Flash → afterimage → invisible |
| **Locks** | Restrict | Adaptability | Axis or speed constraints with telegraph |

## Design principles

- **Chaos is indifferent** — obstacles never adapt to the player's position or skill
- **Chaos is deterministic** — same seed produces the same obstacle patterns
- **Chaos is mechanical** — each archetype follows a precise state machine

## Interaction contract

When Trace enters a chaos zone, the interaction is governed by strict rules:

- Chaos never reacts to Trace — only Trace's MotionState changes on contact
- Each archetype has its own render profile (color, shape, animation)
- Telegraphs always precede dangerous states — no cheap shots
- Collisions are mechanical, not dramatic — no explosions or big flashes

## Mutators

Mutators compose chaos patterns through `LevelBlueprint` pure-function transforms. The `MutatorPipeline` chains multiple mutators, and the `MutatorRegistry` manages available transforms. Six built-in mutators ship with the simulation:

| Mutator | Effect |
|---------|--------|
| DifficultyCurve | Scales gate parameters across the level progression |
| GateJitter | Adds randomized offset to gate positions |
| NarrowMargin | Tightens gate apertures for precision play |
| WideMargin | Widens gate apertures for accessibility |
| RhythmLock | Locks gate oscillation to a fixed rhythm |
| SegmentBias | Biases gate placement toward a playfield region |

Mutators never modify their input — they always return a new blueprint.
