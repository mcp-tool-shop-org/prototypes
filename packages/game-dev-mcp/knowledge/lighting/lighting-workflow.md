---
title: "Lighting Workflow"
category: lighting
tags: [lighting, workflow, build, preview, setup]
difficulty: intermediate
summary: "Common lighting setups and workflow for building well-lit levels."
ueVersion: "5.4+"
---

## Basic Outdoor Setup

A minimal outdoor scene needs:

1. **Directional Light** — sun (rotation controls angle)
2. **Sky Light** — ambient fill
3. **Sky Atmosphere** — sky rendering
4. **Exponential Height Fog** — atmospheric depth

```
ue_spawn_actor(className: "DirectionalLight", rotation: {pitch: -45, yaw: 0, roll: 0})
ue_spawn_actor(className: "SkyLight")
ue_spawn_actor(className: "SkyAtmosphere")
ue_spawn_actor(className: "ExponentialHeightFog")
```

## Basic Indoor Setup

1. **Point Lights** — room lighting (ceiling or wall-mounted)
2. **Spot Lights** — accent or task lighting
3. **Rect Lights** — window light simulation
4. **Post Process Volume** — tone mapping and exposure

```
ue_spawn_actor(className: "PointLight", location: {x: 0, y: 0, z: 250})
ue_spawn_actor(className: "PostProcessVolume", location: {x: 0, y: 0, z: 0})
```

## Light Properties via MCP

After spawning a light, configure it:

```
# Set intensity
ue_set_property(objectPath: "<light_path>.PointLightComponent0", propertyName: "Intensity", value: 5000)

# Set color to warm white
ue_set_property(objectPath: "<light_path>.PointLightComponent0", propertyName: "LightColor", value: {"R": 255, "G": 240, "B": 220, "A": 255})

# Set range
ue_set_property(objectPath: "<light_path>.PointLightComponent0", propertyName: "AttenuationRadius", value: 1000)
```

## Lumen (UE5 Default)

UE5 uses Lumen for dynamic global illumination by default. Key points:
- Fully dynamic — no light building needed
- Works with Movable lights only
- Performance scales with scene complexity
- Toggle via Project Settings > Rendering > Global Illumination

## Building Lighting (Non-Lumen)

For Static/Stationary lights without Lumen:
```
ue_execute_console_command(command: "BUILD LIGHTING")
```

This bakes lightmaps. Only needed if you set lights to Static or Stationary mobility.
