---
title: "Light Types in UE5"
category: lighting
tags: [light, point, spot, directional, sky, rect]
difficulty: beginner
summary: "Reference for all UE5 light types — when to use each and their key properties."
ueVersion: "5.4+"
---

## Light Types

### Point Light
Radiates light in all directions from a single point. Like a light bulb.

```
ue_spawn_actor(className: "PointLight", location: {x: 0, y: 0, z: 300})
```

Key properties:
- `Intensity` — brightness (lux), default 8.0
- `AttenuationRadius` — range in cm
- `LightColor` — RGB color
- `CastShadows` — shadow toggle

### Spot Light
Cone-shaped light beam. Like a flashlight or stage light.

```
ue_spawn_actor(className: "SpotLight", location: {x: 0, y: 0, z: 300})
```

Extra properties:
- `InnerConeAngle` — bright center cone (degrees)
- `OuterConeAngle` — full light cone (degrees)

### Directional Light
Parallel rays from infinitely far away. Used for sun/moon.

```
ue_spawn_actor(className: "DirectionalLight", location: {x: 0, y: 0, z: 0})
```

The location doesn't affect the light — only rotation matters. Pitch controls sun elevation.

### Rect Light
Rectangular area light. Produces soft shadows. Good for windows, screens, panels.

```
ue_spawn_actor(className: "RectLight", location: {x: 0, y: 0, z: 200})
```

Extra properties:
- `SourceWidth` — rectangle width in cm
- `SourceHeight` — rectangle height in cm

### Sky Light
Captures the sky and uses it as ambient lighting.

```
ue_spawn_actor(className: "SkyLight", location: {x: 0, y: 0, z: 0})
```

Properties:
- `SourceType` — `SLS_CapturedScene` (dynamic) or `SLS_SpecifiedCubemap` (static)
- `Intensity` — ambient brightness multiplier

## Light Mobility

Set via the `Mobility` property:
- **Static** — baked lighting only, best performance
- **Stationary** — baked + limited dynamic shadows
- **Movable** — fully dynamic, most expensive
