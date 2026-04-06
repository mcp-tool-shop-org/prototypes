# Renderer Integration Notes (Trace)

> How Trace's motion state machine drives rendering in GameRenderer

---

## I. High-Level Architecture

Trace's rendering is a pure function of state.

```
VisualState = RenderProfile[MotionState]
```

There is no animation timeline, no tweening system, no sprite sheets.
Everything is:
- parametric
- deterministic
- state-driven

This keeps Trace's identity clean and the renderer simple.

---

## II. Required Inputs to the Renderer

The renderer needs exactly three inputs from the simulation layer:

### 1. MotionState (enum)

One of:
- ALIGNMENT
- COMMITMENT
- RESISTANCE
- CORRECTION
- RECOVERY

### 2. ForceVector (vec2)

Only meaningful in RESISTANCE and DRIFT FIELD contexts.
Zero vector otherwise.

### 3. StabilityScalar (0.0–1.0)

A continuous measure of Trace's internal stability.
Used for subtle glow, edge clarity, and micro-feedback.

---

## III. RenderProfile Table

Each MotionState maps to a RenderProfile — a small struct of visual parameters.

### RenderProfile Fields

```
struct RenderProfile {
    Color fillColor;
    Color edgeColor;
    float edgeThickness;
    float glowStrength;
    vec2  directionalBias;   // small offset for commitment/resistance
    float desaturation;      // for recovery
}
```

### State → Profile Mapping

**ALIGNMENT**
- fillColor = BaseColor
- edgeColor = BaseEdge
- edgeThickness = thin
- glowStrength = StabilityScalar * 0.1
- directionalBias = (0,0)
- desaturation = 0

**COMMITMENT**
- fillColor = BaseColor
- edgeColor = SlightForwardTint
- edgeThickness = thin
- glowStrength = StabilityScalar * 0.15
- directionalBias = normalized(velocity) * 0.02
- desaturation = 0

**RESISTANCE**
- fillColor = BaseColor
- edgeColor = CounterforceTint
- edgeThickness = medium
- glowStrength = StabilityScalar * 0.2
- directionalBias = -normalize(ForceVector) * 0.03
- desaturation = 0

**CORRECTION**
- fillColor = BaseColor
- edgeColor = HighlightTint
- edgeThickness = thin
- glowStrength = StabilityScalar * 0.25
- directionalBias = small correction vector (optional)
- desaturation = 0

**RECOVERY**
- fillColor = BaseColor
- edgeColor = BaseEdge
- edgeThickness = thin
- glowStrength = 0
- directionalBias = (0,0)
- desaturation = 0.3 → 0 over 150ms

---

## IV. How to Apply Directional Bias

Directional bias is a sub-pixel offset applied to the orb's fill or edge gradient.

It must be:
- subtle
- never animated independently
- always derived from simulation vectors

Examples:
- COMMITMENT → bias in direction of motion
- RESISTANCE → bias opposite force
- CORRECTION → bias toward correction vector (optional)

This is the closest Trace ever gets to "body language."

---

## V. Glow Logic

Glow is not a bloom effect.
Glow is a soft, low-intensity halo whose strength is:

```
glowStrength = StabilityScalar * GlowMultiplier
```

GlowMultiplier varies by state:
- Alignment: 0.1
- Commitment: 0.15
- Resistance: 0.2
- Correction: 0.25
- Recovery: 0

Glow must never pulse, animate, or flicker.

---

## VI. Edge Highlight Logic

Edge highlight is the renderer's way of expressing:
- correction
- pressure
- clarity

Rules:
- Correction → brief edge brightening
- Resistance → directional edge tint
- Commitment → forward edge tint
- Alignment → neutral edge
- Recovery → neutral edge, slight desaturation

Edge thickness must never exceed "medium."

---

## VII. Desaturation Logic (Recovery Only)

Recovery is the only state that uses desaturation.

```
desaturation = lerp(0.3, 0.0, t)
```

Where `t` is time since entering Recovery (150–200ms).
This is the only time Trace's color changes in a way that resembles "feedback."

---

## VIII. Forbidden Rendering Behaviors

These must never appear in the renderer:
- pulsing
- wobbling
- squash/stretch
- bounce
- trails that imply speed
- particle effects
- expressive color changes
- idle animations
- jitter not caused by simulation
- decorative gradients

Trace is a being of control.
The renderer must reflect that.

---

## IX. Integration Steps (Engineering Checklist)

1. **Add MotionState enum to simulation layer** — Already defined by the state machine. ✅
2. **Expose MotionState + ForceVector + StabilityScalar to renderer** — One struct per frame.
3. **Implement RenderProfile table** — Hard-coded or data-driven.
4. **Add color-by-state logic** — Simple switch on MotionState. ✅
5. **Add directional bias logic** — Small gradient offset.
6. **Add desaturation logic for Recovery** — Short timed fade.
7. **Add glowStrength parameter** — Multiply by StabilityScalar.
8. **Validate against anti-patterns** — No bounce, no pulse, no decoration.

---

## X. What This Gives You

- A renderer that expresses Trace's identity with zero animation assets
- A clean separation between simulation and presentation
- A deterministic, reproducible visual language
- A system that scales across modes without rework
- A visual identity that matches the philosophical tone

This is the exact rendering architecture Trace needs.
