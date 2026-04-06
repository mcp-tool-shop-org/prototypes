---
name: search
description: Search for actors, assets, or knowledge in the UE5 project. Find anything by name, type, or concept.
argument-hint: [what to find]
---

# Search

Search for: **$ARGUMENTS**

## Instructions

1. Determine what the user is looking for:
   - **Actors in the level** → Use `ue_find_actors_by_name` or `ue_get_all_actors` with classFilter
   - **Assets in the content browser** → Use `ue_search_assets` with query and optional classFilter/pathFilter
   - **UE5 knowledge/concepts** → Use `ue_knowledge_search`

2. If ambiguous, search all three and present combined results

3. For actor results, include the actor path and transform
4. For asset results, include the asset path and class
5. For knowledge results, include the article title and a brief summary

## Tips

- Use `classFilter` to narrow results (e.g. "PointLight", "StaticMesh", "Material")
- Use `pathFilter` for assets to limit to specific directories (e.g. "/Game/Props/")
- If searching for a specific actor, try `ue_find_actors_by_name` with a pattern first — it's faster than listing all actors
