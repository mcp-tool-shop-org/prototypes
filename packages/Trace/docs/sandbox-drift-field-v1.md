# Sandbox Villain v1 — Drift Field (Entropy Zone)

> First proof. If this works, the villain system works. If it doesn't, we learn why early and cheaply.

---

## Why Drift Field First

- Directly tests real mouse skill (steady hand, compensation)
- Creates visible improvement without adding systems
- Immediately distinguishes from aim trainers
- Embodies the thesis: control under pressure

Red Orbs are great, but Drift Fields are more honest as a first proof.

---

## 1. Villain Identity (Locked)

| Property | Value |
|----------|-------|
| **Name** | Drift Field |
| **Archetype** | Passive destabilization |
| **Role** | Entropy made visible |
| **Intent** | Push Trace off its intended path without ever "attacking" |

Drift Fields do not chase. They do not react. They apply pressure and wait.

---

## 2. Mechanical Definition (Exact)

### Core Behavior

- Applies a continuous force vector to Trace
- Force is applied every simulation tick
- No impulses, no spikes, no randomness

### Force Parameters (Sandbox Defaults)

| Parameter | Value |
|-----------|-------|
| **Magnitude** | Constant (0.6-1.2 units/sec^2) |
| **Direction A** | Fixed (e.g. downward) |
| **Direction B** | Slow rotation (max 15 deg/sec) |
| **Falloff** | None (uniform across the field) |

### Visual Rules

- The field is clearly visible
- Direction is readable (subtle flow lines, particles, or gradient)
- No flicker, no deception, no sudden changes

If a player says "I didn't know which way it was pushing me," the design failed.

---

## 3. Player Interaction (No Skills)

Trace has no abilities here. The only tools available:

- Hand steadiness
- Micro-compensation
- Restraint

The correct response is continuous counterforce, not avoidance.

---

## 4. Failure Model

Every failure must map to one of three sentences:

- "I overcorrected."
- "I didn't compensate enough."
- "I panicked."

If you ever hear:

- "That was unfair."
- "It moved weird."
- "I couldn't tell what happened."

The field is wrong. Stop. Redesign.

---

## 5. Success Model

| Skill Level | What It Looks Like |
|-------------|-------------------|
| **Low** | Jittery motion, zig-zag path, visible struggle, overcorrections |
| **Medium** | Fewer corrections, occasional oscillation, path mostly intact |
| **High** | Smooth line, no visible drama, almost boring to watch |

**Non-negotiable:** If mastery looks exciting, the villain is lying.

---

## Scenario B — Drift Delivery

### Purpose

Validate that passive continuous force + fragile carry produces legible challenge, visible improvement, and calm mastery at high skill. If this scenario fails, the villain fails.

### Scenario Identity

| Property | Value |
|----------|-------|
| **Internal name** | DriftDelivery_B1 |
| **Primary villain** | Drift Field |
| **Primary skill** | Grip stability & counterforce discipline |
| **Secondary pressures** | None allowed |

---

### World Layout

```
[Start Zone]  -->  [Drift Field Zone]  -->  [Delivery Zone]
   safe               constant force           static target
```

| Dimension | Value |
|-----------|-------|
| Total path length | ~1200 px |
| Drift Field length | ~600 px |
| Path width | Generous (not a maze) |
| Delivery Zone radius | Forgiving (initially) |

All zones must be visually distinct. This is not about navigation. It's about holding control under pressure.

---

### Fragile Orb Rules (Critical)

The carried orb is the entire point of this scenario.

**Carry Behavior:**

- Orb is attached to Trace with soft constraint
- Moves with Trace, but lags slightly
- Excess acceleration introduces wobble

**Drop Conditions — Orb is dropped if:**

- Trace's acceleration exceeds threshold
- Orb touches corridor boundary
- Sudden direction reversals occur

No random drops. No hidden timers.

**Key Principle:** The orb punishes panic, not difficulty.

---

### Drift Field Behavior (Exact)

**Force Model:**

- Continuous force applied every tick
- Magnitude constant (start moderate)
- Direction fixed (e.g. downward)

**Visual Legibility:**

- Flow lines show direction
- No flicker, no pulses
- A player must be able to say "It's pushing me down" immediately

---

### Player Loop (Moment-to-Moment)

1. Pick up orb
2. Enter Drift Field
3. Feel constant pressure
4. Compensate smoothly
5. Maintain calm motion
6. Exit field
7. Deliver orb cleanly

Nothing else happens.

---

### Failure States (Canonical)

Every failure must map to one of these:

- "I overcorrected."
- "I moved too fast."
- "I didn't compensate enough."

If you hear "It slipped randomly" or "I didn't know why it dropped" — stop, redesign.

---

### Success States

| Level | Behavior |
|-------|----------|
| **Low** | Visible wobble, jerky micro-corrections, orb oscillation, eventual drop |
| **Medium** | Reduced wobble, occasional correction spikes, orb survives with effort |
| **High** | Smooth line, constant offset compensation, orb appears glued in place, run looks boring |

This visual progression is mandatory.

---

### Audio Rules (Minimal, Supportive)

| Event | Sound |
|-------|-------|
| Pickup | Soft confirmation |
| Drift pressure | Subtle continuous tone (optional) |
| Wobble | Slight warning modulation |
| Drop | Clear, calm failure sound |

No harshness. No punishment tone.

---

### Sandbox Benchmarks (Hard Gates)

Do not move forward until all are true:

- [ ] New player can explain the challenge after 10 seconds
- [ ] Repeating the same run produces visible improvement
- [ ] Optimal play is smooth, not reactive
- [ ] Watching a skilled run feels calm
- [ ] Turning off UI still leaves the challenge legible

Fail one — iterate only this scenario.

---

### What You Do NOT Add Yet

To protect the sandbox:

- No time limit
- No scoring
- No red orbs
- No skills
- No difficulty ramp
- No narrative text

Just pressure + fragility.
