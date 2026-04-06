---
title: Getting Started
description: Install the extension, choose a voice, and speak your first text.
sidebar:
  order: 1
---

This page walks you through installing Voice Soundboard, choosing a voice, and hearing your first synthesized speech.

## Prerequisites

- **VS Code** 1.85 or later
- **Node.js** (the extension spawns the MCP server via `npx`)
- **Python 3** (for the default Kokoro TTS backend — the extension will guide you through setup if missing)

The MCP Voice Soundboard server starts automatically when the extension activates. If Python or the Kokoro TTS package is not installed, a setup wizard walks you through installation or lets you switch to a cloud or mock backend.

## Installation

### From the Marketplace

Search for "Voice Soundboard" in the VS Code Extensions panel, or install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.vscode-voice-soundboard).

### From source

```bash
git clone https://github.com/mcp-tool-shop-org/vscode-voice-soundboard.git
cd vscode-voice-soundboard
npm ci
npm run build
```

Press `F5` in VS Code to launch the Extension Development Host.

## Speaking your first text

1. **Click the microphone icon** in the activity bar (left sidebar)
2. **Type some text** in the Speak tab input
3. **Click Speak** — audio plays through your default output device

### Speak selected text

1. Select any text in an editor
2. Press `Ctrl+Shift+S` (or run `Voice Soundboard: Speak Selection` from the Command Palette)
3. The selected text is spoken using the current voice and speed settings

## Choosing a voice

Click the **Voices** tab in the sidebar to browse all 48 voices. Voices are organized by language and gender. Click any voice to preview it, then set it as your default.

## Using presets

Presets adjust the speaking style without changing the voice:

| Preset | Style |
|--------|-------|
| Assistant | Clear, professional, moderate pace |
| Narrator | Warm, measured, documentary-style |
| Announcer | Energetic, emphasis on key words |
| Storyteller | Expressive, varied pacing |
| Whisper | Soft, intimate, lower volume |

Select a preset from the buttons shown at the top of the Speak tab in the sidebar panel.

## Next steps

See [Reference](/vscode-voice-soundboard/handbook/reference/) for the full command list, voice inventory, dialogue scripting, and WebVTT export.
