# Audio Engine Architecture Spec v1

> Deterministic, state-driven, procedural audio for Trace and Chaos.

---

## I. Architectural Philosophy

The audio engine must reflect the metaphysics of the world:

- **Deterministic** — no randomness
- **State-driven** — MotionState and ChaosState are the only drivers
- **Procedural** — tones and transients generated from parameters, not samples
- **Minimal** — silence is a design tool
- **Mechanical** — no emotional contour, no musicality

This is not a soundtrack.
This is a sonic instrumentation of control and disruption.

---

## II. High-Level Architecture

The engine is composed of three layers, each independent and stateless:

1. **State Tone Layer** — Continuous tones derived from Trace's MotionState.
2. **Transient Layer** — Short impulses triggered by state transitions or micro-events.
3. **Chaos Layer** — Procedural textures representing systemic forces.

All three layers mix into a **Master Bus** with strict dynamic range limits.

---

## III. Core Components

### 1. State Machine Audio Router

A lightweight router that maps:

```
MotionState → ToneProfile
MotionState → TransientEvents
ChaosType   → ChaosProfile
```

This router is the audio equivalent of the renderer's state switch.

### 2. Procedural Tone Generators

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

No envelopes longer than 200ms.
No musical intervals.

### 3. Transient Engine

A micro-event engine that triggers:

- clicks
- ticks
- thumps
- pressure onsets

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

### 4. Chaos Texture Engine

Procedural textures for each chaos archetype:

- **Red Orbs:** airy interference
- **Crushers:** mechanical cycle hum
- **Drift Fields:** directional force tone
- **Flickers:** high-frequency flash
- **Locks:** harmonic swell + clamp

Textures must be:

- deterministic
- loopable
- parameter-driven
- non-reactive

### 5. Master Bus

The final mix stage:

- strict dynamic range
- no reverb
- no delay
- no stereo widening
- optional stereo pan for Drift Fields only

Master bus must never sound "cinematic."

---

## IV. Data Flow

```
Simulation Layer
   │
   ├── MotionState
   ├── ForceVector
   ├── StabilityScalar
   ├── CorrectionMagnitude
   ├── RecoveryTimer
   ├── ChaosType
   └── ChaosParams
        │
        ▼
Audio Router
        │
        ├── Tone Generator
        ├── Transient Engine
        └── Chaos Texture Engine
        │
        ▼
Master Bus
        │
        ▼
Output
```

Everything is stateless except the Master Bus.

---

## V. Anti-Patterns (Engine Level)

- No sample playback except for ultra-short transients
- No randomization
- No musical scales
- No reverb tails
- No side-chaining
- No ducking
- No emotional contour
- No "UI sound" aesthetic

The engine must sound like discipline under pressure, not a game.

---

## VI. What This Architecture Enables

- Perfect alignment with Trace's motion system
- A soundscape that becomes calmer as the player improves
- Zero reliance on assets
- Infinite scalability across modes
- A unique, premium audio identity

This is the audio engine Trace requires.
