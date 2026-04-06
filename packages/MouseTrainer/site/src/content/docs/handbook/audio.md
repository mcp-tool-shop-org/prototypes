---
title: Audio System
description: Event-driven sound cues with deterministic variation.
sidebar:
  order: 5
---

The `AudioDirector` maps simulation events to sound effects with bounded, deterministic variation.

## Design

Audio cues are selected and parameterized using the same xorshift32 RNG that drives the simulation. This means audio is part of the deterministic replay — the same session always sounds the same.

## Cue properties

| Feature | Detail |
|---------|--------|
| Cue selection | Deterministic choice among candidate assets per event type |
| Volume | `0.6 + 0.4 * intensity`, clamped to [0, 1] |
| Pitch jitter | [0.97, 1.03] via xorshift32, clamped to [0.9, 1.1] |
| Rate limiting | HitWall events throttled to once every 6 ticks (~100 ms at 60 Hz) |
| Playback modes | One-shot (hits, gates, combos) and looped (drag, ambient) |

## Asset verification

The `AssetVerifier` checks all 13 required audio files at startup. If any are missing, the game reports the specific missing files rather than failing silently.

## Event-to-cue mapping

The `AudioDirector` handles these simulation event types:

| Event | Behavior |
|-------|----------|
| `DragStart` | Starts a looped `sfx_drag_loop.wav` at 0.25 volume |
| `DragEnd` | Stops the drag loop |
| `HitWall` | One-shot cue, rate-limited to once every 6 ticks |
| `EnteredGate` | One-shot cue with intensity-based volume |
| `ComboUp` | One-shot cue at full intensity |
| `LevelComplete` | One-shot completion sound |

## Required audio assets

The `AssetManifest` declares 13 required files that must be bundled:

- `sfx_hit_01.wav`, `sfx_hit_02.wav`, `sfx_hit_03.wav` — wall-hit variations
- `sfx_gate_01.wav`, `sfx_gate_02.wav` — gate-pass variations
- `sfx_combo_01.wav`, `sfx_combo_02.wav`, `sfx_combo_03.wav` — combo-up variations
- `sfx_drag_start.wav`, `sfx_drag_end.wav`, `sfx_drag_loop.wav` — drag lifecycle
- `sfx_level_complete.wav` — level completion
- `amb_zen_loop.wav` — ambient background loop

## Architecture rules

The Audio module depends only on Domain — it never references Simulation. The `AudioDirector` receives `GameEvent` objects and maps them to audio cues. The composition root (MauiHost) wires the two together via `Plugin.Maui.Audio`.
