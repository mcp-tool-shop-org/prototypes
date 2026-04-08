---
title: Troubleshooting
description: Common problems and how to fix them.
sidebar:
  order: 5
---

This page covers the most common issues when using Polyglot and how to resolve them.

## Ollama is not running

**Symptom:** The status bar shows a warning icon and "Polyglot" with a yellow background. Translations fail with "Ollama doesn't seem to be running."

**Fix:**
1. Run **Polyglot: Check Status** — it will offer to start Ollama automatically
2. If auto-start fails, open a terminal and run `ollama serve`
3. If Ollama is not installed, download it from [ollama.com](https://ollama.com)

Polyglot uses the `OllamaClient.ensureRunning()` method to attempt auto-start. On some systems, this may not work if Ollama is installed in a non-standard location.

## Model not installed

**Symptom:** Status bar shows a cloud-download icon. Translations fail with "model not found."

**Fix:**
1. Run **Polyglot: Check Status** — it will offer to download the model
2. The download is roughly 8 GB for `translategemma:12b` or 1.5 GB for `translategemma:2b`
3. Alternatively, run `ollama pull translategemma:12b` in a terminal

## Not enough VRAM

**Symptom:** Translation starts but Ollama crashes or returns garbage output.

**Fix:**
1. Open Settings and change `polyglot.model` to `translategemma:2b` (needs only 2 GB VRAM)
2. Close other GPU-intensive applications before translating
3. Check your GPU VRAM with `nvidia-smi` (NVIDIA) or Task Manager (Windows)

## Connection refused errors

**Symptom:** Error message mentions `ECONNREFUSED` or `fetch failed`.

**Fix:**
1. Verify Ollama is running: open `http://localhost:11434` in a browser — you should see "Ollama is running"
2. If you changed the Ollama port, update `polyglot.ollamaUrl` in VS Code Settings
3. If Ollama runs on a remote machine, set the URL to `http://<host>:<port>`

## Translation quality issues

**Symptom:** Output contains duplicate alternatives like "Translation A or Translation B."

**Cause:** TranslateGemma sometimes outputs multiple translation options separated by "or" in the target language.

**What Polyglot does:** The extension automatically strips these duplicates for 10+ languages (Japanese, Korean, Spanish, French, German, Russian, Hindi, Turkish, Thai, Vietnamese, and others).

**If cleanup misses something:** This is a known limitation of the TranslateGemma model. You can manually edit the output, or re-run the translation — results may differ slightly each time.

## "Select text first" warning

**Symptom:** Running Translate Selection shows "Select the text you want to translate."

**Fix:** You need to select (highlight) text in the editor before running the command. The keyboard shortcut `Ctrl+Alt+T` only appears when `editorHasSelection` is true.

## Translate File says "Save the file first"

**Symptom:** Running Translate File on an untitled file shows a save warning.

**Fix:** Save the file first. Polyglot needs a file path to write the translated file alongside the original (e.g., `file.ja.ext`).

## Translate README says "No README.md found"

**Symptom:** The command cannot find a README.md.

**Fix:** Open a workspace folder that contains a `README.md` at its root. The command looks specifically for `README.md` (case-sensitive) in the first workspace folder.

## Structured error codes

Polyglot classifies all errors into structured codes for consistent handling:

| Code | Meaning | Retryable |
|------|---------|-----------|
| `OLLAMA_UNAVAILABLE` | Cannot connect to Ollama | Yes |
| `MODEL_NOT_FOUND` | Translation model is not installed | Yes |
| `UNSUPPORTED_LANGUAGE` | The requested language code is not valid | No |
| `TRANSLATE_ERROR` | General translation failure | No |

Each error notification includes an action button (Check Status, Settings, or Help) relevant to the specific error type.
