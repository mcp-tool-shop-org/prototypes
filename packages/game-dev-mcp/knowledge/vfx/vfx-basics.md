---
title: "VFX Basics — Niagara and Particles"
category: vfx
tags: [vfx, particles, niagara, cascade, effects, fire, smoke, explosion]
difficulty: intermediate
summary: "Creating and placing visual effects with Niagara and Cascade particle systems."
ueVersion: "5.4+"
---

## Particle Systems in UE5

UE5 has two particle systems:
- **Niagara** (recommended) — modern, GPU-accelerated, node-based
- **Cascade** (legacy) — older system, still supported

## Spawning VFX Actors

### Niagara
```
ue_spawn_actor(className: "NiagaraActor", location: {x: 0, y: 0, z: 100}, label: "FireEffect")
```

Assign a Niagara system:
```
ue_set_property(
  objectPath: "<niagara_actor>.NiagaraComponent0",
  propertyName: "Asset",
  value: "/Game/Effects/NS_Fire"
)
```

### Cascade (Legacy)
```
ue_spawn_actor(className: "Emitter", location: {x: 0, y: 0, z: 100})
```

## Finding VFX Assets

```
ue_search_assets(query: "Fire", classFilter: ["NiagaraSystem"])
ue_search_assets(query: "Smoke", classFilter: ["ParticleSystem"])
```

## Common VFX Types

| Effect | System | Typical Use |
|--------|--------|-------------|
| Fire/flame | Niagara | Torches, bonfires, explosions |
| Smoke | Niagara | Chimneys, damage, atmosphere |
| Sparks | Niagara | Impacts, grinding, electrical |
| Water/splash | Niagara | Waterfalls, rain, puddles |
| Dust/debris | Niagara | Footsteps, destruction |
| Magic/energy | Niagara | Spells, shields, portals |

## Controlling VFX Properties

Use `ue_describe_object` on the NiagaraComponent to discover available parameter overrides:
```
ue_describe_object(objectPath: "<niagara_actor>.NiagaraComponent0")
```

Common parameters: `SpawnRate`, `Lifetime`, `InitialVelocity`, `Color`, `Size`.

## Auto-Activation

```
ue_set_property(
  objectPath: "<niagara_actor>.NiagaraComponent0",
  propertyName: "bAutoActivate",
  value: true
)
```
