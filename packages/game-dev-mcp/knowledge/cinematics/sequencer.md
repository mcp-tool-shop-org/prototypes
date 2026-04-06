---
title: "Cinematics and Sequencer"
category: cinematics
tags: [sequencer, cinematic, camera, keyframe, cutscene, animation]
difficulty: intermediate
summary: "Using UE5's Sequencer for cinematics, camera work, and animated sequences."
ueVersion: "5.4+"
---

## What is Sequencer?

Sequencer is UE5's timeline-based tool for creating cinematics, cutscenes, and animated sequences. It keyframes actor properties over time.

## Creating Level Sequences

Level Sequences are assets that hold timeline data:
```
ue_search_assets(query: "LevelSequence", classFilter: ["LevelSequence"])
```

Spawn a Level Sequence Actor to play a sequence in the level:
```
ue_spawn_actor(className: "LevelSequenceActor", location: {x: 0, y: 0, z: 0}, label: "CutscenePlayer")
```

## Camera Work

### Place Cinematic Cameras
```
ue_spawn_actor(className: "CineCameraActor", location: {x: 0, y: 0, z: 150}, label: "CineCam01")
```

CineCameraActor properties:
- `CurrentFocalLength` — lens focal length (mm)
- `CurrentAperture` — f-stop (depth of field)
- `FocusSettings` — auto-focus, manual focus distance

```
ue_set_property(
  objectPath: "<cine_cam>.CineCameraComponent0",
  propertyName: "CurrentFocalLength",
  value: 35.0
)
```

### Camera Properties via MCP

| Property | Description |
|----------|-------------|
| `CurrentFocalLength` | Lens mm (24=wide, 50=normal, 85=portrait, 200=telephoto) |
| `CurrentAperture` | f-stop (1.4=shallow DOF, 16=deep DOF) |
| `FocusSettings.ManualFocusDistance` | Focus distance in cm |

## Triggering Sequences

Use console commands to control playback:
```
ue_execute_console_command(command: "Sequencer.Play")
```

## Film Rendering

For offline rendering with Movie Render Queue:
```
ue_execute_console_command(command: "MovieRenderPipeline.Render")
```

## Sequencer Limitations via MCP

The Remote Control API can:
- Spawn/position cameras and actors
- Set camera properties (focal length, aperture, focus)
- Trigger sequence playback via console commands
- Search for LevelSequence assets

It **cannot** directly edit Sequencer tracks or keyframes — that requires the Sequencer UI.
