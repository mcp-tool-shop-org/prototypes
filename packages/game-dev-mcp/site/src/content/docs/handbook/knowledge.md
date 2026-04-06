---
title: Knowledge Library
description: 35 built-in UE5 tutorials and project context system.
sidebar:
  order: 3
---

Game Dev MCP bundles 35 tutorials as MCP resources. Your LLM reads them on demand -- no context wasted until it actually needs the info.

## Tutorial categories

| Category | Covers |
|----------|--------|
| **Getting Started** | Setup, first commands, project structure |
| **Actors** | Spawning, transforms, type reference, components |
| **Assets** | Content browser, search patterns, importing |
| **Blueprints** | Basics, creation, component configuration |
| **Levels** | Management, world composition |
| **Materials** | Basics, material instances |
| **Lighting** | Light types, workflow |
| **Physics** | Simulation, collisions, constraints |
| **Audio** | Sound cues, attenuation, spatial audio |
| **Animation** | Skeletal mesh, AnimBP, montages |
| **Visual Effects** | Niagara particles, GPU sim |
| **Rendering** | Nanite, Lumen, virtual shadow maps |
| **AI & Navigation** | NavMesh, behavior trees, EQS |
| **Cinematics** | Sequencer, cameras, film rendering |
| **Virtual Assistant** | MetaHuman assistants, LLM integration |
| **API Reference** | Remote Control API, subsystem reference |
| **Patterns** | Common workflows, error handling, performance |

## How search works

Use `ue_knowledge_search` to find articles by keyword:

```
ue_knowledge_search(query: "nanite", maxResults: 3)
```

You can narrow by category:

```
ue_knowledge_search(query: "collision", category: "physics")
```

The search returns article titles, summaries, and content so the LLM can read the relevant material immediately.

## MCP resources

Every article is also registered as an MCP resource with the URI pattern:

```
unreal://knowledge/{category}/{slug}
```

Clients that support MCP resource reading (such as Claude Desktop) can browse and fetch articles directly. A master index is available at `unreal://knowledge/index`.

## Project knowledge

Your LLM can store and recall project-specific context that persists across sessions. This is stored in `.game-dev-mcp/` in your working directory.

### Getting started with project knowledge

Initialize a project, then add conventions and notes:

```
ue_project_init(name: "My Game", ueVersion: "5.4")
ue_project_set_convention(convention: "All Blueprints use BP_ prefix")
ue_project_add_note(title: "Level Layout", content: "Main hall is 2000x1000 cm", tags: ["level-design"])
```

### Retrieving notes later

Search by keyword or list all notes:

```
ue_project_search_notes(query: "layout")
ue_project_list_notes(tagFilter: "level-design")
```

The AI picks up where you left off next time you start a conversation, because the `.game-dev-mcp/` folder persists on disk.
