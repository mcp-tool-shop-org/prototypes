---
title: "Nanite and Lumen — UE5 Rendering"
category: rendering
tags: [nanite, lumen, rendering, geometry, global-illumination, reflections]
difficulty: advanced
summary: "UE5's flagship rendering features — Nanite virtualized geometry and Lumen dynamic lighting."
ueVersion: "5.4+"
---

## Nanite — Virtualized Geometry

Nanite renders extremely detailed meshes without traditional LODs. It streams triangle clusters on demand.

### Enabling Nanite on a Mesh
In the editor: right-click a StaticMesh asset > Nanite > Enable.

Via MCP (on imported meshes with Nanite support):
```
ue_set_property(
  objectPath: "/Game/Meshes/SM_DetailedRock",
  propertyName: "NaniteSettings.bEnabled",
  value: true
)
```

### When to Use Nanite
- High-poly static meshes (millions of triangles)
- Dense environments (foliage, rubble, architecture)
- When traditional LODs would be impractical

### Nanite Limitations
- **Static meshes only** — no skeletal meshes (as of 5.4)
- No vertex animation or World Position Offset
- Limited translucency support
- Masked materials have performance cost

### Check Nanite Status
```
ue_execute_console_command(command: "r.Nanite.Visualize Overview")
```

## Lumen — Dynamic Global Illumination

Lumen provides real-time bounced lighting and reflections. No lightmap baking needed.

### Lumen is Default in UE5
New UE5 projects use Lumen by default. Verify:
```
ue_execute_console_command(command: "r.DynamicGlobalIlluminationMethod")
```
Returns `1` for Lumen.

### Key Lumen Properties
- Works with **Movable** lights only
- Supports multi-bounce indirect lighting
- Real-time reflections on all surfaces
- Software ray tracing (no RTX hardware required for basic Lumen)

### Hardware Lumen (Ray Tracing)
For higher quality reflections on RTX hardware:
```
ue_execute_console_command(command: "r.Lumen.HardwareRayTracing 1")
```

### Performance Considerations
- Lumen is more expensive than baked lighting
- Scale quality via `r.Lumen.ScreenProbeGather.Quality` (0.5 to 1.0)
- Use `stat gpu` to monitor Lumen cost
- For static scenes, consider switching to baked lighting

### Troubleshooting
- **Dark interiors**: add more light sources or increase Sky Light intensity
- **Light leaks**: ensure walls have thickness (not single-sided planes)
- **Noise/artifacts**: increase `r.Lumen.ScreenProbeGather.Quality`
