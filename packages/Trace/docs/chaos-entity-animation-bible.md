# Chaos Entity Animation Bible

> Complete motion, behavior, and expression spec for all hostile system entities.
> Chaos entities are not characters. They are behaviors made visible — mechanical expressions of disruption.

---

## I. Core Principles of Chaos Motion

These rules apply to all chaos entities.

### 1. Chaos is deterministic

No randomness in animation. Chaos is predictable disruption, not unpredictability.

### 2. Chaos is legible

Players must understand the intent of each entity through motion alone.

### 3. Chaos is indifferent

Chaos does not target Trace. Chaos does not react to Trace. Chaos simply behaves.

### 4. Chaos is consistent

Each archetype expresses one verb. Never more.

### 5. Chaos is mechanical, not emotional

No flinching. No anger. No "aggression." Only behavior.

---

## II. Archetype Animation Specs

Each chaos archetype has a unique motion identity. These are strict — do not improvise.

---

### 1. RED ORBS — Disruptors

**Verb:** disrupt
**Attacks:** spatial prediction & calm motion

#### Motion Identity

- Smooth, drifting movement
- Nonlinear but bounded
- No sudden direction changes
- No acceleration spikes
- No targeting behavior

#### Animation Rules

- Movement must follow a spline or curve
- Speed variance must be subtle
- Never stop abruptly
- Never jitter
- Never "notice" Trace

#### Telegraphing

- Slight color intensification when crossing Trace's likely path
- No pulsing, no flashing

#### Failure Cues

None. Red Orbs do not react to collisions or Trace.

#### Forbidden

- Homing behavior
- Erratic jitter
- Emotional cues
- Speed bursts

---

### 2. CRUSHERS — Binary Punishers

**Verb:** constrain
**Attacks:** hesitation & indecision

#### Motion Identity

- Perfectly predictable cycles
- Linear or rotational movement
- Full extension -> full retraction
- No mid-cycle variation

#### Animation Rules

- Movement must be clock-like
- Timing must be exact
- No easing — linear or constant acceleration only
- No wobble at endpoints

#### Telegraphing

- Clear pre-movement hold
- Slight color shift before activation
- No sound spikes

#### Failure Cues

- Minimal screen shake (the only allowed shake in the game)
- Crusher itself does not react

#### Forbidden

- Fake-outs
- Variable timing
- Expressive anticipation
- "Angry" slams

---

### 3. DRIFT FIELDS — Entropy Zones

**Verb:** destabilize
**Attacks:** fine motor control

#### Motion Identity

Drift Fields do not move — they apply motion.

#### Visual Identity

- Subtle directional texture
- Slow, continuous flow
- No flicker, no noise

#### Animation Rules

- Texture must move at a constant rate
- Direction must be visually clear
- No sudden reversals
- No turbulence

#### Telegraphing

- Slight intensification at edges
- No pulsing

#### Failure Cues

None. Drift Fields are passive.

#### Forbidden

- Rapid animation
- Chaotic noise
- Randomized flow

---

### 4. FLICKERS — Deceptive Signals

**Verb:** mislead
**Attacks:** perception & attention

#### Motion Identity

- Appear briefly
- Vanish instantly
- Leave ghost afterimages
- No physical presence

#### Animation Rules

- Flash duration must be consistent
- Afterimages must fade smoothly
- No collision
- No force application

#### Telegraphing

None. Flickers are the telegraph.

#### Failure Cues

None. Flickers never cause failure directly.

#### Forbidden

- Lingering too long
- Movement
- Interaction with Trace
- Physicality

---

### 5. LOCKS — Control Denial

**Verb:** restrict
**Attacks:** adaptability

#### Motion Identity

Locks do not move — they change Trace's constraints.

#### Visual Identity

- Axis indicators
- Minimal iconography
- Clear, static shapes

#### Animation Rules

- Telegraph must be clear and slow
- Activation must be instantaneous
- No pulsing
- No decorative animation

#### Telegraphing

- Faint glow along restricted axis
- Subtle color shift

#### Failure Cues

None. Locks do not cause failure directly.

#### Forbidden

- Sudden activation without telegraph
- Movement
- Expressive animation

---

## III. Chaos Interaction Rules

1. **Chaos never reacts to Trace.** No flinching, no avoidance, no targeting.
2. **Chaos never changes behavior mid-run.** Unless explicitly designed as a timing mechanic (Crushers).
3. **Chaos never expresses emotion.** No anger, no frustration, no triumph.
4. **Chaos never overlaps archetypes.** Each entity trains one skill. No hybrid behaviors.

---

## IV. Chaos Visual Feedback

1. **No celebration on success.** Chaos does not "win."
2. **No recoil on collision.** Chaos is indifferent.
3. **No sound spikes.** Audio must be minimal and mechanical.
4. **No particle effects.** Particles imply emotion or drama.

---

## V. Anti-Patterns (Never Allowed)

- Cartoon squash/stretch
- Expressive wobble
- Homing behavior
- Random jitter
- Emotional color changes
- "Angry" slams
- Comedic timing
- Decorative particles
- Unpredictable movement
- Reactive animation

Chaos is not alive. Chaos is a system.

---

## VI. Animation QA Checklist

Before approving any chaos animation:

- [ ] Does this entity express one verb?
- [ ] Is the motion deterministic?
- [ ] Is the behavior legible?
- [ ] Does the entity remain indifferent to Trace?
- [ ] Does the animation avoid all anti-patterns?
- [ ] Does the motion reinforce the mechanical metaphysics of the world?
- [ ] Does mastery make the encounter calmer, not flashier?

If any answer is "no," revise.
