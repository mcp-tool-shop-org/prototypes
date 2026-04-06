# Sound Design Bible v1

> The complete audio metaphysics for Trace and the hostile system.

---

## I. First Principles

### 1. Sound = State

Audio does not decorate.
Audio communicates Trace's internal discipline and the system's external pressure.

Every sound must communicate:
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

### 2. No Emotion, No Drama

No musical cues.
No emotional swells.
No "success" or "failure" sounds.

### 3. Deterministic, Not Random

Procedural audio must be:
- predictable
- repeatable
- parameter-driven

Chaos is not noise. Chaos is structured disruption.

### 4. Silence Is a Tool

High-skill play should sound quiet.
Silence is the audio expression of mastery.

---

## II. Trace Audio Identity

Trace's soundscape is built from three layers:

### 1. Continuous Tone Layer (State Tone)

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

### 2. Transient Layer (Micro-Events)

Short, precise, non-musical impulses.

Examples:
- COMMITMENT entry → soft click
- RESISTANCE entry → subtle pressure onset
- CORRECTION → tiny corrective tick
- RECOVERY → muted thump

Rules:
- < 50ms
- non-percussive
- non-melodic
- no emotional contour

Think: mechanical thought, not UI beeps.

### 3. Silence Layer (Mastery Indicator)

When Trace is in perfect ALIGNMENT:
- tone nearly disappears
- transients vanish
- world becomes quiet

Silence is the audio expression of control.

---

## III. Chaos Audio Identity

Each chaos archetype has one audio verb, matching its motion verb.

### 1. Red Orbs — Disrupt

**Verb:** disrupt
**Sound:** drifting interference

- soft, airy interference noise
- slight whoosh when crossing Trace's path
- no impact sound
- no aggression

### 2. Crushers — Constrain

**Verb:** constrain
**Sound:** mechanical cycle

- steady cycle hum
- telegraph = rising harmonic (not a beep)
- active = low, oppressive pressure tone

Only place in the game with minimal screen shake + low-frequency emphasis.

### 3. Drift Fields — Destabilize

**Verb:** destabilize
**Sound:** directional force

- smooth, low-frequency push
- no turbulence
- no randomness
- amplitude tied to force magnitude

### 4. Flickers — Mislead

**Verb:** mislead
**Sound:** perceptual noise

- brief high-frequency flash
- ghostly after-echo
- no physicality
- no collision

### 5. Locks — Restrict

**Verb:** restrict
**Sound:** constraint

- telegraph = harmonic swell
- lock = clean, instantaneous clamp
- no movement sound

---

## IV. Interaction Canon (Audio Edition)

**Trace vs Red Orbs**
- Trace RECOVERY sound only
- Red Orb unchanged
- No collision sound

**Trace vs Crushers**
- Crusher cycle continues
- Trace failure = low-pass collapse
- No explosion

**Trace vs Drift Fields**
- Drift Field force tone increases
- Trace enters RESISTANCE tone
- CORRECTION ticks appear

**Trace vs Flickers**
- Flicker flash
- Trace silent unless overcorrecting

**Trace vs Locks**
- Lock telegraph + clamp
- Trace adapts silently

---

## V. The Sound of Mastery

At high skill:
- Trace's tones become nearly silent
- Chaos becomes predictable background texture
- The world feels calm
- The player hears only the essential

Mastery should sound like: **clarity, not triumph.**

---

## VI. Anti-Patterns (Never Allowed)

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

Trace is not a mascot.
Chaos is not a villain.
The world is not a game show.

---

## VII. Implementation Rules

1. **Everything is parameter-driven.** No audio timelines. No pre-baked sequences.
2. **MotionState → AudioState mapping.** Exactly mirrors the renderer.
3. **ChaosType → AudioVerb mapping.** Exactly mirrors the animation bible.
4. **Procedural audio preferred.** Granular synthesis > samples.
5. **Silence is intentional.** Silence = mastery.

---

## VIII. What This Soundscape Achieves

- A world that sounds like Trace's philosophy
- Audio that reinforces mastery instead of rewarding it
- Chaos that feels systemic, not alive
- A meditative, premium identity
- A soundscape that becomes calmer as the player improves

This is the audio identity that completes the canon.
