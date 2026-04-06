---
title: Beginners
description: A zero-to-talking walkthrough for first-time Voice Soundboard users.
sidebar:
  order: 99
---

A step-by-step guide for anyone new to Voice Soundboard. No prior TTS experience required.

## 1. What does this tool do?

Voice Soundboard turns text into spoken audio directly inside VS Code. You type (or select) text, pick a voice, and hear it played back through your speakers. It supports 48 voices across 8 languages, five built-in presets that change the speaking style, and a multi-speaker dialogue mode that lets you script conversations between characters and export them as WebVTT subtitle files.

Everything runs through an MCP (Model Context Protocol) server that the extension starts automatically. The default TTS engine, Kokoro, runs locally on your machine with no cloud dependency.

## 2. Prerequisites and installation

**You need:**

- **VS Code 1.85** or later
- **Node.js** (for the MCP server that runs behind the scenes)
- **Python 3** if you want the default local Kokoro TTS backend (recommended)

**Install the extension:**

1. Open VS Code
2. Go to the Extensions panel (`Ctrl+Shift+X`)
3. Search for **Voice Soundboard**
4. Click **Install**

When the extension activates for the first time, it checks whether Python and the Kokoro TTS package are installed. If anything is missing, a setup wizard appears with three choices:

- **Install Now** -- opens a terminal and runs the pip install for you (~100 MB one-time download)
- **Use API Key** -- switches to the cloud HTTP backend (requires an OpenAI or ElevenLabs API key)
- **Use Mock** -- silent mode, useful for testing or when you have no audio setup

After the initial setup, the server starts automatically on every VS Code launch (controlled by the `voiceSoundboard.autoStart` setting).

## 3. Basic usage

### Speak from the sidebar

1. Click the **microphone icon** in the VS Code activity bar (left edge)
2. The Soundboard sidebar opens with three tabs: **Speak**, **Voices**, and **Dialogue**
3. In the **Speak** tab, type text into the textarea
4. Choose a voice from the dropdown and adjust the speed slider (0.5x to 2.0x)
5. Click **Speak** -- audio plays through your default output device
6. Click **Stop** to interrupt playback at any time

### Speak selected text

1. Highlight any text in an open editor
2. Press `Ctrl+Shift+S` (or run **Voice Soundboard: Speak Selection** from the Command Palette)
3. The selected text is spoken using your current default voice and speed

### Use presets

Presets appear as buttons at the top of the Speak tab. Each preset adjusts the speaking style:

| Preset | Effect |
|--------|--------|
| Assistant | Clear, professional, moderate pace |
| Narrator | Warm, measured, documentary-style delivery |
| Announcer | Energetic, emphasis on key words |
| Storyteller | Expressive, varied pacing |
| Whisper | Soft, intimate, lower volume |

Click a preset button to apply it before speaking.

## 4. Key concepts

### Voices

There are 48 voices organized by language and gender. Each voice has a unique ID like `bm_george` or `af_sarah`. The **Voices** tab in the sidebar lets you browse, search, and filter voices. Click any voice to hear a preview, then set it as your default.

The Voices tab provides several ways to narrow down the list:

- **Search box** -- type part of a voice name or ID to filter instantly
- **Filter chips** -- quick filters for American, British, Japanese, Male, and Female voices
- **Preview button** -- each voice card has a Preview button that speaks a short sample so you can compare before choosing

### Status bar

The extension adds a status indicator to the VS Code status bar (bottom-right). It shows the current connection state:

- **Connecting** (spinning icon) -- the MCP server is starting up
- **Ready** (unmuted icon) -- the server is connected and ready to speak
- **Offline** (muted icon) -- the server is not running (autoStart is off, or it failed to start)
- **Setup** (gear icon) -- the TTS backend needs configuration (click to open the sidebar)

Click the status bar item at any time to toggle the sidebar panel.

### Backends

The TTS engine that converts text to audio is called a "backend." There are three options:

| Backend | Description |
|---------|-------------|
| `python` | Kokoro TTS running locally via Python. Free, private, no internet needed. This is the default. |
| `http` | Cloud TTS via OpenAI, ElevenLabs, or Azure. Requires an API key set in `voiceSoundboard.openaiApiKey`. Your text is sent to the cloud provider. |
| `mock` | Returns silent audio. Useful for testing the extension without a real TTS engine. |

Change the backend in VS Code Settings (`voiceSoundboard.backend`).

### MCP server

The extension communicates with TTS through an MCP server (`@mcptoolshop/voice-soundboard-mcp`) that it starts as a child process. You do not need to install or manage this server manually -- the extension handles it via `npx`.

## 5. Practical examples

### Read code comments aloud

1. Select a block comment in your editor
2. Press `Ctrl+Shift+S`
3. Hear the comment spoken -- useful for proofreading documentation

### Script a dialogue

1. Open the **Dialogue** tab in the sidebar
2. Write a script in `Speaker: Text` format:
   ```
   Alice: Hello, welcome to the demo.
   Bob: Thanks Alice, glad to be here.
   Alice: Let me show you how the voices work.
   ```
3. A **cast panel** appears below the script. Assign a different voice to each speaker.
4. Click **Play All** to hear the conversation played sequentially.

### Export subtitles

1. After writing a dialogue script, click **Export VTT**
2. The extension synthesizes every line, calculates cumulative timecodes from the audio durations, and saves a `.vtt` file
3. The exported WebVTT file uses voice tags (`<v Speaker>`) and works with video players, subtitle editors, and accessibility tools

## 6. Common issues and troubleshooting

### "Server not connected"

The MCP server failed to start. Check:

- Is `voiceSoundboard.autoStart` set to `true`? (It is by default.)
- If using the `python` backend, is Python 3 on your PATH? Set `voiceSoundboard.pythonPath` to an explicit path if auto-detection fails.
- Try reloading VS Code (`Ctrl+Shift+P` then "Developer: Reload Window").

### No audio plays

- **Windows:** Audio uses PowerShell's `SoundPlayer` -- make sure your speakers are not muted.
- **macOS:** Audio uses `afplay` -- check your output device in System Settings.
- **Linux:** Audio uses `paplay` (PulseAudio) with an `aplay` (ALSA) fallback. Ensure one of these is installed.

### Kokoro setup failed

If the pip install did not complete:

1. Open a terminal
2. Run `python3 -m pip install "voice-soundboard[kokoro]"` manually
3. Reload VS Code

### HTTP backend returns errors

- Verify your API key is set in `voiceSoundboard.openaiApiKey`
- Check that the key has TTS permissions with your provider
- The `http` backend sends your text to the configured cloud API -- ensure you have network access

### Status bar shows "Setup Required"

The extension detected that the TTS backend is not ready. Click the status bar item to open the sidebar, then click **Open Settings** in the setup banner. From there you can:

- Set a Python path if auto-detection failed (`voiceSoundboard.pythonPath`)
- Switch to the `http` backend and provide an API key
- Switch to `mock` for silent testing

## 7. Next steps

Once you are comfortable with the basics:

- **Explore all 48 voices** in the Voices tab -- filter by language or gender to find your favorites
- **Adjust speed** using the slider (0.5x for slow narration, up to 2.0x for quick playback)
- **Try different output formats** -- change `voiceSoundboard.format` to `mp3` or `ogg` if your workflow needs compressed audio
- **Read the [Reference](/vscode-voice-soundboard/handbook/reference/)** for the full command list, settings table, and backend details
- **Report issues** at [GitHub Issues](https://github.com/mcp-tool-shop-org/vscode-voice-soundboard/issues)
