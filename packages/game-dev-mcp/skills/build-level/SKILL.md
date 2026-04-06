---
name: build-level
description: Build a level from a description. Describe a scene and Claude will spawn actors, set properties, and arrange everything.
argument-hint: [scene description]
---

# Build Level

Build a UE5 level based on this description: **$ARGUMENTS**

## Instructions

1. **Plan the scene** — Break the description into individual actors needed (lights, meshes, cameras, fog, sky, etc.)

2. **Start a mission** — Call `ue_mission_start` to track progress across the multi-step build

3. **Spawn actors in order:**
   - Environment first (sky, fog, atmosphere)
   - Large structures / ground planes
   - Props and detail objects
   - Lights (after objects so you can position relative to them)
   - Camera last

4. For each actor:
   - `ue_spawn_actor` with class and location
   - `ue_set_property` for materials, colors, intensity, scale, etc.
   - `ue_mission_update` after each major step

5. **Save the level** — Call `ue_save_current_level` when done

6. **Focus viewport** — Call `ue_focus_viewport` on the most interesting actor

7. **Report** — Summarize what was built: actor count, types, and layout

## Tips

- Use `ue_knowledge_search` if unsure about a UE5 concept (e.g. "how do I set up Lumen lighting?")
- Use `ue_search_assets` to find mesh and material assets in the project
- Batch property sets with `ue_batch_set_properties` when configuring multiple actors
- Keep the user informed of progress throughout the build
