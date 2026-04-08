---
title: Beginners
description: New to Polyglot? Start here for a complete introduction.
sidebar:
  order: 99
---

## What is this tool?

Polyglot is a VS Code extension that translates text using your local GPU. It runs [TranslateGemma](https://ai.google.dev/gemma/docs/core/translategemma), a translation model by Google, through [Ollama](https://ollama.com) — an open-source tool that runs AI models on your own computer.

With Polyglot you can:
- Select text in any editor and translate it in-place with a keyboard shortcut
- Translate an entire file into a new file alongside the original
- Batch-translate your project's README.md into 7+ languages at once

Everything runs locally. No data is sent to any cloud service, no API keys are needed, and no account is required.

## Who is this for?

Polyglot is built for:

- **Open-source maintainers** who want multilingual READMEs without paying for translation APIs
- **Developers working with international teams** who need quick text translations while coding
- **Privacy-conscious users** who cannot or prefer not to send text to cloud translation services
- **Technical writers** translating documentation into multiple languages
- **Anyone with a GPU** who wants fast, free, offline translation inside VS Code

You do NOT need to be a machine learning expert. Polyglot handles all the model setup automatically.

## Prerequisites

Before installing Polyglot, you need:

1. **VS Code 1.85 or later** — download from [code.visualstudio.com](https://code.visualstudio.com)
2. **Ollama** — download from [ollama.com](https://ollama.com) (available for Windows, macOS, and Linux)
3. **A GPU with enough VRAM:**
   - 12 GB for the full model (`translategemma:12b`) — best translation quality
   - 2 GB for the smaller model (`translategemma:2b`) — faster but lower quality
   - If you are unsure, check your GPU specs in Task Manager (Windows), `nvidia-smi` (Linux/Windows with NVIDIA), or System Information (macOS)

No other dependencies are required. Polyglot automatically downloads the translation model on first use.

## Your First 5 Minutes

Follow these steps to go from zero to your first translation:

### Minute 1: Install Ollama

1. Go to [ollama.com](https://ollama.com) and download the installer for your operating system
2. Run the installer — Ollama runs as a background service
3. Verify it works: open a terminal and run `ollama list` (it should respond without errors)

### Minute 2: Install Polyglot

1. Open VS Code
2. Click the Extensions icon in the activity bar (or press `Ctrl+Shift+X`)
3. Search for "Polyglot"
4. Click **Install** on "Polyglot -- Local GPU Translation" by mcp-tool-shop

### Minute 3: Check your setup

1. Look at the bottom-right of VS Code — you should see a "Polyglot" status indicator
2. If it shows a warning icon, click it — Polyglot will offer to start Ollama and download the model
3. The first-time model download is roughly 8 GB and takes a few minutes depending on your connection

### Minute 4: Translate some text

1. Open any file (or create a new one with some English text)
2. Select a sentence or paragraph
3. Press `Ctrl+Alt+T` (or `Cmd+Alt+T` on Mac)
4. Pick a language from the dropdown (try Japanese or Spanish)
5. The selected text is replaced with the translation

### Minute 5: Explore the sidebar

1. Click the **globe icon** in the activity bar on the left
2. Try the **Translate File** button — it creates a translated copy of the current file
3. Check the **Status** section below to see your Ollama connection details

## Common Mistakes

**Forgetting to select text before pressing Ctrl+Alt+T.** The shortcut only works when text is highlighted. If nothing happens, make sure you have an active selection.

**Trying to translate without Ollama running.** Polyglot cannot translate if Ollama is not running. Check the status bar indicator — if it shows a warning, click it to start Ollama.

**Using the 12b model with only 4-8 GB VRAM.** If your GPU does not have 12 GB of VRAM, switch to the smaller model. Open Settings (`Ctrl+,`), search for "polyglot.model", and change it to `translategemma:2b`.

**Running Translate README without a README.md.** The command looks for `README.md` (exact name, case-sensitive) in the workspace root. Make sure the file exists and you have the correct folder open.

**Expecting instant results for large files.** Translation is GPU-intensive. A full README translation to 7 languages can take 7-14 minutes. The progress notification shows which language is being processed.

## Next Steps

Once you have Polyglot working:

- **Customize your defaults** — open Settings and search for "polyglot" to change the model, Ollama URL, source language, or default target languages
- **Read the [Getting Started](/polyglot-vscode/handbook/getting-started/) guide** for a deeper walkthrough of each translation mode
- **Check the [Reference](/polyglot-vscode/handbook/reference/)** for the full list of 55 supported languages, all commands, and all settings
- **Read [Translate README](/polyglot-vscode/handbook/translate-readme/)** for details on how the README translation pipeline preserves your markdown structure
- **See [Troubleshooting](/polyglot-vscode/handbook/troubleshooting/)** if you run into any issues

## Glossary

| Term | Definition |
|------|-----------|
| **Ollama** | An open-source tool that runs AI models locally on your computer. Polyglot uses it as the translation backend. |
| **TranslateGemma** | A translation-specific AI model by Google, available in 2B and 12B parameter sizes. It supports 55 languages. |
| **VRAM** | Video RAM — the memory on your GPU. The translation model must fit in VRAM to run. 12 GB is needed for the full model, 2 GB for the smaller one. |
| **Model** | In this context, a trained AI file that Ollama loads to perform translation. Polyglot defaults to `translategemma:12b`. |
| **Command Palette** | The VS Code dropdown opened with `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac). Type "Polyglot" to see all available commands. |
| **Activity bar** | The vertical icon strip on the left edge of VS Code. The globe icon opens the Polyglot sidebar. |
| **Sidebar** | The panel that opens when you click the globe icon. It contains action buttons and a status tree. |
| **Status bar** | The horizontal bar at the very bottom of VS Code. Polyglot shows a connection indicator on the right side. |
| **In-place translation** | When Translate Selection replaces the selected text directly with its translation, rather than creating a new file. |
| **Batch translation** | The README command translates to multiple languages in one run, processing them sequentially. |
