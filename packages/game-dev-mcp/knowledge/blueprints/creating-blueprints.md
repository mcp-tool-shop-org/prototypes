---
title: "Creating Blueprints via MCP"
category: blueprints
tags: [blueprint, create, components, properties]
difficulty: intermediate
summary: "Step-by-step guide to creating and configuring Blueprints through the Remote Control API."
ueVersion: "5.4+"
---

## Create a Blueprint

```
ue_create_blueprint(
  name: "BP_Lamp",
  parentClass: "Actor",
  path: "/Game/Blueprints"
)
```

## Add Components

Add a mesh for the lamp body:
```
ue_add_component(
  blueprintPath: "/Game/Blueprints/BP_Lamp",
  componentClass: "StaticMeshComponent",
  componentName: "LampMesh"
)
```

Add a light:
```
ue_add_component(
  blueprintPath: "/Game/Blueprints/BP_Lamp",
  componentClass: "PointLightComponent",
  componentName: "LampLight"
)
```

## Configure Component Properties

Set the light intensity:
```
ue_set_component_property(
  blueprintPath: "/Game/Blueprints/BP_Lamp",
  componentName: "LampLight",
  property: "Intensity",
  value: 3000.0
)
```

Set the light color:
```
ue_set_component_property(
  blueprintPath: "/Game/Blueprints/BP_Lamp",
  componentName: "LampLight",
  property: "LightColor",
  value: {"R": 255, "G": 200, "B": 150, "A": 255}
)
```

## Compile the Blueprint

After making changes, compile to validate:
```
ue_compile_blueprint(blueprintPath: "/Game/Blueprints/BP_Lamp")
```

## Spawn an Instance

Place the Blueprint in the level:
```
ue_spawn_blueprint_actor(
  blueprintPath: "/Game/Blueprints/BP_Lamp",
  location: {x: 0, y: 0, z: 0}
)
```

## Save

```
ue_save_asset(assetPath: "/Game/Blueprints/BP_Lamp")
```
