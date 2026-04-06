# Chaos Behavior State Machines

> Per-archetype state machines for all five chaos entity types.
> Intentionally simple, deterministic, and directly implementable as enums + transition logic.

---

## 1. Red Orbs — Disruptors

**States:**
- `IDLE_DRIFT` — drifting within region
- `BOUNDARY_TURN` — reversing/curving at region edge

**Diagram:**
```
IDLE_DRIFT
   │ hit region boundary
   ▼
BOUNDARY_TURN
   │ turn complete
   ▼
IDLE_DRIFT
```

**Notes:**
- No "aggro", no "targeting", no reaction to Trace.
- Drift vector is updated only in `BOUNDARY_TURN`.

---

## 2. Crushers — Binary Punishers

**States:**
- `INACTIVE` — corridor open
- `TELEGRAPH` — warning phase
- `ACTIVE` — corridor closed

**Diagram:**
```
INACTIVE
   │ cycle timer
   ▼
TELEGRAPH
   │ telegraph duration elapsed
   ▼
ACTIVE
   │ active duration elapsed
   ▼
INACTIVE
```

**Notes:**
- Cycle timing is fixed and deterministic.
- No mid-cycle changes, no fake-outs.

---

## 3. Drift Fields — Entropy Zones

Drift Fields are effectively stateless from a behavior perspective.

**State:**
- `APPLY_FORCE` — always on

**Diagram:**
```
APPLY_FORCE (constant)
```

**Notes:**
- Force vector may be constant or slowly rotating (driven by a param, not a state change).
- No on/off, no pulses.

---

## 4. Flickers — Deceptive Signals

**States:**
- `INVISIBLE` — not rendered
- `FLASH` — visible flash
- `AFTERIMAGE` — fading ghost

**Diagram:**
```
INVISIBLE
   │ trigger
   ▼
FLASH
   │ flash duration elapsed
   ▼
AFTERIMAGE
   │ fade duration elapsed
   ▼
INVISIBLE
```

**Notes:**
- No collision in any state.
- No movement; only opacity changes.

---

## 5. Locks — Control Denial

**States:**
- `UNLOCKED` — no constraint
- `TELEGRAPH` — upcoming constraint
- `LOCKED` — axis/speed constraint active

**Diagram:**
```
UNLOCKED
   │ lock trigger
   ▼
TELEGRAPH
   │ telegraph duration elapsed
   ▼
LOCKED
   │ lock duration elapsed
   ▼
UNLOCKED
```

**Notes:**
- Locks never move; only Trace's constraints change.
- Telegraph is mandatory and deterministic.
