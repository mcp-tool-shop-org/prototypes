---
title: Content System
description: Built-in snippets, user packs, portable bundles, and the canonical content pipeline.
sidebar:
  order: 3
---

Every piece of code you type in Linux Dev Typer flows through a single content pipeline. Whether it ships with the app, comes from a community pack, or is pasted in by hand, all content becomes a `Snippet` with consistent structure and metrics-based difficulty.

## Built-in calibration snippets

The app ships with 168 calibration snippets across 5 languages, covering difficulty bands D1 through D7. These are engine ground truth: their difficulty ratings are derived from structural metrics (symbol density, nesting depth, line count) rather than subjective judgment.

Calibration snippets load from `assets/calibration/` at startup. They cannot be modified or disabled by the user.

## User snippet packs

Drop a JSON file into `~/.config/linux-dev-typer/packs/` and the app picks it up automatically.

### Pack format

```json
{
  "language": "python",
  "snippets": [
    {
      "id": "my_list_comp",
      "title": "List comprehension",
      "difficulty": 3,
      "code": "[x**2 for x in range(10)]\n"
    }
  ]
}
```

Each snippet requires an `id`, `title`, `difficulty` (1-7), and `code`. Optional fields:

| Field | Purpose |
|-------|---------|
| `topics` | String array of topic tags for filtering. |
| `explain` | Factual explanation lines shown on the completion card. |
| `notes` | Community tips, alternatives, and perspectives. Anonymous by design. |
| `scaffold` | Progressive learning context. Index 0 is a shallow hint; deeper entries add context. |
| `variants` | Alternative implementations of the same logic. No ranking or preference signal. |
| `communityDifficulty` | Display-only difficulty observation. Never used for selection or scoring. |

Packs are validated by `PackValidator` at load time. Invalid packs are skipped with a warning.

## Content-addressed IDs

Every snippet gets a content-addressed ID derived from SHA-256 of its code. This means the same code block is never added twice, regardless of how it enters the system. If you paste code that already exists in a calibration pack, the engine recognizes it and merges metadata rather than creating a duplicate.

## Canonical pipeline

All content enters the engine as a `CodeItem` and flows through the same pipeline:

1. **Ingestion** — from calibration packs, user packs, paste, file import, or folder import.
2. **Deduplication** — SHA-256 content addressing prevents duplicates.
3. **Difficulty derivation** — the `DifficultyDeriver` assigns D1-D7 based on structural metrics when no difficulty is specified.
4. **Normalization** — consistent line endings, trimming, language detection.
5. **Registration** — the snippet enters the pool and becomes available for selection.

## Practice profiles

Practice profiles are named parameter sets that tune every engine constant. The `Default` profile matches hardcoded baseline values. Custom profiles let you adjust:

- **XP tuning** — base multiplier, repeat decay, sloppy threshold and penalty, completion bonus.
- **Rating tuning** — K-factor, difficulty base and scale.
- **Difficulty tuning** — comfort accuracy threshold, minimum sessions, yo-yo window and swing.
- **Trend tuning** — WPM and accuracy thresholds, minimum sessions.
- **Fatigue tuning** — break session count, accuracy drop threshold.

All parameters are clamped to safe ranges at load time. The profile comparison (`Diff`) shows exactly what changed from the default.

## Portable bundles (.ldtpack)

The `.ldtpack` format is a JSON envelope for sharing content between users.

A bundle contains:
- **Snippet packs** keyed by language name.
- **Practice profiles** (excluding "Default").
- **Format version** (currently v3, supporting scaffold and variants).

Bundles never contain state or history. Import is additive: existing packs and profiles are never overwritten. The `MergeInto` method returns counts of what was actually imported.

### Import and export paths

- **Sidebar > Import** — load a `.ldtpack` file.
- **Sidebar > Export** — save your user packs and custom profiles as a bundle.
- **Paste Code** — paste from clipboard with auto-detected language.
- **Import File** — import a single source file.
- **Import Folder** — import all source files from a directory.

## Scaffolds, variants, and community notes

These three optional fields on snippets support a progressive learning experience:

- **Scaffold** — layered hints. The first entry is shallow ("This uses a list comprehension"), deeper entries add historical or conceptual context. Display-only; never affects engines.
- **Variants** — alternative implementations showing different valid approaches to the same logic. All variants are structural equals with no ranking.
- **Notes** — community tips and perspectives. Anonymous by design: no author, no source, no metadata. Imported notes are indistinguishable from local notes.

All three fields are purely informational. They appear on the completion card but never influence selection, difficulty, scoring, or rating.
