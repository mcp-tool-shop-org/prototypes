# Soundscape Canon v1

> A unified audio philosophy for Trace and the hostile system.
> Deterministic, state-driven, procedural audio identity for MouseTrainer.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Audio Philosophy](#2-audio-philosophy)
3. [Trace Audio Identity](#3-trace-audio-identity)
4. [Chaos Audio Identity](#4-chaos-audio-identity)
5. [Interaction Canon](#5-interaction-canon)
6. [Procedural Audio Architecture](#6-procedural-audio-architecture)
7. [Procedural Audio Parameter Map](#7-procedural-audio-parameter-map)
8. [Tone & Anti-Patterns](#8-tone--anti-patterns)
9. [Soundscape Moodboard](#9-soundscape-moodboard)
10. [Appendices](#10-appendices)

---

## 1. Introduction

### 1.1 Purpose of This Document

Defines the complete audio metaphysics of Trace's world. This is the single source of truth for all audio design decisions, covering Trace, Chaos entities, their interactions, the procedural engine, parameter wiring, and tonal identity.

### 1.2 Scope

- Trace's three-layer audio identity (tone, transient, silence)
- Chaos entity audio profiles (5 archetypes)
- Trace-vs-Chaos interaction audio contract
- Procedural audio engine architecture (DSP pipeline)
- Simulation-to-audio parameter mapping
- Tone targets and anti-patterns
- Sensory moodboard for alignment of intuition

### 1.3 Guiding Principles

- **Deterministic** --- no randomness in tone, timing, or texture
- **Mechanical** --- no emotional contour, no musicality
- **Minimal** --- silence is a design tool, not a gap
- **State-driven** --- MotionState and ChaosState are the only drivers
- **Silence as mastery** --- high-skill play becomes quiet

---

## 2. Audio Philosophy

### 2.1 Sound = State

Audio does not decorate. Audio communicates Trace's internal discipline and the system's external pressure.

Every sound must communicate one of:
- stability
- instability
- pressure
- correction
- commitment
- disruption

No sound should ever communicate:
- emotion
- drama
- reward
- punishment

This is the audio equivalent of the motion language.

### 2.2 No Emotion, No Drama

No musical cues. No emotional swells. No "success" or "failure" sounds.

### 2.3 Deterministic Behavior

Procedural audio must be:
- predictable
- repeatable
- parameter-driven

Chaos is not noise. Chaos is structured disruption.

### 2.4 Silence as a Design Tool

High-skill play should sound quiet. Silence is the audio expression of mastery.

---

## 3. Trace Audio Identity

### 3.1 Overview

Trace's soundscape is built from three independent layers. Each is stateless and parameter-driven.

### 3.2 Continuous Tone Layer (State Tone)

A low-level, nearly subliminal hum that shifts with MotionState.

**ALIGNMENT**
- near-silent
- stable, pure tone
- slight harmonic at StabilityScalar > 0.8

**COMMITMENT**
- subtle forward-leaning harmonic
- slight increase in brightness
- no pitch glide

**RESISTANCE**
- tension frequency introduced
- slight phase modulation tied to ForceVector magnitude

**CORRECTION**
- micro-chirps (very short, < 20ms)
- triggered by correction events
- no melodic contour

**RECOVERY**
- brief low-pass dip
- slight amplitude drop
- return to baseline over 150ms

### 3.3 Transient Layer (Micro-Events)

Short, precise, non-musical impulses.

| Trigger | Sound Type | Duration | Amplitude |
|---------|-----------|----------|-----------|
| Enter COMMITMENT | Soft click | < 30ms | 0.15 |
| Enter RESISTANCE | Pressure onset | < 50ms | ForceVector magnitude x 0.1 |
| Correction tick | Corrective tick | < 20ms | CorrectionMagnitude x 0.08 |
| Enter RECOVERY | Muted thump | < 50ms | 0.12 |

Rules:
- < 50ms
- non-percussive
- non-melodic
- no emotional contour

Think: mechanical thought, not UI beeps.

### 3.4 Silence Layer (Mastery Indicator)

When Trace is in perfect ALIGNMENT:
- tone nearly disappears
- transients vanish
- world becomes quiet

Silence is the audio expression of control.

---

## 4. Chaos Audio Identity

### 4.1 Overview

Each chaos archetype has one audio verb, matching its motion verb. Chaos sounds like rules, not enemies.

### 4.2 Red Orbs --- Disrupt

**Verb:** disrupt
**Sound:** drifting interference

- soft, airy interference noise
- slight whoosh when crossing Trace's path
- no impact sound
- no aggression

| Parameter | Source | Mapping |
|-----------|--------|---------|
| Interference noise | Position relative to Trace | Amplitude proportional to proximity |
| Whoosh | Crossing Trace's path | Brief amplitude spike |
| Drift tone | Drift vector | Slight pitch shift proportional to speed |
| Impact | --- | None (forbidden) |

### 4.3 Crushers --- Constrain

**Verb:** constrain
**Sound:** mechanical cycle

- steady cycle hum
- telegraph = rising harmonic (not a beep)
- active = low, oppressive pressure tone

Only place in the game with minimal screen shake + low-frequency emphasis.

| Parameter | Source | Mapping |
|-----------|--------|---------|
| Cycle hum | CrusherPhase | Continuous, phase-locked |
| Telegraph harmonic | Phase entering telegraph | Rising frequency over telegraph duration |
| Active pressure | Phase entering active | Low, oppressive tone |
| Impact | Trace in active zone | Low-frequency emphasis (only place in game) |

### 4.4 Drift Fields --- Destabilize

**Verb:** destabilize
**Sound:** directional force

- smooth, low-frequency push
- no turbulence
- no randomness
- amplitude tied to force magnitude

| Parameter | Source | Mapping |
|-----------|--------|---------|
| Force tone | DriftVector magnitude | Amplitude proportional to |force| |
| Directional pan | DriftVector direction | Stereo position proportional to direction |
| Turbulence | --- | None (forbidden) |
| Randomness | --- | None (forbidden) |

### 4.5 Flickers --- Mislead

**Verb:** mislead
**Sound:** perceptual noise

- brief high-frequency flash
- ghostly after-echo
- no physicality
- no collision

| Parameter | Source | Mapping |
|-----------|--------|---------|
| Flash | FlickerTimer entering flash | High-frequency burst |
| After-echo | FlickerTimer entering afterimage | Decaying ghost tone |
| Physicality | --- | None (forbidden) |
| Duration | Flash window | Tied to flash duration |

### 4.6 Locks --- Restrict

**Verb:** restrict
**Sound:** constraint

- telegraph = harmonic swell
- lock = clean, instantaneous clamp
- no movement sound

| Parameter | Source | Mapping |
|-----------|--------|---------|
| Telegraph swell | LockState entering telegraph | Rising harmonic |
| Clamp | LockState entering locked | Clean, instantaneous click |
| Movement | --- | None (forbidden) |
| Release | LockState entering unlocked | Soft release tone |

---

## 5. Interaction Canon

### 5.1 Trace vs Red Orbs

- Trace RECOVERY sound only
- Red Orb unchanged
- No collision sound

### 5.2 Trace vs Crushers

- Crusher cycle continues
- Trace failure = low-pass collapse
- No explosion

### 5.3 Trace vs Drift Fields

- Drift Field force tone increases
- Trace enters RESISTANCE tone
- CORRECTION ticks appear

### 5.4 Trace vs Flickers

- Flicker flash
- Trace silent unless overcorrecting

### 5.5 Trace vs Locks

- Lock telegraph + clamp
- Trace adapts silently

### 5.6 High-Skill Interaction

At high skill:
- Trace's tones become nearly silent
- Chaos becomes predictable background texture
- The world feels calm
- The player hears only the essential

---

## 6. Procedural Audio Architecture

### 6.1 Architectural Philosophy

The audio engine must reflect the metaphysics of the world:
- **Deterministic** --- no randomness
- **State-driven** --- MotionState and ChaosState are the only drivers
- **Procedural** --- tones and transients generated from parameters, not samples
- **Minimal** --- silence is a design tool
- **Mechanical** --- no emotional contour, no musicality

This is not a soundtrack. This is a sonic instrumentation of control and disruption.

### 6.2 System Overview

The engine is composed of three layers, each independent and stateless:

1. **State Tone Layer** --- Continuous tones derived from Trace's MotionState.
2. **Transient Layer** --- Short impulses triggered by state transitions or micro-events.
3. **Chaos Layer** --- Procedural textures representing systemic forces.

All three layers mix into a **Master Bus** with strict dynamic range limits.

### 6.3 Audio Router (State Machine Audio Router)

A lightweight router that maps:

```
MotionState --> ToneProfile
MotionState --> TransientEvents
ChaosType   --> ChaosProfile
```

This router is the audio equivalent of the renderer's state switch.

### 6.4 Tone Generators (Procedural)

Each tone generator is a DSP unit capable of:
- sine / triangle / noise blend
- harmonic stacking
- phase modulation
- low-pass / high-pass filtering
- amplitude shaping

All parameters are driven by simulation values:
- `StabilityScalar`
- `ForceVector` magnitude
- `CorrectionMagnitude`
- `RecoveryTimer`

No envelopes longer than 200ms. No musical intervals.

### 6.5 Transient Engine

A micro-event engine that triggers clicks, ticks, thumps, and pressure onsets.

All transients must be:
- < 50ms
- non-percussive
- non-melodic
- non-emotional

Triggered by:
- MotionState transitions
- correction events
- recovery events
- chaos telegraphs

### 6.6 Chaos Texture Engine

Procedural textures for each chaos archetype:

| Archetype | Texture |
|-----------|---------|
| Red Orbs | Airy interference |
| Crushers | Mechanical cycle hum |
| Drift Fields | Directional force tone |
| Flickers | High-frequency flash |
| Locks | Harmonic swell + clamp |

Textures must be deterministic, loopable, parameter-driven, and non-reactive.

### 6.7 Master Bus

The final mix stage:
- strict dynamic range
- no reverb
- no delay
- no stereo widening
- optional stereo pan for Drift Fields only

Master bus must never sound "cinematic."

### 6.8 Data Flow

```
Simulation Layer
   |
   +-- MotionState
   +-- ForceVector
   +-- StabilityScalar
   +-- CorrectionMagnitude
   +-- RecoveryTimer
   +-- ChaosType
   +-- ChaosParams
        |
        v
Audio Router
        |
        +-- Tone Generator
        +-- Transient Engine
        +-- Chaos Texture Engine
        |
        v
Master Bus
        |
        v
Output
```

Everything is stateless except the Master Bus.

---

## 7. Procedural Audio Parameter Map

### 7.1 Trace Parameters

#### Inputs from Simulation

- `MotionState` (enum)
- `ForceVector` (vec2)
- `StabilityScalar` (float, 0.0--1.0)
- `CorrectionMagnitude` (float)
- `RecoveryTimer` (float)

#### Continuous Tone Parameters

| MotionState | Base Frequency | Modulation | Amplitude | Filter |
|-------------|---------------|------------|-----------|--------|
| ALIGNMENT | Low (60--80 Hz) | None | StabilityScalar x 0.05 | Open |
| COMMITMENT | Slight uptick (+5 Hz) | None | StabilityScalar x 0.08 | Slight brightness |
| RESISTANCE | Tension (+10 Hz) | Phase mod proportional to |ForceVector| | StabilityScalar x 0.12 | Narrowing |
| CORRECTION | Base | Micro-chirps (< 20ms) | CorrectionMag x 0.1 | Open |
| RECOVERY | Low (dipped) | None | 0.03 (fixed low) | Low-pass sweep (150ms) |

### 7.2 Chaos Parameters

#### Inputs from Simulation

- `ChaosType` (enum)
- `DriftVector` (vec2)
- `CrusherPhase` (float, 0--1)
- `FlickerTimer` (float)
- `LockState` (enum)

#### Per-Archetype Mapping

See Section 4 for the complete per-archetype parameter tables (Red Orbs, Crushers, Drift Fields, Flickers, Locks).

### 7.3 Global Rules

- No randomness
- No emotional contour
- No melodic intervals
- No percussive transients
- No reverb tails
- No stereo movement unless tied to force direction

---

## 8. Tone & Anti-Patterns

### 8.1 Tone Targets

The soundscape should evoke:
- focus
- tension
- clarity
- discipline
- inevitability
- calmness at mastery

### 8.2 Anti-Patterns (Never Allowed)

These break the tone instantly:

- melodic cues
- musical stingers
- emotional swells
- UI beeps
- arcade "success" sounds
- failure buzzers
- explosions
- cartoon impacts
- rhythmic percussion
- voice lines
- random noise
- screen shake sounds
- reverb tails
- side-chaining
- ducking

Trace is not a mascot. Chaos is not a villain. The world is not a game show.

---

## 9. Soundscape Moodboard

> This is not a spec. This is the feeling the soundscape should evoke. Use it to align intuition.

### 9.1 Trace's Inner World

**The sound of intention** --- A quiet hum, like a machine thinking without emotion.

**The sound of alignment** --- Almost nothing. A stillness that feels earned.

**The sound of commitment** --- A subtle forward pressure --- not speed, but direction.

**The sound of resistance** --- A low, steady tension, like leaning into wind.

**The sound of correction** --- Tiny, precise ticks --- the sound of refinement.

**The sound of recovery** --- A muted collapse, then clarity returning.

Trace's soundscape is the sound of discipline made audible.

### 9.2 The System's Outer World

**Red Orbs** --- Soft, airy noise that feels indifferent, not hostile.

**Crushers** --- A metronomic hum, like industrial machinery cycling.

**Drift Fields** --- A smooth, low-frequency push, like a current.

**Flickers** --- Brief flashes of high-frequency static.

**Locks** --- A harmonic swell, then a clean clamp.

Chaos sounds like rules, not enemies.

### 9.3 The Sound of Mastery

As the player improves:
- Trace becomes quieter
- Chaos becomes predictable
- The world becomes calmer

Mastery should sound like: **clarity, not triumph. Silence, not celebration. Control, not victory.**

### 9.4 Aesthetic Metaphor

If the visuals are "minimal neon metaphysics," the audio is:

**"A meditative machine learning to move."**

Not a robot. Not a human. Something in between --- a being of motion.

---

## 10. Appendices

### 10.1 Glossary

| Term | Definition |
|------|-----------|
| MotionState | Trace's current state in the 5-state FSM (Alignment, Commitment, Resistance, Correction, Recovery) |
| ChaosType | Archetype enum (RedOrb, Crusher, DriftField, Flicker, Lock) |
| StabilityScalar | Float 0.0--1.0 derived from cursor kinematics; 1.0 = perfectly stable |
| ForceVector | Vec2 representing external force on Trace (from Drift Fields, etc.) |
| CorrectionMagnitude | Float representing the magnitude of the current correction event |
| RecoveryTimer | Float representing time remaining in recovery state |
| CrusherPhase | Float 0--1 representing position in the Crusher's fixed cycle |
| FlickerTimer | Float representing position in the Flicker's flash/afterimage/invisible cycle |
| LockState | Enum representing Lock phase (telegraph, locked, unlocked) |
| ToneProfile | Audio parameter set for a given MotionState |
| ChaosProfile | Audio parameter set for a given ChaosType |

### 10.2 Audio Routing Table

```
MotionState.Alignment   --> AlignmentToneProfile   + (no transient)
MotionState.Commitment  --> CommitmentToneProfile   + SoftClick
MotionState.Resistance  --> ResistanceToneProfile   + PressureOnset
MotionState.Correction  --> CorrectionToneProfile   + CorrectionTick
MotionState.Recovery    --> RecoveryToneProfile      + MutedThump

ChaosType.RedOrb        --> InterferenceTexture
ChaosType.Crusher       --> CycleHumTexture
ChaosType.DriftField    --> ForceToneTexture
ChaosType.Flicker       --> FlashTexture
ChaosType.Lock          --> ConstraintTexture
```

### 10.3 Implementation Notes

- All DSP units must be deterministic --- no platform-dependent float behavior in the audio thread
- Tone generators use sine/triangle/noise blend with harmonic stacking
- Phase modulation depth driven by `|ForceVector|`
- All filtering is first-order (low-pass / high-pass) for predictability
- Master bus enforces strict dynamic range; no compression, no limiting beyond clamp
- Performance target: < 1ms per audio quantum at 48kHz

### 10.4 Future Extensions

- Additional chaos archetypes beyond the core 5
- Environmental audio layers (ambient field tones tied to level geometry)
- Accessibility modes (visual-only mode with audio disabled; haptic feedback as audio substitute)
- Spatial audio for multi-chaos scenarios (positional mixing)

---

## Source Documents

This canon consolidates four individual design documents:

| Document | Original File |
|----------|--------------|
| Sound Design Bible v1 | [`sound-design-bible.md`](sound-design-bible.md) |
| Procedural Audio Parameter Map v1 | [`procedural-audio-parameter-map.md`](procedural-audio-parameter-map.md) |
| Audio Engine Architecture Spec v1 | [`audio-engine-architecture.md`](audio-engine-architecture.md) |
| Soundscape Moodboard | [`soundscape-moodboard.md`](soundscape-moodboard.md) |

The individual files remain in the repository for granular reference. This canon is the unified authority.
