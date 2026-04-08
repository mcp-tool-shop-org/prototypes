---
title: Translate README
description: Batch-translate your README.md into multiple languages while preserving structure.
sidebar:
  order: 3
---

The **Translate README** command is Polyglot's most powerful feature. It translates your project's README.md into multiple languages in a single batch, preserving code blocks, tables, badges, and HTML structure.

## How to use it

1. Open a workspace that contains a `README.md` at the root
2. Run **Polyglot: Translate README** from the Command Palette (`Ctrl+Shift+P`)
3. Select target languages from the multi-select picker (your defaults are pre-selected)
4. Wait for the translations to complete — progress is shown in a notification

Each language produces a file like `README.ja.md`, `README.es.md`, etc., placed alongside the original.

## What gets translated

The README translator uses intelligent segmentation to decide what to translate and what to leave alone:

| Content type | Behavior |
|-------------|----------|
| Headings (`## Title`) | Translated, trailing periods stripped |
| Paragraphs | Translated, chunked at sentence boundaries |
| Table cells | Translated unless they contain code, numbers, or links |
| HTML taglines (`<p><strong>text</strong></p>`) | Inner text translated, HTML preserved |
| Code blocks (fenced with triple backticks) | Preserved verbatim |
| HTML badges and images | Preserved verbatim |
| URLs and links | Preserved verbatim |
| Horizontal rules | Preserved verbatim |

## Default target languages

Out of the box, Polyglot translates to seven languages:

- Japanese (`ja`)
- Chinese Simplified (`zh`)
- Spanish (`es`)
- French (`fr`)
- Hindi (`hi`)
- Italian (`it`)
- Portuguese — Brazil (`pt-BR`)

You can change this list in Settings under `polyglot.defaultLanguages`.

## Translation quality

The TranslateGemma model handles most languages well, but the extension also applies automatic cleanup for a known model quirk: TranslateGemma sometimes outputs duplicate alternatives separated by "or" in the target language (e.g., "または" in Japanese, "o" in Spanish). Polyglot strips these automatically across 10+ languages.

## Performance expectations

README translation is sequential — each language is translated one at a time. For a typical README with 10-15 sections, expect roughly:

- **1-2 minutes per language** with `translategemma:12b`
- **30-60 seconds per language** with `translategemma:2b`
- Total time for 7 languages: approximately 7-14 minutes

Progress is reported per-language in the VS Code notification area.

## Output file naming

Output files follow the pattern `README.<lang-code>.md`:

```
README.md          (original, untouched)
README.ja.md       (Japanese)
README.zh.md       (Chinese)
README.es.md       (Spanish)
README.fr.md       (French)
README.hi.md       (Hindi)
README.it.md       (Italian)
README.pt-br.md    (Portuguese — Brazil)
```
