# Trace + Chaos Interaction Rendering Canon

> The interaction contract: how Trace's states and chaos behaviors combine visually and mechanically, without ever breaking tone.

---

## 1. General Interaction Rules

- Chaos never reacts to Trace. Only Trace's state changes.
- Trace's MotionState drives Trace's visuals. Chaos visuals are driven only by their own behavior state.
- Collisions and forces are mechanical, not dramatic. No explosions, no big flashes.

---

## 2. Trace vs Red Orbs

**Mechanics:**
- Red Orbs never chase Trace; they only cross paths.
- Collision → Trace enters RECOVERY, not a special "hit" state.

**Rendering:**
- Trace: brief RECOVERY desaturation + micro-recoil.
- Red Orb: unchanged (no flash, no bounce).

**Canon:**
> "Disruption encountered. I correct."

---

## 3. Trace vs Crushers

**Mechanics:**
- If Trace is in Crusher space during ACTIVE, that's failure.
- Trace's state machine ends the run; no special motion state needed beyond RECOVERY if you show a micro-moment.

**Rendering:**
- Crusher: optional minimal screen shake on impact.
- Trace: dim + fade or cut to failure screen; no explosion.

**Canon:**
> "I waited too long."

---

## 4. Trace vs Drift Fields

**Mechanics:**
- Drift Field applies continuous force → Trace enters RESISTANCE, then CORRECTION, then ALIGNMENT if handled well.
- No discrete collision; only ongoing destabilization.

**Rendering:**
- Drift Field: slow directional texture.
- Trace: lean opposite force, increased glowStrength in RESISTANCE, subtle edge highlight in CORRECTION.

**Canon:**
> "Force increases. I hold."
> "I refine under pressure."

---

## 5. Trace vs Flickers

**Mechanics:**
- Flickers never affect physics.
- Any "failure" around Flickers is due to Trace overreacting → poor path choice, not direct interaction.

**Rendering:**
- Flickers: brief flash + afterimage.
- Trace: unchanged state; only MotionState changes if the player overcorrects (e.g., unnecessary CORRECTION → RECOVERY if they clip something).

**Canon:**
> "Noise rises. I ignore it."

---

## 6. Trace vs Locks

**Mechanics:**
- When LOCKED, Trace's movement constraints change (axis, speed).
- Trace responds by entering COMMITMENT, RESISTANCE, and CORRECTION within the new constraints.

**Rendering:**
- Locks: static visuals with clear telegraph.
- Trace: no special visuals beyond normal state-driven ones; the constraint is felt, not dramatized.

**Canon:**
> "Constraint applied. I adapt."

---

## 7. High-Skill Interaction Canon

At high skill:
- Red Orbs look like background weather.
- Crushers look like metronomes.
- Drift Fields look like slow currents.
- Flickers look like ignorable noise.
- Locks look like known rules.

Trace's visuals become:
- calmer
- cleaner
- less dramatic

**If high-skill play looks frantic, the system is lying.**
