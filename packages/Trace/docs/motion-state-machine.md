# Motion State Machine — Implementation Spec

> Canonical state machine for Trace's movement logic.
> This is not a suggestion — this is the only allowed structure.

---

## State Machine Overview

```
                ┌──────────────┐
                │  ALIGNMENT   │
                └──────┬───────┘
                       │
                       │ Commit
                       ▼
                ┌──────────────┐
                │ COMMITMENT   │
                └──────┬───────┘
                       │
                       │ Encounter Force
                       ▼
                ┌──────────────┐
                │ RESISTANCE   │
                └──────┬───────┘
                       │
                       │ Stabilize
                       ▼
                ┌──────────────┐
                │ CORRECTION   │
                └──────┬───────┘
                       │
                       │ Refine
                       ▼
                ┌──────────────┐
                │  ALIGNMENT   │
                └──────────────┘
```

### Recovery Loop (Failure Micro-Slip)

```
ALIGNMENT
   │ Slip
   ▼
RECOVERY
   │ Regain
   ▼
ALIGNMENT
```

---

## State Definitions

### 1. ALIGNMENT

Neutral, stable, calm. Minimal drift. Ready to commit. No jitter.

| | Conditions |
|-|------------|
| **Entry** | Start of movement, after Correction, after Recovery |
| **Exit** | Player commits to a path (-> Commitment), slip occurs (-> Recovery) |

---

### 2. COMMITMENT

Decisive acceleration. Straightened trajectory. No hesitation.

| | Conditions |
|-|------------|
| **Entry** | Player initiates a deliberate path, timing window opens |
| **Exit** | External force encountered (-> Resistance) |

---

### 3. RESISTANCE

Counterforce lean. Controlled compensation. No overcorrection.

| | Conditions |
|-|------------|
| **Entry** | Drift Field, environmental push, destabilizing zone |
| **Exit** | Force stabilizes (-> Correction) |

---

### 4. CORRECTION

Micro-adjustments. Low amplitude. High precision.

| | Conditions |
|-|------------|
| **Entry** | Leaving a force zone, post-resistance refinement |
| **Exit** | Path stabilized (-> Alignment) |

---

### 5. RECOVERY

Brief recoil. Controlled deceleration. Return to alignment.

| | Conditions |
|-|------------|
| **Entry** | Minor collision, timing slip, jitter spike |
| **Exit** | Stability regained (-> Alignment) |

---

## Forbidden Transitions

| Forbidden | Reason |
|-----------|--------|
| Alignment -> Resistance | Must commit first |
| Commitment -> Recovery | Must resist first |
| Recovery -> Commitment | Must align first |
| Correction -> Commitment | Must align first |
| Resistance -> Alignment | Must pass through Correction |

These rules preserve Trace's internal logic and tone.
