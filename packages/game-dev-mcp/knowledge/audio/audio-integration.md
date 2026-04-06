---
title: "Audio Integration"
category: audio
tags: [audio, sound, music, attenuation, sound-cue]
difficulty: intermediate
summary: "Working with audio in UE5 — sound playback, spatial audio, attenuation, and Sound Cues."
ueVersion: "5.4+"
---

## Spawning Audio

Place an ambient sound in the level:
```
ue_spawn_actor(className: "AmbientSound", location: {x: 0, y: 0, z: 100}, label: "BGMusic")
```

## Setting a Sound Asset

Assign a SoundWave or SoundCue to an audio component:
```
ue_set_property(
  objectPath: "<ambient_sound_path>.AudioComponent0",
  propertyName: "Sound",
  value: "/Game/Audio/S_Background"
)
```

## Audio Component Properties

| Property | Type | Description |
|----------|------|-------------|
| `Sound` | asset ref | SoundWave or SoundCue asset |
| `VolumeMultiplier` | float | Volume (0.0 to 1.0+) |
| `PitchMultiplier` | float | Pitch (0.5 to 2.0) |
| `bAutoActivate` | bool | Play on level start |
| `bIsUISound` | bool | Ignore distance attenuation |
| `AttenuationOverrides` | object | Spatial falloff settings |

## Attenuation (Spatial Audio)

Attenuation controls how sound fades with distance:
```
ue_set_property(
  objectPath: "<audio_component>",
  propertyName: "AttenuationOverrides",
  value: {
    "bOverrideAttenuation": true,
    "FalloffDistance": 2000,
    "AttenuationShape": "Sphere"
  }
)
```

## Sound Asset Types

- **SoundWave** — raw audio file (WAV, OGG import)
- **SoundCue** — node-based audio graph (randomization, mixing, effects)
- **MetaSoundSource** — MetaSound procedural audio (UE5)

## Finding Audio Assets

```
ue_search_assets(query: "Sound", classFilter: ["SoundWave", "SoundCue"])
```

## Triggering Audio

Use `ue_describe_object` on an AudioComponent to find `Play`, `Stop`, `FadeIn`, `FadeOut` functions.
