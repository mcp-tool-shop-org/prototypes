---
title: "World Composition & Sub-Levels"
category: levels
tags: [world, composition, streaming, sub-levels]
difficulty: advanced
summary: "Understanding UE5's level streaming and world partition systems."
ueVersion: "5.4+"
---

## Overview

UE5 supports splitting a world across multiple level files for performance and workflow:

- **World Partition** (UE5 default) — automatic cell-based streaming
- **Level Streaming** — manual sub-level loading
- **World Composition** — landscape-tile-based streaming (legacy)

## World Partition

UE5's default large-world system. The editor automatically divides the world into cells that load/unload based on player proximity.

Key concepts:
- **Data Layers** — categorize actors into loading groups
- **HLOD** — Hierarchical Level of Detail for distant objects
- **One File Per Actor (OFPA)** — each actor saved separately for collaboration

## What You Can Do via MCP

The Remote Control API works with the currently loaded level. For World Partition:
- Actors you spawn are added to the persistent level
- All standard actor/property operations work
- Save operations save the current state

## Limitations

- Cannot directly manage streaming volumes or data layers via RC API
- Cannot trigger level streaming loads/unloads
- World Partition cell management is internal to the editor

## Best Practice

For MCP-driven level design:
1. Work in a single persistent level
2. Use actors and Blueprints to build your content
3. Let World Partition handle streaming automatically
4. Save frequently with `ue_save_current_level`
