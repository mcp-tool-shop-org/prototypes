# Procedural Audio Parameter Map v1

> A deterministic parameter system for Trace + Chaos audio.
> Engineering-ready mapping of simulation variables → audio parameters.

---

## I. Trace Parameter Map

### Inputs from Simulation

- `MotionState` (enum)
- `ForceVector` (vec2)
- `StabilityScalar` (float, 0.0–1.0)
- `CorrectionMagnitude` (float)
- `RecoveryTimer` (float)

### 1. Continuous Tone Parameters

| MotionState | Base Frequency | Modulation | Amplitude | Filter |
|-------------|---------------|------------|-----------|--------|
| ALIGNMENT | Low (60–80 Hz) | None | StabilityScalar × 0.05 | Open |
| COMMITMENT | Slight uptick (+5 Hz) | None | StabilityScalar × 0.08 | Slight brightness |
| RESISTANCE | Tension (+10 Hz) | Phase mod ∝ \|ForceVector\| | StabilityScalar × 0.12 | Narrowing |
| CORRECTION | Base | Micro-chirps (< 20ms) | CorrectionMag × 0.1 | Open |
| RECOVERY | Low (dipped) | None | 0.03 (fixed low) | Low-pass sweep (150ms) |

### 2. Transient Parameters

| Trigger | Sound Type | Duration | Amplitude |
|---------|-----------|----------|-----------|
| Enter COMMITMENT | Soft click | < 30ms | 0.15 |
| Enter RESISTANCE | Pressure onset | < 50ms | ForceVector magnitude × 0.1 |
| Correction tick | Corrective tick | < 20ms | CorrectionMagnitude × 0.08 |
| Enter RECOVERY | Muted thump | < 50ms | 0.12 |

---

## II. Chaos Parameter Map

### Inputs from Simulation

- `ChaosType` (enum)
- `DriftVector` (vec2)
- `CrusherPhase` (float, 0–1)
- `FlickerTimer` (float)
- `LockState` (enum)

### 1. Red Orbs

| Parameter | Source | Mapping |
|-----------|--------|---------|
| Interference noise | Position relative to Trace | Amplitude ∝ proximity |
| Whoosh | Crossing Trace's path | Brief amplitude spike |
| Drift tone | Drift vector | Slight pitch shift ∝ speed |
| Impact | — | None (forbidden) |

### 2. Crushers

| Parameter | Source | Mapping |
|-----------|--------|---------|
| Cycle hum | CrusherPhase | Continuous, phase-locked |
| Telegraph harmonic | Phase entering telegraph | Rising frequency over telegraph duration |
| Active pressure | Phase entering active | Low, oppressive tone |
| Impact | Trace in active zone | Low-frequency emphasis (only place in game) |

### 3. Drift Fields

| Parameter | Source | Mapping |
|-----------|--------|---------|
| Force tone | DriftVector magnitude | Amplitude ∝ \|force\| |
| Directional pan | DriftVector direction | Stereo position ∝ direction |
| Turbulence | — | None (forbidden) |
| Randomness | — | None (forbidden) |

### 4. Flickers

| Parameter | Source | Mapping |
|-----------|--------|---------|
| Flash | FlickerTimer entering flash | High-frequency burst |
| After-echo | FlickerTimer entering afterimage | Decaying ghost tone |
| Physicality | — | None (forbidden) |
| Duration | Flash window | Tied to flash duration |

### 5. Locks

| Parameter | Source | Mapping |
|-----------|--------|---------|
| Telegraph swell | LockState entering telegraph | Rising harmonic |
| Clamp | LockState entering locked | Clean, instantaneous click |
| Movement | — | None (forbidden) |
| Release | LockState entering unlocked | Soft release tone |

---

## III. Global Audio Rules

- No randomness
- No emotional contour
- No melodic intervals
- No percussive transients
- No reverb tails
- No stereo movement unless tied to force direction

---

## IV. What This Parameter Map Enables

- Fully procedural audio
- Perfect alignment with Trace's motion system
- Deterministic, reproducible sound behavior
- A soundscape that evolves with player skill
- Zero reliance on samples or assets

This is the audio engine Trace deserves.
