# Chaos Entity Renderer Integration Notes

> How each chaos archetype maps to rendering parameters in GameRenderer

Chaos entities are not animated characters.
They are visualized behaviors.

Their rendering must be:
- deterministic
- legible
- minimal
- indifferent
- consistent

These notes define exactly how to implement that.

---

## I. Renderer Inputs for Chaos Entities

Each chaos entity type requires a small, predictable set of inputs from the simulation layer.

### 1. ChaosType (enum)

One of:
- RED_ORB
- CRUSHER
- DRIFT_FIELD
- FLICKER
- LOCK

### 2. Position / Bounds

- Red Orbs → position
- Crushers → position + extent
- Drift Fields → region bounds
- Flickers → position
- Locks → region or axis indicator

### 3. Behavior Parameters

These come directly from the simulation:
- **Red Orb:** drift vector, region bounds
- **Crusher:** cycle phase (0–1), active/inactive
- **Drift Field:** force vector
- **Flicker:** flash timer
- **Lock:** axis restriction state

### 4. No emotional or reactive parameters

Chaos never reacts to Trace.
Renderer must not expect or support such inputs.

---

## II. ChaosRenderProfile Table

Each chaos archetype maps to a ChaosRenderProfile — a small struct of visual parameters.

```
struct ChaosRenderProfile {
    Color fillColor;
    Color edgeColor;
    float edgeThickness;
    float glowStrength;
    float opacity;
    vec2  directionalFlow;   // for Drift Fields only
}
```

---

## III. Archetype Rendering Specs

### 1. RED ORBS — DISRUPTORS

**Visual Identity**
- Soft red fill
- No texture
- No glow
- No pulsing
- No animation beyond positional drift

**ChaosRenderProfile**
```
fillColor       = RedBase
edgeColor       = RedEdge
edgeThickness   = thin
glowStrength    = 0
opacity         = 1.0
directionalFlow = (0,0)
```

**Renderer Behavior**
- Draw as a simple orb
- Movement is handled by simulation; renderer does not interpolate
- No reaction on collision
- No color change on proximity

**Forbidden:** Pulsing, Flicker, Speed lines, Reactive glow

---

### 2. CRUSHERS — BINARY PUNISHERS

**Visual Identity**
- Rectangular or bar-like
- High contrast
- Sharp edges
- Clear open/closed states

**ChaosRenderProfile**
```
fillColor       = CrusherBase
edgeColor       = CrusherEdge
edgeThickness   = medium
glowStrength    = 0
opacity         = 1.0
directionalFlow = (0,0)
```

**Renderer Behavior**
- Render as a solid block
- Position/extent determined by simulation
- No easing — movement must be linear or constant acceleration
- Optional: slight color intensification during telegraph

**Allowed Feedback:** Minimal screen shake on Trace failure (only place in game)

**Forbidden:** Bouncy movement, Expressive anticipation, Variable timing

---

### 3. DRIFT FIELDS — ENTROPY ZONES

**Visual Identity**
- Subtle directional texture or gradient
- Slow, continuous flow
- No noise
- No flicker

**ChaosRenderProfile**
```
fillColor       = DriftBase
edgeColor       = none
edgeThickness   = 0
glowStrength    = 0
opacity         = 0.4–0.6
directionalFlow = normalized(forceVector)
```

**Renderer Behavior**
- Render as a region overlay
- Apply a slow scrolling texture in the direction of force
- Texture speed = force magnitude * constant
- No sudden reversals
- No turbulence

**Forbidden:** Rapid animation, Pulsing, Randomized flow

---

### 4. FLICKERS — DECEPTIVE SIGNALS

**Visual Identity**
- Brief flashes
- Ghost afterimages
- No physical presence
- No collision

**ChaosRenderProfile**
```
fillColor       = FlickerColor
edgeColor       = none
edgeThickness   = 0
glowStrength    = 0
opacity         = flashTimerNormalized
directionalFlow = (0,0)
```

**Renderer Behavior**
- Render only during flash window
- Fade out afterimage smoothly
- No movement
- No interaction

**Forbidden:** Lingering too long, Movement, Physicality

---

### 5. LOCKS — CONTROL DENIAL

**Visual Identity**
- Axis indicators
- Minimal iconography
- Static shapes

**ChaosRenderProfile**
```
fillColor       = LockBase
edgeColor       = LockEdge
edgeThickness   = thin
glowStrength    = 0
opacity         = 1.0
directionalFlow = (0,0)
```

**Renderer Behavior**
- Render axis restriction lines or bars
- Telegraph with slight color shift
- Activation is instantaneous (no animation)

**Forbidden:** Movement, Pulsing, Decorative animation

---

## IV. Global Chaos Rendering Rules

### 1. No entity reacts to Trace

Renderer must not implement:
- flinch
- avoidance
- targeting
- color change on proximity

### 2. No entity animates emotionally

No:
- squash/stretch
- bounce
- wobble
- expressive timing

### 3. No entity uses particle effects

Particles imply emotion or drama.

### 4. No entity uses bloom or heavy glow

Glow is reserved for Trace's stability.

### 5. No entity uses random noise

Chaos is deterministic.

---

## V. Integration Steps (Engineering Checklist)

1. **Add ChaosType enum to renderer** — Matches simulation.
2. **Implement ChaosRenderProfile table** — One profile per archetype.
3. **Bind simulation parameters** — Position, bounds, force vectors, cycle phase, flash timers.
4. **Implement archetype-specific draw functions:**
   - `DrawRedOrb()`
   - `DrawCrusher()`
   - `DrawDriftField()`
   - `DrawFlicker()`
   - `DrawLock()`
5. **Validate against anti-patterns** — No bounce, no pulse, no emotion.
6. **Test in sandbox** — Each chaos type must be tested in isolation before content integration.

---

## VI. What This Gives You

- Chaos that feels systemic, not alive
- Visual clarity that reinforces skill training
- Deterministic behavior that supports mastery
- A renderer that matches the philosophical tone
- A scalable foundation for future chaos archetypes

This is the renderer-side expression of the Chaos Entity Animation Bible.
