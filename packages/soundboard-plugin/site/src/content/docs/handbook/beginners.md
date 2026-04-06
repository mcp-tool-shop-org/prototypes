---
title: For Beginners
description: New to Soundboard Plugin? Start here for a gentle introduction.
sidebar:
  order: 99
---

New to Soundboard Plugin? This page walks through everything from zero to your first spoken code walkthrough.

## What is this tool?

Soundboard Plugin is a Claude Code plugin that gives your AI coding assistant a voice. It takes text and turns it into spoken audio using a local text-to-speech engine called voice-soundboard. Claude can read code walkthroughs aloud, announce build results, narrate dialogue between characters, and think out loud while working.

Everything runs on your machine. No audio, text, or metadata leaves your computer unless you explicitly configure a remote voice backend. There are no cloud API calls and no telemetry.

The plugin exposes 5 slash commands (like `/soundboard:speak`) and 12 MCP tools (like `voice.dialogue`) that Claude Code calls automatically or that you can invoke directly.

## Who is this for?

Soundboard Plugin is built for developers who use Claude Code and want spoken feedback during their workflow. Typical users include:

- **Solo developers** who want hands-free build notifications while they work on something else.
- **Code reviewers** who prefer listening to a walkthrough of unfamiliar code rather than reading it silently.
- **Accessibility-focused users** who benefit from audio output alongside text.
- **Experimenters** who want to explore multi-speaker dialogue, emotion-aware speech, or ambient inner monologue features.

You do not need any prior experience with text-to-speech systems. If you can install a Python package and use Claude Code, you have everything you need.

## Prerequisites

Before you begin, make sure you have:

- **Python 3.10 or later** -- the plugin and the voice engine are both Python packages.
- **Windows** -- the primary platform. Playback uses `winsound` by default. The `sounddevice` backend is available as an alternative.
- **Claude Code** -- the plugin registers as a Claude Code plugin and communicates over stdio JSON-RPC.
- **voice-soundboard >= 2.5.0** -- the TTS synthesis engine that does the actual speech generation. Install it with the Kokoro backend for fully local inference (no API keys needed).
- **Working speakers or headphones** -- the plugin plays audio through your default audio output device.

## Your First 5 Minutes

### Step 1: Install the voice engine

Clone or navigate to the voice-soundboard repository, then install with the Kokoro extra:

```bash
cd voice-soundboard
pip install -e ".[kokoro]"
```

### Step 2: Install the plugin

Navigate to the soundboard-plugin repository and install it:

```bash
cd soundboard-plugin
pip install -e .
```

### Step 3: Register with Claude Code

Tell Claude Code where to find the plugin:

```bash
claude plugin add /path/to/soundboard-plugin
```

The plugin starts automatically as a stdio MCP server when Claude Code launches.

### Step 4: Verify it works

Open Claude Code and run:

```
/soundboard:speak Hello! I am your coding assistant.
```

You should hear spoken audio through your speakers. If you hear nothing, jump to the Troubleshooting section in [Common Mistakes](#common-mistakes) below.

### Step 5: Explore

Try a few more commands:

```
/soundboard:voice-status
```

Reports the active backend, available voices, and any errors. Start here if something seems wrong.

```
/soundboard:voices
```

Lists all 12 curated voices and the 6 preset shortcuts.

```
/soundboard:notify Build succeeded with 0 warnings
```

Spoken workflow notification using the announcer preset. The plugin picks the right emotion automatically.

## Common Mistakes

**Installing the plugin and engine in different Python environments.**
Both `voice-soundboard` and `soundboard-plugin` must be installed in the same Python environment. If you use virtual environments, activate the same one for both installs. Run `/soundboard:voice-status` -- if it says "engine unavailable," this is almost always the cause.

**Passing an unknown voice ID.**
Only the 12 curated voices are accepted (e.g., `am_fenrir`, `bf_emma`, `bm_george`). Passing any other ID results in a structured error. Run `/soundboard:voices` to see the full list.

**Forgetting to install the Kokoro backend.**
If you install voice-soundboard without the `[kokoro]` extra (`pip install -e .` instead of `pip install -e ".[kokoro]"`), the engine installs but has no TTS model available. Reinstall with `pip install -e ".[kokoro]"`.

**Expecting the inner monologue to work by default.**
The ambient inner monologue system is disabled by default. Set the environment variable `VOICE_SOUNDBOARD_AMBIENT_ENABLED=1` before launching Claude Code to enable it.

**Muted system audio.**
The plugin plays audio through your default output device. If your speakers are muted or the wrong device is selected, you will not hear anything. Use `voice.playback_diagnose` to play a test beep and verify your audio path.

## Next Steps

- [Getting Started](../getting-started/) -- detailed installation walkthrough with all prerequisites.
- [Commands](../commands/) -- full reference for all 5 slash commands and 12 MCP tools.
- [Voices](../voices/) -- browse the voice library, see emotion routing details, and configure environment variables.
- [Architecture](../architecture/) -- understand the speech pipeline, security model, and project structure.

## Glossary

| Term | Definition |
|------|-----------|
| **Claude Code** | Anthropic's CLI tool for AI-assisted development. Soundboard Plugin is a plugin for Claude Code. |
| **MCP** | Model Context Protocol. The communication standard Claude Code uses to talk to plugins over stdio JSON-RPC. |
| **voice-soundboard** | The underlying TTS synthesis engine. Soundboard Plugin is the Claude Code integration layer on top of it. |
| **Kokoro** | A local text-to-speech model. The default backend for voice-soundboard. Runs entirely on your machine with no API keys. |
| **Preset** | A named shortcut that maps to a specific voice and speed combination (e.g., "narrator" uses am_fenrir at 0.95x speed). |
| **Emotion routing** | Automatic detection of emotion from text context (neutral, serious, friendly, professional, calm, joy, urgent, whisper) that adjusts voice selection and delivery speed. |
| **SSML-lite** | A safe subset of Speech Synthesis Markup Language supported by the plugin. Allows fine-grained control with `<break>`, `<emphasis>`, and `<prosody>` tags. |
| **SFX tags** | Inline tags like `<ding>` and `<chime>` that generate pure-Python WAV tones at the correct position in speech output. |
| **Concurrency gate** | A semaphore that limits synthesis to one request at a time, preventing resource exhaustion. |
| **Playback worker** | A single-threaded audio queue that manages playback with replace, queue, or drop policies and a 30-second watchdog timer. |
| **Retention** | Automatic cleanup of old WAV files. Default is 240 minutes (4 hours). Configurable via `VOICE_SOUNDBOARD_RETENTION_MINUTES`. |
| **Inner monologue** | An ambient system where Claude can think out loud. Rate-limited, automatically redacted, and opt-in only. |
