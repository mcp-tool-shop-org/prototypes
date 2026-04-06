---
title: Game Modes
description: ReflexGates and how deterministic levels work.
sidebar:
  order: 2
---

## ReflexGates

Side-scrolling gate challenge. Oscillating apertures on vertical walls — navigate the cursor through each gate before the scroll catches you. A deterministic seed produces an identical level every time.

### Level properties

| Property | Value |
|----------|-------|
| Playfield | 1920 x 1080 virtual pixels |
| Gate count | 12 (default) |
| Scroll speed | 70 px/s (~83 seconds per clean run) |
| Scoring | 100 pts (center) to 50 pts (edge), combo every 3 gates |
| Oscillation | Per-gate amplitude ramp (40-350 px) and frequency ramp (0.15-1.2 Hz) |

### Determinism guarantees

- **RNG**: xorshift32 seeded per run for platform-stable generation
- **Identity**: FNV-1a 64-bit hash of mode + seed + mutators = same `RunId` everywhere
- **Timestep**: Fixed 60 Hz with accumulator-based catch-up
- **Simulation time**: Derived from tick count (`tick * dt`), never wall clock

### Scoring

Each gate awards points based on how close to center the cursor passes:

- **Center hit**: 100 points
- **Edge hit**: 50 points (linear interpolation between center and edge)
- **Miss**: 0 points, combo streak resets to zero
- **Combo**: Every 3 consecutive gates passed triggers a `ComboUp` event

### Session lifecycle

Every game session follows a three-phase state machine managed by `SessionController`:

1. **Ready** — seed and gate count are set, timer is paused
2. **Playing** — timer is running, events are processed, gate results are recorded
3. **Results** — level complete, final `SessionResult` is built with score breakdown and verification hash

The session produces an immutable `SessionResult` containing the seed, elapsed time, total score, max combo, per-gate results, and an event-stream verification hash for replay integrity.

### Visual effects

The MAUI host layers several rendering systems on top of the simulation:

- **Cursor trail** — fading polyline with speed-reactive brightness (0.3 s trail window)
- **Particle system** — hit/miss burst particles on gate events
- **Screen shake** — camera offset on wall-hit events
- **Neon palette** — cyan/lime/amber/red-magenta color ramp based on gate difficulty
- **Parallax grid** — two-layer background grid for depth perception
- **Scanlines** — CRT-style horizontal lines for retro atmosphere
