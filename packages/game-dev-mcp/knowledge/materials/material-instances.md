---
title: "Material Instances"
category: materials
tags: [material, instance, parameters, override]
difficulty: intermediate
summary: "Creating and configuring material instances — the fast way to create material variations."
ueVersion: "5.4+"
---

## What Are Material Instances?

Material Instances inherit from a parent material but allow changing specific parameters (color, roughness, texture) without recompiling the shader. They're the preferred way to create material variations.

## Creating a Material Instance

Duplicate an existing material instance:
```
ue_duplicate_asset(
  sourcePath: "/Game/Materials/MI_Brick",
  destPath: "/Game/Materials/MI_Brick_Red"
)
```

## Setting Parameters

### Scalar Parameters
```
ue_set_property(
  objectPath: "/Game/Materials/MI_Brick_Red",
  propertyName: "ScalarParameterValues",
  value: [{"ParameterName": "Roughness", "ParameterValue": 0.8}]
)
```

### Vector Parameters (Colors)
```
ue_set_property(
  objectPath: "/Game/Materials/MI_Brick_Red",
  propertyName: "VectorParameterValues",
  value: [{"ParameterName": "BaseColor", "ParameterValue": {"R": 0.8, "G": 0.2, "B": 0.1, "A": 1.0}}]
)
```

### Texture Parameters
```
ue_set_property(
  objectPath: "/Game/Materials/MI_Brick_Red",
  propertyName: "TextureParameterValues",
  value: [{"ParameterName": "DiffuseTexture", "ParameterValue": "/Game/Textures/T_Brick_Red_D"}]
)
```

## Discovering Parameters

Use `ue_describe_object` to see what parameters a material instance exposes:
```
ue_describe_object(objectPath: "/Game/Materials/MI_Brick")
```

## Save After Modification

```
ue_save_asset(assetPath: "/Game/Materials/MI_Brick_Red")
```
