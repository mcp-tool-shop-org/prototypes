---
title: Content Authoring
description: Create snippet packs, add scaffolds and demonstrations, and share content bundles with the community.
sidebar:
  order: 4
---

Dev-Op-Typer ships with 168+ calibration snippets, but the content system is designed for you to add your own code. This page covers every way to author, enrich, and share practice content.

## Snippet pack format

A snippet pack is a JSON file placed in your user snippets folder:

```
%LocalAppData%\DevOpTyper\UserSnippets\
```

You can also open this folder from the Settings panel by clicking **Open Snippets Folder**.

### Minimal example

```json
{
  "language": "python",
  "snippets": [
    {
      "id": "my_decorator",
      "title": "Simple decorator",
      "difficulty": 4,
      "topics": ["functions", "decorators"],
      "code": "def log(fn):\n    def wrapper(*args):\n        print(f'calling {fn.__name__}')\n        return fn(*args)\n    return wrapper\n"
    }
  ]
}
```

### Required fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier across all packs. Duplicates are rejected |
| `title` | string | Display name shown in the snippet list |
| `difficulty` | number | 1 (easiest) through 7 (hardest) |
| `code` | string | The code to type. Must end with `\n` |

### Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `topics` | string[] | Topic tags used for filtering and weakness tracking |
| `explain` | string[] | 1-3 teaching bullets shown in the Explanation panel |
| `symbols` | string[] | Symbol clusters this snippet exercises, e.g. `["()","{}","=>"]` |
| `source` | string | Attribution for where the code came from |

### Content-addressed IDs

Every snippet is also assigned a content-addressed ID based on its SHA-256 hash. This means the same code is never stored twice, even if imported from different packs or via Paste Code. Your hand-picked `id` field is used for display and selection; the content hash is used internally for deduplication.

## Scaffolds

Scaffolds are progressive context hints attached to a snippet. They help learners understand what the code does, not just how to type it.

Scaffolds are defined in snippet pack metadata. When attached to a snippet, they appear as a collapsible panel with a "More context" button that reveals deeper layers:

- **Layer 1:** Brief orientation ("This is a list comprehension that squares numbers")
- **Layer 2:** Structural explanation ("The expression `x**2` runs for each `x` in the range")
- **Layer 3:** Deeper context ("List comprehensions are syntactic sugar for a for-loop with append")

Scaffolds fade automatically as the user demonstrates competence with a snippet — controlled by the `ScaffoldFadeService`. Users can also disable all scaffolds from the Settings panel.

## Demonstrations

Demonstrations are alternative implementations shown alongside a snippet as equals, not corrections. For example, a Python list comprehension snippet might show a generator expression as a demonstration.

Like scaffolds, demonstrations are optional metadata in snippet packs. They appear in the Demonstration panel when available. Users can disable demonstrations from the Settings panel.

## Skill layers

Skill layers offer different depths of understanding for a snippet:

- **Essentials:** What you need to type correctly
- **Deeper:** Why the code is written this way
- **Advanced:** Edge cases, performance, and alternatives

Layers are shown in the Layers panel and can be toggled from the Settings panel.

## Guidance notes

Guidance notes are contextual observations from shared content packs — tips, common pitfalls, or conventions associated with a snippet or topic. They are always dismissible and purely informational.

## Importing code

### Paste Code

The fastest path. Open Settings, scroll to Paste Code, paste any code, and click Add. Language is auto-detected from the content. The snippet enters the rotation immediately without a restart.

### Import File

Click **Import File** in Settings to add a single source file. The app detects language from the file extension (`.py`, `.js`, `.cs`, `.java`, `.sql`, `.sh`). Unrecognized extensions are skipped.

### Import Folder

Click **Import Folder** to scan an entire project directory. The app recursively finds source files with supported extensions and imports them. Each file becomes one snippet. All imports are deduplicated by SHA-256 content hash.

## The .ldtpack bundle format

Bundles are standard ZIP files with a `.ldtpack` extension. The internal structure is:

```
bundle.zip/
  snippets/       — user snippet JSON files
  configs/        — user practice config JSON files
  manifest.json   — metadata (version, timestamp, counts)
```

The format is deliberately simple:
- Standard ZIP, no encryption, no proprietary headers
- JSON files inside, same schema as the app uses
- Can be unpacked and read with any text editor
- No dependency on the app for reading or editing

### Exporting

Open Settings and click **Export Bundle**. All your user-authored snippets and practice configs are packaged. Practice history, ratings, and settings are never included.

### Importing

Open Settings and click **Import Bundle**. Select an `.ldtpack` file. The app extracts snippets and configs into your user folders. Duplicates (by content hash) are skipped automatically.

## Organizing packs

You can organize snippet packs in subdirectories one level deep inside the `UserSnippets` folder. For example:

```
UserSnippets/
  python.json
  team-standards/
    api-patterns.json
    error-handling.json
```

Deeper nesting is not supported.
